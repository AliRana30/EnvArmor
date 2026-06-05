import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { reason?: string; source?: string };

  await (prisma as any).bypassEvent.create({
    data: {
      userId: auth.user.id,
      reason: body.reason ?? "unspecified",
      source: body.source ?? "git-hook"
    }
  });

  return NextResponse.json({ ok: true });
}
