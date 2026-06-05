import { prisma } from "@/lib/prisma";
import { getRiskRange, estimateSavings, type RiskRange } from "@/lib/savings-engine";

export type LegacyUserPlan = "FREE" | "BASIC" | "PRO" | "TEAM";

export type LegacyUserRecord = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  plan: LegacyUserPlan;
  emailOnDetection: boolean;
  emailWeeklyDigest: boolean;
  emailRotationReminder: boolean;
  slackWebhookUrl: string | null;
};

export type LegacyDashboardSummary = {
  plan: LegacyUserPlan;
  projectCount: number;
};

export async function getLegacyUserByEmail(email: string): Promise<LegacyUserRecord | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      email: string;
      name: string | null;
      avatarUrl: string | null;
      plan: LegacyUserPlan;
      emailOnDetection: boolean;
      emailWeeklyDigest: boolean;
      emailRotationReminder: boolean;
      slackWebhookUrl: string | null;
    }>>`
      SELECT
        u."id",
        u."email",
        u."name",
        u."avatarUrl",
        u."plan",
        u."emailOnDetection",
        u."emailWeeklyDigest",
        u."emailRotationReminder",
        u."slackWebhookUrl"
      FROM "User" u
      WHERE u."email" = ${email}
      LIMIT 1
    `;

    const user = rows[0];
    if (!user) {
      return null;
    }

    return user;
  } catch (err: any) {
    console.error("⚠️ Database connection failed in getLegacyUserByEmail:", err.message);
    if (process.env.NODE_ENV === "development") {
      console.log("⚡ Dev Mode: Falling back to mock guest user profile");
      return {
        id: "dev-guest-user-id",
        email: email,
        name: email.split("@")[0],
        avatarUrl: null,
        plan: "FREE",
        emailOnDetection: true,
        emailWeeklyDigest: true,
        emailRotationReminder: true,
        slackWebhookUrl: null
      };
    }
    return null;
  }
}

export async function getLegacyDashboardSummary(email: string): Promise<LegacyDashboardSummary | null> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      plan: LegacyUserPlan;
      projectCount: number;
    }>>`
      SELECT
        u."plan",
        COALESCE(COUNT(p."id"), 0)::int AS "projectCount"
      FROM "User" u
      LEFT JOIN "Project" p ON p."userId" = u."id"
      WHERE u."email" = ${email}
      GROUP BY u."plan"
      LIMIT 1
    `;

    return rows[0] ?? null;
  } catch (err: any) {
    console.error("⚠️ Database connection failed in getLegacyDashboardSummary:", err.message);
    if (process.env.NODE_ENV === "development") {
      console.log("⚡ Dev Mode: Falling back to mock dashboard stats");
      return {
        plan: "FREE",
        projectCount: 1
      };
    }
    return null;
  }
}

export type ScanActivity = {
  id: string;
  projectName: string;
  secretType: string;
  severity: string;
  createdAt: Date;
  filePath: string;
  lineNumber: number;
  blocked: boolean;
  risk: RiskRange;
};

export async function getRecentActivity(email: string): Promise<ScanActivity[]> {
  try {
    const rows = await prisma.$queryRaw<Array<{
      id: string;
      projectName: string;
      secretType: string;
      severity: string;
      createdAt: Date;
      filePath: string;
      lineNumber: number;
      blocked: boolean;
    }>>`
      SELECT
        se."id",
        p."name" as "projectName",
        se."secretType",
        se."severity"::text,
        se."createdAt",
        se."filePath",
        se."lineNumber",
        se."blocked"
      FROM "ScanEvent" se
      JOIN "Project" p ON p."id" = se."projectId"
      JOIN "User" u ON u."id" = se."userId"
      WHERE u."email" = ${email}
      ORDER BY se."createdAt" DESC
      LIMIT 5
    `;

    return rows.map(row => ({
      id: row.id,
      projectName: row.projectName,
      secretType: row.secretType,
      severity: row.severity,
      createdAt: row.createdAt,
      filePath: row.filePath,
      lineNumber: row.lineNumber,
      blocked: row.blocked,
      risk: estimateSavings(row.secretType, row.severity as any, row.blocked)
    }));
  } catch (err: any) {
    console.error("⚠️ Database connection failed in getRecentActivity:", err.message);
    if (process.env.NODE_ENV === "development") {
      console.log("⚡ Dev Mode: Falling back to mock scan activity");
      return [
        {
          id: "mock-1",
          projectName: "My First Project",
          secretType: "STRIPE_SECRET",
          severity: "CRITICAL",
          createdAt: new Date(Date.now() - 3600000), // 1 hour ago
          filePath: "src/index.ts",
          lineNumber: 12,
          blocked: true,
          risk: estimateSavings("STRIPE_SECRET", "CRITICAL", true)
        },
        {
          id: "mock-2",
          projectName: "My First Project",
          secretType: "AWS_SECRET_KEY",
          severity: "CRITICAL",
          createdAt: new Date(Date.now() - 86400000), // 1 day ago
          filePath: ".env",
          lineNumber: 4,
          blocked: false,
          risk: estimateSavings("AWS_SECRET_KEY", "CRITICAL", false)
        }
      ];
    }
    return [];
  }
}