import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendRotationReminderEmail } from "@/lib/notifications/resend";

const MILESTONES = [30, 60, 90] as const;

function calculateAgeInDays(date: Date): number {
  const now = Date.now();
  const created = date.getTime();
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    where: { emailRotationReminder: true },
    select: { id: true, email: true }
  });

  let sent = 0;

  for (const user of users) {
    const oldSecrets = await prisma.secret.findMany({
      where: {
        project: { userId: user.id }
      },
      include: {
        project: { select: { name: true } }
      }
    });

    for (const secret of oldSecrets) {
      const age = calculateAgeInDays(secret.createdAt);
      const shouldSend = MILESTONES.some((milestone) => age >= milestone && age < milestone + 1);

      if (!shouldSend) {
        continue;
      }

      await sendRotationReminderEmail({
        to: user.email,
        secretType: secret.name,
        ageInDays: age,
        projectName: secret.project.name
      });
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
