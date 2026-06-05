import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { estimateCostSaved } from "@/lib/savings";
import { checkRateLimit } from "@/lib/rate-limit";
import { getApiUser } from "@/lib/api-auth";
import { sendSecretDetectedEmail } from "@/lib/notifications/resend";
import { sendSlackDetectionAlert } from "@/lib/notifications/slack";
import { getLegacyUserByEmail } from "@/lib/legacy-user";

type ScanEventBody = {
  secretType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  filePath: string;
  lineNumber: number;
  blocked: boolean;
  projectSlug?: string;
};

type ScanEventBatchBody = {
  events?: ScanEventBody[];
} & Partial<ScanEventBody>;

async function resolveProjectId(userId: string, projectSlug?: string): Promise<string> {
  if (projectSlug) {
    const project = await prisma.project.findFirst({
      where: { userId, slug: projectSlug },
      select: { id: true }
    });

    if (project) {
      return project.id;
    }
    
    // Auto-create project if slug is provided but not found
    try {
      const created = await prisma.project.create({
        data: {
          userId,
          name: projectSlug, // Use slug as name (e.g. repo name)
          slug: projectSlug,
          description: `Auto-created from CLI scan of ${projectSlug}`
        },
        select: { id: true }
      });
      return created.id;
    } catch {
      // Race condition or invalid slug, fallback to default
    }
  }

  const existing = await prisma.project.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true }
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.project.create({
    data: {
      userId,
      name: "CLI Scans",
      slug: "cli-scans",
      description: "Auto-created project for CLI scan events"
    },
    select: { id: true }
  });

  return created.id;
}

export async function POST(request: Request) {
  const auth = await getApiUser(request);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await checkRateLimit(auth.user.id, auth.user.plan, "scan-events");
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", remaining: rateLimit.remaining, resetAt: rateLimit.resetAt },
      { status: 429 }
    );
  }

  const body = (await request.json()) as ScanEventBatchBody & { repository?: string; branch?: string };
  const incomingEvents = Array.isArray(body.events)
    ? body.events
    : body.secretType
      ? [body as ScanEventBody]
      : [];

  if (incomingEvents.length === 0) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userPreferences = auth.user.email ? await getLegacyUserByEmail(auth.user.email) : null;

  const createdEvents: Array<{ event: unknown; estimatedCostSaved: number }> = [];
  for (const eventBody of incomingEvents) {
    if (!eventBody.secretType || !eventBody.severity || !eventBody.filePath || !eventBody.lineNumber) {
      continue;
    }

    // Use the repository name from the body if provided, otherwise fallback to projectSlug or default
    const projectSlug = body.repository || eventBody.projectSlug;
    const projectId = await resolveProjectId(auth.user.id, projectSlug);
    const estimatedCostSaved = estimateCostSaved(eventBody.secretType, eventBody.severity);

    const event = await prisma.scanEvent.create({
      data: {
        userId: auth.user.id,
        projectId,
        secretType: eventBody.secretType,
        severity: eventBody.severity,
        filePath: eventBody.filePath,
        lineNumber: eventBody.lineNumber,
        blocked: eventBody.blocked,
        estimatedCostSaved
      }
    });

    createdEvents.push({ event, estimatedCostSaved });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { name: true }
    });

    if (userPreferences?.emailOnDetection) {
      void sendSecretDetectedEmail({
        to: userPreferences.email,
        projectName: project?.name ?? "Unknown project",
        filePath: eventBody.filePath,
        secretType: eventBody.secretType,
        estimatedSavings: estimatedCostSaved
      }).catch(() => {
        // Notifications should not block scan ingestion.
      });
    }

    if (userPreferences?.slackWebhookUrl) {
      void sendSlackDetectionAlert({
        webhookUrl: userPreferences.slackWebhookUrl,
        projectName: project?.name ?? "Unknown project",
        secretType: eventBody.secretType,
        severity: eventBody.severity,
        filePath: eventBody.filePath,
        estimatedSavings: estimatedCostSaved
      }).catch(() => {
        // Slack webhook failures should not block scan ingestion.
      });
    }
  }

  return NextResponse.json({ createdEvents });
}
