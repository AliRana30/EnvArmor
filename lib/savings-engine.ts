import { prisma } from "@/lib/prisma";
import type { Severity } from "@prisma/client";

export type RiskRange = {
  low: number;
  high: number;
  basis: string;
};

export type SavingsEstimate = {
  low: number;
  high: number;
  basis: string;
};

export type SavingsSummary = {
  totalUSDLow: number;
  totalUSDHigh: number;
  bySecretTypeLow: Record<string, number>;
  bySecretTypeHigh: Record<string, number>;
  byMonthLow: Record<string, number>;
  byMonthHigh: Record<string, number>;
  blockedCount: number;
  bypassCount: number;
};

export function getRiskRange(secretType: string): RiskRange {
  const t = secretType.toUpperCase();
  
  if (t.includes("AWS")) {
    return { low: 50, high: 5000, basis: "Compute/S3 abuse, unexpected billing" };
  }
  if (t.includes("STRIPE_SECRET") || t.includes("PAYMENT")) {
    return { low: 100, high: 10000, basis: "Unauthorized charges, chargebacks" };
  }
  if (t.includes("STRIPE_PUBLISHABLE") || t.includes("PUBLISHABLE")) {
    return { low: 0, high: 20, basis: "Client-side key, limited blast radius" };
  }
  if (t.includes("OPENAI") || t.includes("AI_API") || t.includes("ANTHROPIC") || t.includes("GEMINI") || t.includes("MISTRAL") || t.includes("DEEPSEEK")) {
    return { low: 10, high: 1000, basis: "Token consumption abuse" };
  }
  if (t.includes("GITHUB_TOKEN") || t === "GITHUB_TOKEN") {
    return { low: 0, high: 500, basis: "Repo access, CI abuse" };
  }
  if (t.includes("GITHUB_PAT") || t === "GITHUB_PAT") {
    return { low: 50, high: 2000, basis: "Full account access scope" };
  }
  if (t.includes("DATABASE") || t.includes("POSTGRES") || t.includes("MYSQL") || t.includes("MONGO") || t.includes("REDIS")) {
    return { low: 500, high: 50000, basis: "Data breach, regulatory fines" };
  }
  if (t.includes("JWT") || t.includes("AUTH") || t.includes("SUPABASE") || t.includes("CLERK") || t.includes("APP_SECRET")) {
    return { low: 200, high: 5000, basis: "Auth bypass, session forgery" };
  }
  if (t.includes("SENDGRID") || t.includes("EMAIL") || t.includes("SMTP") || t.includes("MAIL")) {
    return { low: 5, high: 200, basis: "Email spam abuse" };
  }
  if (t.includes("TWILIO") || t.includes("NOTIFICATION")) {
    return { low: 10, high: 500, basis: "SMS/call billing fraud" };
  }
  if (t.includes("FIREBASE")) {
    return { low: 20, high: 1500, basis: "Database and auth access" };
  }
  if (t.includes("GOOGLE") || t.includes("OAUTH")) {
    return { low: 10, high: 1000, basis: "OAuth impersonation" };
  }
  
  return { low: 0, high: 100, basis: "Unknown type — estimated" };
}

const SEVERITY_MULTIPLIERS: Record<Severity, number> = {
  LOW: 0.05,
  MEDIUM: 0.3,
  HIGH: 0.7,
  CRITICAL: 1.0
};

const BLOCKED_MULTIPLIERS = {
  blocked: 1.0,
  detected: 0.3
};

export function estimateSavings(secretType: string, severity: Severity, blocked = true): SavingsEstimate {
  const range = getRiskRange(secretType);
  const severityMultiplier = SEVERITY_MULTIPLIERS[severity] ?? 0.3;
  const blockedMultiplier = blocked ? BLOCKED_MULTIPLIERS.blocked : BLOCKED_MULTIPLIERS.detected;
  
  return {
    low: Math.round(range.low * severityMultiplier * blockedMultiplier),
    high: Math.round(range.high * severityMultiplier * blockedMultiplier),
    basis: range.basis
  };
}

export async function calculateTotalSavings(userId: string): Promise<SavingsSummary> {
  const [scanEvents, bypassEvents] = await Promise.all([
    prisma.scanEvent.findMany({
      where: { userId },
      select: {
        secretType: true,
        severity: true,
        blocked: true,
        createdAt: true,
        estimatedCostSaved: true
      }
    }),
    (prisma as any).bypassEvent ? (prisma as any).bypassEvent.count({ where: { userId } }) : Promise.resolve(0)
  ]);

  const bySecretTypeLow: Record<string, number> = {};
  const bySecretTypeHigh: Record<string, number> = {};
  const byMonthLow: Record<string, number> = {};
  const byMonthHigh: Record<string, number> = {};
  let totalUSDLow = 0;
  let totalUSDHigh = 0;
  let blockedCount = 0;

  for (const event of scanEvents) {
    const savings = estimateSavings(event.secretType, event.severity, event.blocked);
    totalUSDLow += savings.low;
    totalUSDHigh += savings.high;
    
    bySecretTypeLow[event.secretType] = (bySecretTypeLow[event.secretType] ?? 0) + savings.low;
    bySecretTypeHigh[event.secretType] = (bySecretTypeHigh[event.secretType] ?? 0) + savings.high;
    
    const monthKey = event.createdAt.toISOString().slice(0, 7);
    byMonthLow[monthKey] = (byMonthLow[monthKey] ?? 0) + savings.low;
    byMonthHigh[monthKey] = (byMonthHigh[monthKey] ?? 0) + savings.high;

    if (event.blocked) {
      blockedCount += 1;
    }
  }

  return {
    totalUSDLow,
    totalUSDHigh,
    bySecretTypeLow,
    bySecretTypeHigh,
    byMonthLow,
    byMonthHigh,
    blockedCount,
    bypassCount: bypassEvents
  };
}

export async function calculateGlobalSavings(): Promise<{
  totalUSDLow: number;
  totalUSDHigh: number;
  blockedCount: number;
  commonSecretTypes: Array<{ secretType: string; count: number }>;
}> {
  const scanEvents = await prisma.scanEvent.findMany({
    select: { secretType: true, severity: true, blocked: true }
  });

  const totals: Record<string, number> = {};
  let totalUSDLow = 0;
  let totalUSDHigh = 0;
  let blockedCount = 0;

  for (const event of scanEvents) {
    const savings = estimateSavings(event.secretType, event.severity, event.blocked);
    totalUSDLow += savings.low;
    totalUSDHigh += savings.high;
    
    totals[event.secretType] = (totals[event.secretType] ?? 0) + 1;
    if (event.blocked) {
      blockedCount += 1;
    }
  }

  return {
    totalUSDLow,
    totalUSDHigh,
    blockedCount,
    commonSecretTypes: Object.entries(totals)
      .map(([secretType, count]) => ({ secretType, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 5)
  };
}
