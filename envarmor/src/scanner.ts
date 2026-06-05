import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "glob";
import { locateGitRepository } from "./git.js";
import { CONTEXTUAL_PATTERNS, STATIC_PATTERNS, ENV_KEY_PATTERNS, getRiskEstimate, type Severity, type RiskEstimate } from "./patterns.js";

export type ScanFinding = {
  file: string;
  line: number;
  type: string;
  severity: Severity;
  risk: RiskEstimate;
  blocked?: boolean;
};

export type ScanResult = {
  findings: ScanFinding[];
  totalExposureLow: number;
  totalExposureHigh: number;
  scannedFiles: number;
};

export type ScanOptions = {
  cwd?: string;
  staged?: boolean;
  paths?: string[];
};

const DEFAULT_IGNORES = [
  "**/node_modules/**",
  "**/.git/**",
  "**/dist/**",
  "**/build/**",
  "**/package-lock.json",
  "**/pnpm-lock.yaml",
  "**/yarn.lock",
  "**/bun.lockb"
];

function entropy(text: string): number {
  const counts = new Map<string, number>();

  for (const char of text) {
    counts.set(char, (counts.get(char) ?? 0) + 1);
  }

  let score = 0;
  for (const count of counts.values()) {
    const probability = count / text.length;
    score -= probability * Math.log2(probability);
  }

  return score;
}

function scanLineStatic(line: string, file: string, lineNumber: number): ScanFinding[] {
  const findings: ScanFinding[] = [];

  for (const pattern of STATIC_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    if (regex.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        type: pattern.type,
        severity: pattern.severity,
        risk: getRiskEstimate(pattern.type)
      });
    }
  }

  return findings;
}

function scanLineEnvKey(line: string, file: string, lineNumber: number): ScanFinding[] {
  const findings: ScanFinding[] = [];

  // Only trigger if it looks like an assignment (KEY=value or KEY: value)
  // or if it's in a .env file (any mention of the key)
  const isEnvFile = file.endsWith(".env") || file.includes(".env.");
  const hasAssignment = line.includes("=") || line.includes(":");

  if (!isEnvFile && !hasAssignment) {
    return [];
  }

  for (const pattern of ENV_KEY_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    if (regex.test(line)) {
      findings.push({
        file,
        line: lineNumber,
        type: pattern.type,
        severity: pattern.severity,
        risk: getRiskEstimate(pattern.type)
      });
    }
  }

  return findings;
}

function scanLineContextual(line: string, file: string, lineNumber: number): ScanFinding[] {
  const findings: ScanFinding[] = [];

  if (CONTEXTUAL_PATTERNS.awsSecret.contextRegex.test(line)) {
    const match = line.match(CONTEXTUAL_PATTERNS.awsSecret.valueRegex);
    if (match?.[1] && entropy(match[1]) >= 3.5) {
      findings.push({
        file,
        line: lineNumber,
        type: CONTEXTUAL_PATTERNS.awsSecret.type,
        severity: CONTEXTUAL_PATTERNS.awsSecret.severity,
        risk: getRiskEstimate(CONTEXTUAL_PATTERNS.awsSecret.type)
      });
    }
  }

  if (CONTEXTUAL_PATTERNS.jwtSecret.contextRegex.test(line)) {
    const match = line.match(CONTEXTUAL_PATTERNS.jwtSecret.valueRegex);
    if (match?.[1] && entropy(match[1]) >= 3.5) {
      findings.push({
        file,
        line: lineNumber,
        type: CONTEXTUAL_PATTERNS.jwtSecret.type,
        severity: CONTEXTUAL_PATTERNS.jwtSecret.severity,
        risk: getRiskEstimate(CONTEXTUAL_PATTERNS.jwtSecret.type)
      });
    }
  }

  return findings;
}

function isLikelyText(path: string): boolean {
  const blockedExtensions = [
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".ico",
    ".pdf",
    ".zip",
    ".gz",
    ".mp4",
    ".mov",
    ".woff",
    ".woff2"
  ];
  return !blockedExtensions.some((ext) => path.endsWith(ext));
}

function scanFiles(files: string[]): ScanResult {
  const findings: ScanFinding[] = [];

  for (const file of files) {
    let content = "";

    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }

    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      findings.push(...scanLineStatic(line, file, lineNumber));
      findings.push(...scanLineContextual(line, file, lineNumber));
      findings.push(...scanLineEnvKey(line, file, lineNumber));
    });
  }

  const unique = new Map<string, ScanFinding>();
  for (const finding of findings) {
    const key = `${finding.file}:${finding.line}:${finding.type}`;
    if (!unique.has(key)) {
      unique.set(key, finding);
    }
  }

  const deduped = [...unique.values()];
  const totalExposureLow = deduped.reduce(
    (sum, finding) => sum + finding.risk.low,
    0
  );
  const totalExposureHigh = deduped.reduce(
    (sum, finding) => sum + finding.risk.high,
    0
  );

  return {
    findings: deduped,
    totalExposureLow,
    totalExposureHigh,
    scannedFiles: files.length
  };
}

function scanStagedFiles(cwd: string): ScanResult {
  const repo = locateGitRepository(cwd);
  const root = repo?.worktreeRoot ?? cwd;
  let stagedFiles: string[] = [];

  try {
    const output = execFileSync(
      "git",
      ["diff", "--cached", "--name-only", "--diff-filter=ACMRTUXB"],
      {
        cwd: root,
        encoding: "utf8"
      }
    );
    stagedFiles = output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter(isLikelyText)
      .map((file) => join(root, file));
  } catch {
    stagedFiles = [];
  }

  return scanFiles(stagedFiles);
}

export function scanWorkspace(options: ScanOptions = {}): ScanResult {
  const cwd = options.cwd ?? ".";

  if (options.staged) {
    return scanStagedFiles(cwd);
  }

  const files = (options.paths && options.paths.length > 0
    ? options.paths.map((file) => join(cwd, file))
    : globSync("**/*", {
        cwd,
        nodir: true,
        absolute: true,
        ignore: DEFAULT_IGNORES
      }))
    .filter(isLikelyText);

  return scanFiles(files);
}

export function scanDirectory(targetPath = "."): ScanResult {
  return scanWorkspace({ cwd: targetPath });
}
