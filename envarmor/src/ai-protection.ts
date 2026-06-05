import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { RegexDetector, EntropyDetector } from "./detectors.js";

const AI_IGNORE_PATTERNS = [
  ".env*", 
  "*.pem", 
  "*.key", 
  "*.crt",
  "*.p12",
  "*.pfx",
  "secrets/", 
  "vendor/",
  "**/node_modules/**",
  ".envarmor",
  ".envguard"
];

const GIT_IGNORE_PATTERNS = [".env.local", ".env.*.local", ".env.production"];

export type AiToolStatus = {
  name: "Cursor" | "Claude Code" | "GitHub Copilot" | "General AI";
  detected: boolean;
  protected: boolean;
  risk: "HIGH" | "LOW";
  details: string;
};

function appendUniqueLines(path: string, lines: string[]): void {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const lineSet = new Set(existing.split(/\r?\n/).map((line) => line.trim()).filter(Boolean));

  for (const line of lines) {
    lineSet.add(line);
  }

  const output = [...lineSet].join("\n");
  writeFileSync(path, `${output}\n`, "utf8");
}

function ensureCopilotInstruction(path: string): void {
  const folder = join(path, ".github");
  mkdirSync(folder, { recursive: true });
  const filePath = join(folder, "copilot-instructions.md");

  const note = [
    "## EnvArmor Secret Safety",
    "Never include values from .env, .env.local, .env.*.local, *.pem, *.key, or secrets/ in AI prompts, code suggestions, or generated output.",
    "If a task needs credentials, use placeholders and instruct the developer to configure secrets locally."
  ];

  appendUniqueLines(filePath, note);
}

export function protectAiContext(projectPath = process.cwd()): string[] {
  const updates: string[] = [];
  const cursorDetected = existsSync(join(projectPath, ".cursor")) || existsSync(join(projectPath, ".cursorignore"));
  const claudeDetected = existsSync(join(projectPath, ".claude")) || existsSync(join(projectPath, ".claudeignore"));
  const copilotDetected = existsSync(join(projectPath, ".github"));

  const noSpecificToolDetected = !cursorDetected && !claudeDetected && !copilotDetected;

  // 1. .cursorignore
  if (cursorDetected || noSpecificToolDetected) {
    const cursorPath = join(projectPath, ".cursorignore");
    appendUniqueLines(cursorPath, AI_IGNORE_PATTERNS);
    updates.push("Updated .cursorignore");
  }

  // 2. .claudeignore
  if (claudeDetected || noSpecificToolDetected) {
    const claudePath = join(projectPath, ".claudeignore");
    appendUniqueLines(claudePath, AI_IGNORE_PATTERNS);
    updates.push("Updated .claudeignore");
  }

  // 3. .aiexclude (Standard for many LLM CLI tools)
  const aiExcludePath = join(projectPath, ".aiexclude");
  appendUniqueLines(aiExcludePath, AI_IGNORE_PATTERNS);
  updates.push("Updated .aiexclude");

  // 4. Copilot
  if (copilotDetected || noSpecificToolDetected) {
    ensureCopilotInstruction(projectPath);
    updates.push("Updated .github/copilot-instructions.md");
  }

  // 5. Git Safety
  const gitIgnorePath = join(projectPath, ".gitignore");
  appendUniqueLines(gitIgnorePath, GIT_IGNORE_PATTERNS);
  updates.push("Updated .gitignore");

  return updates;
}

/**
 * Sanitizes a string by replacing potential secrets with [REDACTED].
 */
export function sanitizeText(text: string): { sanitized: string; count: number } {
  const detectors = [new RegexDetector(), new EntropyDetector()];
  let sanitized = text;
  let count = 0;

  const lines = text.split(/\r?\n/);
  const sanitizedLines = lines.map(line => {
    let currentLine = line;
    for (const detector of detectors) {
      const findings = detector.scan(currentLine, "inline-prompt", 0);
      for (const finding of findings) {
        // We need to find the value to redact.
        // For simplicity, we redact the part that triggered the regex if possible,
        // or the whole line if it's high entropy.
        
        // Lightweight approach: If it's an assignment, redact the value part
        const assignmentMatch = currentLine.match(/[:=]\s*["']?([^"'\s#]+)["']?/);
        if (assignmentMatch && assignmentMatch[1]) {
          currentLine = currentLine.replace(assignmentMatch[1], "[REDACTED]");
          count++;
        } else {
          // If no obvious assignment, redact the whole line to be safe
          currentLine = `[REDACTED ${finding.type}]`;
          count++;
          break; // Line is already redacted
        }
      }
    }
    return currentLine;
  });

  return { sanitized: sanitizedLines.join("\n"), count };
}

export function auditAiContext(projectPath = process.cwd()): AiToolStatus[] {
  const cursorProtected = existsSync(join(projectPath, ".cursorignore"));
  const claudeProtected = existsSync(join(projectPath, ".claudeignore"));
  const copilotProtected = existsSync(join(projectPath, ".github", "copilot-instructions.md"));
  const aiExcludeProtected = existsSync(join(projectPath, ".aiexclude"));

  return [
    {
      name: "Cursor",
      detected: cursorProtected,
      protected: cursorProtected,
      risk: cursorProtected ? "LOW" : "HIGH",
      details: cursorProtected ? "Protected." : "Missing .cursorignore"
    },
    {
      name: "Claude Code",
      detected: claudeProtected,
      protected: claudeProtected,
      risk: claudeProtected ? "LOW" : "HIGH",
      details: claudeProtected ? "Protected." : "Missing .claudeignore"
    },
    {
      name: "GitHub Copilot",
      detected: copilotProtected,
      protected: copilotProtected,
      risk: copilotProtected ? "LOW" : "HIGH",
      details: copilotProtected ? "Protected." : "Missing instructions"
    },
    {
      name: "General AI",
      detected: aiExcludeProtected,
      protected: aiExcludeProtected,
      risk: aiExcludeProtected ? "LOW" : "HIGH",
      details: aiExcludeProtected ? "Protected via .aiexclude." : "Missing .aiexclude"
    }
  ];
}
