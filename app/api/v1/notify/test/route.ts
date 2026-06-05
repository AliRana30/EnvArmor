import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { sendWeeklyDigestEmail } from "@/lib/notifications/resend";

export async function POST(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await sendWeeklyDigestEmail({
      to: auth.user.email,
      blockedCount: 3,
      projectCount: 1,
      estimatedSavings: 920,
      criticalCount: 1
    });

    return NextResponse.json({ ok: true, message: "Test notification sent" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to send test email" },
      { status: 500 }
    );
  }
}
