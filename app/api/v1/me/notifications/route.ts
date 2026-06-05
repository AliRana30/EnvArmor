import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { hasAtLeastPlan } from "@/lib/plan-gate";
import { getLegacyUserByEmail } from "@/lib/legacy-user";

async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.email ?? null;
}

export async function PATCH(request: Request) {
  const email = await getCurrentUserEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    emailOnDetection?: boolean;
    emailWeeklyDigest?: boolean;
    emailRotationReminder?: boolean;
    slackWebhookUrl?: string | null;
  };

  const existing = await getLegacyUserByEmail(email);
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (
    typeof body.slackWebhookUrl === "string" &&
    body.slackWebhookUrl.trim().length > 0 &&
    !hasAtLeastPlan(existing.plan, "PRO")
  ) {
    return NextResponse.json({ error: "Slack alerts are available for PRO and TEAM plans" }, { status: 402 });
  }

  const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'User'
  `;

  const existingColumns = new Set(columns.map((column) => column.column_name));
  const updates: string[] = [];
  const values: Array<boolean | string | null> = [];

  if (existingColumns.has("emailOnDetection") && typeof body.emailOnDetection === "boolean") {
    updates.push(`"emailOnDetection" = $${values.length + 1}`);
    values.push(body.emailOnDetection);
  }

  if (existingColumns.has("emailWeeklyDigest") && typeof body.emailWeeklyDigest === "boolean") {
    updates.push(`"emailWeeklyDigest" = $${values.length + 1}`);
    values.push(body.emailWeeklyDigest);
  }

  if (existingColumns.has("emailRotationReminder") && typeof body.emailRotationReminder === "boolean") {
    updates.push(`"emailRotationReminder" = $${values.length + 1}`);
    values.push(body.emailRotationReminder);
  }

  if (existingColumns.has("slackWebhookUrl")) {
    const nextSlackWebhookUrl =
      typeof body.slackWebhookUrl === "string"
        ? body.slackWebhookUrl.trim() || null
        : body.slackWebhookUrl === null
          ? null
          : undefined;

    if (nextSlackWebhookUrl !== undefined) {
      updates.push(`"slackWebhookUrl" = $${values.length + 1}`);
      values.push(nextSlackWebhookUrl);
    }
  }

  if (updates.length > 0) {
    await prisma.$executeRawUnsafe(`UPDATE "User" SET ${updates.join(", ")} WHERE "email" = $${values.length + 1}`, ...values, email);
  }

  return NextResponse.json({
    preferences: {
      emailOnDetection: typeof body.emailOnDetection === "boolean" ? body.emailOnDetection : existing.emailOnDetection,
      emailWeeklyDigest: typeof body.emailWeeklyDigest === "boolean" ? body.emailWeeklyDigest : existing.emailWeeklyDigest,
      emailRotationReminder:
        typeof body.emailRotationReminder === "boolean" ? body.emailRotationReminder : existing.emailRotationReminder,
      slackWebhookUrl:
        typeof body.slackWebhookUrl === "string"
          ? body.slackWebhookUrl.trim() || null
          : body.slackWebhookUrl === null
            ? null
            : existing.slackWebhookUrl
    }
  });
}
