import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getApiUser } from "@/lib/api-auth";
import { calculateTotalSavings } from "@/lib/savings-engine";

export async function GET(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summary, topSecretType, user] = await Promise.all([
    calculateTotalSavings(auth.user.id),
    prisma.scanEvent.groupBy({
      by: ["secretType"],
      where: { userId: auth.user.id },
      _count: { secretType: true },
      orderBy: { _count: { secretType: "desc" } },
      take: 1
    }),
    prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { createdAt: true, email: true, name: true }
    })
  ]);

  const displayName = user?.name ?? user?.email?.split("@")[0] ?? "developer";

  return NextResponse.json({
    totalSaved: summary.totalUSDLow,
    secretsBlocked: summary.blockedCount,
    topSecretType: topSecretType[0]?.secretType ?? "None",
    memberSince: user?.createdAt ?? new Date().toISOString(),
    username: displayName
  });
}
