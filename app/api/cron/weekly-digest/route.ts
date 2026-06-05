import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWeeklyDigestEmail } from "@/lib/notifications/resend";

function sevenDaysAgo(): Date {
  const date = new Date();
  date.setDate(date.getDate() - 7);
  return date;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { emailWeeklyDigest: true },
    select: {
      id: true,
      email: true,
      plan: true,
      projects: { select: { id: true } }
    }
  });

  let sent = 0;
  const since = sevenDaysAgo();

  for (const user of users) {
    const weeklyEvents = await prisma.scanEvent.findMany({
      where: { userId: user.id, createdAt: { gte: since } },
      select: { estimatedCostSaved: true, severity: true, blocked: true }
    });

    const hasActivity = weeklyEvents.length > 0;
    const isPaid = user.plan !== "FREE";

    if (!hasActivity && !isPaid) {
      continue;
    }

    const estimatedSavings = weeklyEvents.reduce((sum, e) => sum + e.estimatedCostSaved, 0);
    const blockedCount = weeklyEvents.filter((e) => e.blocked).length;
    const criticalCount = weeklyEvents.filter((e) => e.severity === "CRITICAL").length;

    await sendWeeklyDigestEmail({
      to: user.email,
      blockedCount,
      projectCount: user.projects.length,
      estimatedSavings,
      criticalCount
    });

    sent += 1;
  }

  return NextResponse.json({ ok: true, sent });
}
