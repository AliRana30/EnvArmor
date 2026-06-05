import { NextResponse } from "next/server";

type DemoFinding = {
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  line: number;
  snippet: string;
  risk: {
    low: number;
    high: number;
    basis: string;
  };
};

type PatternDefinition = {
  type: string;
  severity: DemoFinding["severity"];
  regex: RegExp;
  risk: DemoFinding["risk"];
};

const patterns: PatternDefinition[] = [
  {
    type: "Google / Gemini API Key",
    severity: "HIGH",
    regex: /AIza[0-9A-Za-z-_]{35}/,
    risk: { low: 10, high: 1000, basis: "Token consumption abuse" }
  },
  {
    type: "Supabase Service Role Key",
    severity: "CRITICAL",
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9._-]{50,}/,
    risk: { low: 200, high: 5000, basis: "Auth bypass, session forgery" }
  },
  {
    type: "Supabase / Postgrest URL",
    severity: "MEDIUM",
    regex: /https:\/\/[a-z0-9]{20}\.supabase\.co/,
    risk: { low: 200, high: 5000, basis: "Auth bypass, session forgery" }
  },
  {
    type: "Redis Connection URL",
    severity: "HIGH",
    regex: /rediss?:\/\/[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+:[0-9]+/,
    risk: { low: 500, high: 50000, basis: "Data breach, regulatory fines" }
  },
  {
    type: "Redis / Upstash Token",
    severity: "MEDIUM",
    regex: /UPSTASH_REDIS_REST_TOKEN\s*=\s*[a-zA-Z0-9]+/,
    risk: { low: 200, high: 5000, basis: "Auth bypass, session forgery" }
  },
  {
    type: "Generic API Key / Token",
    severity: "MEDIUM",
    regex: /(?:^|\b)(?:API_KEY|SECRET|TOKEN|AUTH|PASS|PASSWORD)\s*=\s*[^\s#]{12,}/i,
    risk: { low: 0, high: 100, basis: "Unknown type — estimated" }
  },
  {
    type: "OpenAI API Key",
    severity: "HIGH",
    regex: /sk-[a-zA-Z0-9]{48}/,
    risk: { low: 10, high: 1000, basis: "Token consumption abuse" }
  },
  {
    type: "Stripe Secret Key",
    severity: "CRITICAL",
    regex: /sk_(?:live|test)_[a-zA-Z0-9]{24,}/,
    risk: { low: 100, high: 10000, basis: "Unauthorized charges, chargebacks" }
  },
  {
    type: "AWS Access Key",
    severity: "CRITICAL",
    regex: /(?:AKIA|ASIA)[0-9A-Z]{16}/,
    risk: { low: 50, high: 5000, basis: "Compute/S3 abuse, unexpected billing" }
  },
  {
    type: "Database URL",
    severity: "HIGH",
    regex: /(?:postgresql|mongodb|mysql|sqlite):\/\/[^\s]+/,
    risk: { low: 500, high: 50000, basis: "Data breach, regulatory fines" }
  }
];

export async function POST(request: Request) {
  const body = (await request.json()) as { content?: string };
  const content = body.content?.toString() ?? "";

  if (!content.trim()) {
    return NextResponse.json({ error: "No content provided" }, { status: 400 });
  }

  const lines = content.split(/\r?\n/);
  const findings: DemoFinding[] = [];

  lines.forEach((line, index) => {
    patterns.forEach((pattern) => {
      if (pattern.regex.test(line)) {
        findings.push({
          type: pattern.type,
          severity: pattern.severity,
          line: index + 1,
          snippet: line.slice(0, 180),
          risk: pattern.risk
        });
      }
    });
  });

  const totalExposureLow = findings.reduce((sum, finding) => sum + finding.risk.low, 0);
  const totalExposureHigh = findings.reduce((sum, finding) => sum + finding.risk.high, 0);

  return NextResponse.json({ findings, totalExposureLow, totalExposureHigh });
}
