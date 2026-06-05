import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { projectLimitForPlan } from "@/lib/plan-gate";
import { createClient } from "@/lib/supabase/server";
import { calculateTotalSavings } from "@/lib/savings-engine";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();

  if (!authUser?.email) {
    return null;
  }

  return prisma.user.findUnique({
    where: { email: authUser.email },
    select: { id: true, email: true, name: true, avatarUrl: true, plan: true, apiKey: true }
  });
}

export async function GET(request: Request) {
  let userId: string;

  const auth = await getApiUser(request);
  if (auth) {
    userId = auth.user.id;
  } else {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = sessionUser.id;
  }

  const projects = await prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      createdAt: true,
      _count: { select: { scanEvents: true } }
    }
  });

  const projectIds = projects.map((project) => project.id);
  const totals = await prisma.scanEvent.groupBy({
    by: ["projectId"],
    where: { projectId: { in: projectIds } },
    _sum: { estimatedCostSaved: true }
  });

  const savingsMap = new Map(totals.map((entry) => [entry.projectId, entry._sum.estimatedCostSaved ?? 0]));

  return NextResponse.json({
    projects: projects.map((project) => ({
      ...project,
      totalSavingsUSD: savingsMap.get(project.id) ?? 0
    }))
  });
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  const body = (await request.json()) as { name?: string; description?: string };
  if (!body.name) {
    return NextResponse.json({ error: "Project name is required" }, { status: 400 });
  }

  const currentCount = await prisma.project.count({ where: { userId: sessionUser.id } });
  const limit = projectLimitForPlan(sessionUser.plan);
  if (limit !== null && currentCount >= limit) {
    return NextResponse.json(
      { error: "Your plan does not allow more projects. Upgrade to continue." },
      { status: 402 }
    );
  }

  const baseSlug = slugify(body.name);
  let slug = baseSlug;
  let suffix = 1;

  while (
    await prisma.project.findFirst({
      where: { userId: sessionUser.id, slug }
    })
  ) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const project = await prisma.project.create({
    data: {
      userId: sessionUser.id,
      name: body.name,
      description: body.description,
      slug
    }
  });

  return NextResponse.json({ project }, { status: 201 });
}
