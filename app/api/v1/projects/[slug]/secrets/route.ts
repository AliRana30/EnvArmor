import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { hasAtLeastPlan } from "@/lib/plan-gate";
import { encryptSecret, decryptSecret, maskSecret } from "@/lib/secret-crypto";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ slug: string }> };

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
    select: { id: true, plan: true }
  });
}

async function requireProjectMember(userId: string, slug: string) {
  const project = await prisma.project.findFirst({
    where: {
      slug,
      OR: [{ userId }, { teamMembers: { some: { userId } } }]
    },
    select: { id: true, userId: true, name: true, slug: true }
  });

  return project;
}

export async function GET(_request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();
  const { slug } = await context.params;

  if (!sessionUser) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  if (!hasAtLeastPlan(sessionUser.plan, "BASIC")) {
    return NextResponse.json({ error: "Upgrade to BASIC to access secrets vault." }, { status: 402 });
  }

  const project = await requireProjectMember(sessionUser.id, slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  const secrets = await prisma.secret.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    project,
    secrets: secrets.map((secret) => {
      const decryptedValue = decryptSecret(secret.value);
      return {
        id: secret.id,
        name: secret.name,
        environment: secret.environment,
        version: secret.version,
        createdAt: secret.createdAt,
        value: maskSecret(decryptedValue),
        decryptedValue
      };
    })
  });
}

export async function PUT(request: Request, context: RouteContext) {
  const sessionUser = await getSessionUser();
  const { slug } = await context.params;

  if (!sessionUser) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  if (!hasAtLeastPlan(sessionUser.plan, "BASIC")) {
    return NextResponse.json({ error: "Upgrade to BASIC to store secrets." }, { status: 402 });
  }

  const project = await requireProjectMember(sessionUser.id, slug);
  if (!project) {
    return NextResponse.json({ error: "Project not found or access denied" }, { status: 404 });
  }

  const body = (await request.json()) as {
    name?: string;
    value?: string;
    environment?: "DEV" | "STAGING" | "PROD";
  };

  if (!body.name || !body.value || !body.environment) {
    return NextResponse.json({ error: "name, value, and environment are required" }, { status: 400 });
  }

  const encryptedValue = encryptSecret(body.value);
  const existing = await prisma.secret.findFirst({
    where: { projectId: project.id, name: body.name, environment: body.environment }
  });

  const secret = existing
    ? await prisma.secret.update({
        where: { id: existing.id },
        data: {
          value: encryptedValue,
          version: existing.version + 1
        }
      })
    : await prisma.secret.create({
        data: {
          projectId: project.id,
          name: body.name,
          value: encryptedValue,
          environment: body.environment,
          version: 1
        }
      });

  return NextResponse.json({
    secret: {
      ...secret,
      value: maskSecret(body.value),
      decryptedValue: body.value
    }
  });
}
