import { chmodSync, existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { detectHusky, type GitRepository } from "./git.js";

const HOOK_BLOCK_START = "# envarmor-start";
const HOOK_BLOCK_END = "# envarmor-end";

function buildHookScript(useHusky: boolean): string {
  const command = "npx envarmor scan --staged --hook-mode\nexit $?";

  if (useHusky) {
    return `#!/bin/sh
. "$(dirname \"$0\")/_/husky.sh" 2>/dev/null || true
${command}
`;
  }

  return `#!/bin/sh
${command}
`;
}

function injectBlock(existingContent: string, blockContent: string): string {
  const blockPattern = new RegExp(`${HOOK_BLOCK_START}[\\s\\S]*?${HOOK_BLOCK_END}\\n?`, "g");
  const cleaned = existingContent.replace(blockPattern, "").trim();
  
  // Extract shebang if it exists in either block or existing content
  const shebangMatch = blockContent.match(/^#!.*\n/);
  const shebang = shebangMatch ? shebangMatch[0] : (cleaned.match(/^#!.*\n/) ? "" : "#!/bin/sh\n");
  
  const contentWithoutShebang = (cleaned.startsWith("#!") ? cleaned.replace(/^#!.*\n/, "") : cleaned).trim();
  const blockWithoutShebang = blockContent.replace(/^#!.*\n/, "").trim();

  const separator = contentWithoutShebang.length > 0 ? "\n\n" : "";
  
  return `${shebang}${contentWithoutShebang}${separator}${HOOK_BLOCK_START}
${blockWithoutShebang}
${HOOK_BLOCK_END}
`;
}

export function getHookPath(repo: GitRepository): string {
  const huskyPath = join(repo.worktreeRoot, ".husky", "pre-commit");
  if (detectHusky(repo)) {
    return huskyPath;
  }

  return join(repo.gitDir, "hooks", "pre-commit");
}

export function writePreCommitHook(repo: GitRepository): string {
  const hookPath = getHookPath(repo);
  const hookDir = dirname(hookPath);
  mkdirSync(hookDir, { recursive: true });

  const script = buildHookScript(hookPath.includes(".husky"));
  const existingContent = existsSync(hookPath) ? readFileSync(hookPath, "utf8") : "";
  const nextContent = injectBlock(existingContent, script);

  writeFileSync(hookPath, nextContent, "utf8");

  try {
    chmodSync(hookPath, 0o755);
  } catch {
    // Windows and certain filesystem targets may not support chmod.
  }

  return hookPath;
}

export function removePreCommitHook(repo: GitRepository): string | null {
  const hookPath = getHookPath(repo);
  if (!existsSync(hookPath)) {
    return null;
  }

  const content = readFileSync(hookPath, "utf8");
  const cleaned = content
    .replace(new RegExp(`\\n?${HOOK_BLOCK_START}[\\s\\S]*?${HOOK_BLOCK_END}\\n?`, "g"), "")
    .trim();

  if (!cleaned) {
    unlinkSync(hookPath);
  } else {
    writeFileSync(hookPath, `${cleaned}\n`, "utf8");
  }

  return hookPath;
}

export function isEnvArmorBlockingFinding(severity: string): boolean {
  return severity === "HIGH" || severity === "CRITICAL";
}
