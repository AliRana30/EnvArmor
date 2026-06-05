import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import chalk from "chalk";
import { loginWithApiKey, reportBypass, reportScanEvents, fetchSecrets, pushSecrets } from "./api.js";
import { detectHusky, locateGitRepository } from "./git.js";
import { removePreCommitHook, writePreCommitHook, isEnvArmorBlockingFinding } from "./hook.js";
import { printBlockingFindings, printScanResult } from "./reporter.js";
import { scanWorkspace } from "./scanner.js";
import { parseEnvFile, formatEnvFile, readLocalEnv, writeEnvFile, detectProjectSlug } from "./vault.js";
import * as AiProtection from "./ai-protection.js";

function appendUniqueLines(path: string, lines: string[]): void {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : "";
  const out = new Set(existing.split(/\r?\n/).filter(Boolean));
  lines.forEach((line) => out.add(line));
  writeFileSync(path, `${[...out].join("\n")}\n`, "utf8");
}

export type RunScanOptions = {
  path?: string;
  all?: boolean;
  staged?: boolean;
  failOnDetection?: boolean;
  failOnHigh?: boolean;
  history?: boolean;
  since?: string;
  branch?: string;
  ci?: boolean;
  json?: boolean;
  hookMode?: boolean;
  project?: string;
};

export async function runHistoryScan(options: RunScanOptions): Promise<number> {
  const { HistoryScanner } = await import("./history-scanner.js");
  const { RegexDetector, EntropyDetector } = await import("./detectors.js");
  const { printHistoryResult } = await import("./reporter.js");

  console.log(chalk.blue("Scanning git history for leaked secrets..."));

  const scanner = new HistoryScanner({
    cwd: options.path ?? process.cwd(),
    detectors: [new RegexDetector(), new EntropyDetector()]
  });

  try {
    const findings = await scanner.scan({
      since: options.since,
      branch: options.branch
    });

    printHistoryResult(findings);
    
    if (findings.length > 0) {
      void reportScanEvents(findings, false, options.project).catch(() => {});
    }

    return findings.length > 0 ? 1 : 0;
  } catch (err) {
    console.error(chalk.red("History scan failed:"), err);
    return 1;
  }
}

const NEXT_PUBLIC_APP_URL = "https://envarmor.vercel.app"

export async function runScan(options: RunScanOptions = {}): Promise<number> {
  if (options.history) {
    return runHistoryScan(options);
  }

  if (options.hookMode) {
    const { ScannerEngine } = await import("./engine.js");
    const { RegexDetector, EntropyDetector } = await import("./detectors.js");
    const { relative } = await import("node:path");

    const engine = new ScannerEngine({
      cwd: options.path ?? process.cwd(),
      detectors: [new RegexDetector(), new EntropyDetector()],
      stagedOnly: options.staged
    });

    const result = await engine.scan();

    if (result.findings.length > 0) {
      result.findings.forEach((finding) => {
        const relFile = relative(process.cwd(), finding.file).replace(/\\/g, "/");
        console.log(`${relFile}:${finding.line} [${finding.severity}] ${finding.type}`);
      });
      console.log(`EnvArmor: ${result.findings.length} secrets detected. Commit blocked.`);
      return 1;
    }

    return 0;
  }

  if (process.env.ENVARMOR_SKIP === "1") {
    void reportBypass("ENVARMOR_SKIP=1", options.staged ? "staged-hook" : "manual-scan").catch(() => {});
    console.log(chalk.yellow("EnvArmor bypassed by ENVARMOR_SKIP=1."));
    return 0;
  }

  const { ScannerEngine } = await import("./engine.js");
  const { RegexDetector, EntropyDetector } = await import("./detectors.js");
  const { exportToJson } = await import("./reporter.js");
  const { detectCi, formatCiLog, shouldFailBuild } = await import("./ci.js");

  const engine = new ScannerEngine({
    cwd: options.path ?? process.cwd(),
    detectors: [new RegexDetector(), new EntropyDetector()],
    stagedOnly: options.staged
  });

  const result = await engine.scan();
  
  if (options.json) {
    const reportPath = join(process.cwd(), "envarmor-report.json");
    writeFileSync(reportPath, exportToJson(result), "utf8");
    console.log(chalk.green(`✓ Scan report generated: ${reportPath}`));
  }

  if (options.ci || detectCi() !== "unknown") {

    formatCiLog(result.findings);
    console.log(chalk.gray(`\nScanned ${result.filesScanned} files in ${result.durationMs}ms.`));
    if (result.findings.length === 0) {
      console.log(chalk.green("✓ No secrets detected."));
    } else {
      console.log(chalk.yellow(`! Found ${result.findings.length} potential secrets.`));
    }
  } else {
    printScanResult({
      findings: result.findings,
      totalExposureLow: result.totalExposureLow,
      totalExposureHigh: result.totalExposureHigh,
      scannedFiles: result.filesScanned
    });
  }

  const fail = shouldFailBuild(result.findings, options);
  
  if (fail && !options.json) {
    if (options.failOnDetection) {
      const { isEnvArmorBlockingFinding } = await import("./hook.js");
      const blocking = result.findings.filter(f => isEnvArmorBlockingFinding(f.severity));
      printBlockingFindings(blocking);
    } else if (options.failOnHigh) {
      console.error(chalk.red("\n✖ Build failed: High-risk secrets detected."));
    }
  }

  if (result.findings.length > 0) {
    void reportScanEvents(result.findings, fail, options.project).catch(() => {});
  }

  return fail ? 1 : 0;
}

export function runInit(): void {
  const repo = locateGitRepository(process.cwd());

  if (!repo) {
    console.log(chalk.red("Unable to locate a git repository. Run envarmor init from inside a git repo."));
    process.exitCode = 1;
    return;
  }

  const preCommitPath = writePreCommitHook(repo);
  const configPath = join(repo.worktreeRoot, ".envarmor");
  mkdirSync(dirname(configPath), { recursive: true });

  if (!existsSync(configPath)) {
    writeFileSync(
      configPath,
      JSON.stringify(
        {
          version: 1,
          ignore: ["node_modules", ".git", "dist", "build"]
        },
        null,
        2
      ),
      "utf8"
    );
  }

  const hookLocation = detectHusky(repo) ? ".husky/pre-commit" : ".git/hooks/pre-commit";
  console.log(chalk.green("EnvArmor initialized."));
  console.log(chalk.gray(`Created hook: ${preCommitPath}`));
  console.log(chalk.gray(`Hook target: ${hookLocation}`));
  console.log(chalk.gray(`Created config: ${configPath}`));
}

export function runUninstall(): void {
  const repo = locateGitRepository(process.cwd());

  if (!repo) {
    console.log(chalk.red("Unable to locate a git repository."));
    process.exitCode = 1;
    return;
  }

  const hookPath = removePreCommitHook(repo);
  if (!hookPath) {
    console.log(chalk.yellow("No EnvArmor hook found to remove."));
    return;
  }

  console.log(chalk.green(`Removed EnvArmor hook: ${hookPath}`));
}

export async function runLogin(apiKey: string): Promise<number> {
  if (!apiKey) {
    console.log(chalk.red("Missing API key. Use envarmor login --key <api-key>"));
    return 1;
  }

  try {
    const valid = await loginWithApiKey(apiKey);
    if (!valid) {
      console.log(chalk.red("API key verification failed."));
      return 1;
    }

    console.log(chalk.green("Login successful. API key stored in ~/.envarmor/config.json"));
    return 0;
  } catch (error) {
    console.log(chalk.red("Unable to verify API key."));
    console.log(
      chalk.gray(
        `Verify API endpoint: ${process.env.ENVARMOR_API_BASE_URL || "http://localhost:3000/api/v1"}`
      )
    );
    console.log(chalk.gray(String(error)));
    return 1;
  }
}

export function runProtect(): void {
  const updates = AiProtection.protectAiContext(process.cwd());
  console.log(chalk.green("AI and git ignore safety rules updated."));
  updates.forEach((update) => console.log(chalk.gray(`- ${update}`)));
}

export function runAuditAi(): void {
  const report = AiProtection.auditAiContext(process.cwd());

  console.log(chalk.bold("AI Context Exposure Audit"));
  for (const item of report) {
    const indicator = item.risk === "HIGH" ? chalk.red("HIGH") : chalk.green("LOW");
    const protectedLabel = item.protected ? "protected" : "unprotected";
    console.log(`${item.name}: ${indicator} (${protectedLabel})`);
    console.log(chalk.gray(`  ${item.details}`));
  }
}

export function runSanitize(text: string): void {
  const { sanitized, count } = AiProtection.sanitizeText(text);
  
  if (count > 0) {
    console.log(chalk.yellow(`\n⚠ Redacted ${count} potential secrets.\n`));
  } else {
    console.log(chalk.green("\n✓ No secrets detected. Text is safe to share.\n"));
  }
  
  console.log(sanitized);
}

export type RunPullOptions = {
  env?: 'development' | 'staging' | 'production';
  output?: 'shell' | 'file';
  project?: string;
};

/**
 * Pull secrets from the vault and display/save them
 */
export async function runPull(options: RunPullOptions = {}): Promise<number> {
  const environment = options.env || 'development';

  try {
    // Detect project slug from git remote or override
    const projectSlug = options.project || detectProjectSlug();
    if (!projectSlug) {
      console.log(chalk.red("Unable to detect project slug. Specify with -p, --project <slug>"));
      return 1;
    }

    // Fetch secrets from API
    const secrets = await fetchSecrets(projectSlug, environment);
    if (!secrets) {
      console.log(chalk.red("Failed to fetch secrets from vault"));
      return 1;
    }

    // Format and output
    const envContent = formatEnvFile(secrets);

    if (options.output === 'file') {
      const filePath = `.env.${environment}`;
      if (writeEnvFile(envContent, filePath)) {
        console.log(chalk.green(`✓ Secrets pulled to ${filePath}`));
        return 0;
      } else {
        console.log(chalk.red(`Failed to write to ${filePath}`));
        return 1;
      }
    } else {
      // Output to stdout (for piping or shell eval)
      process.stdout.write(envContent);
      return 0;
    }
  } catch (error) {
    console.log(chalk.red("Error pulling secrets:"));
    console.log(chalk.gray(String(error)));
    return 1;
  }
}

export type RunPushOptions = {
  env?: 'development' | 'staging' | 'production';
  force?: boolean;
  project?: string;
};

/**
 * Push secrets from local .env file to the vault
 */
export async function runPush(options: RunPushOptions = {}): Promise<number> {
  const environment = options.env || 'development';
  const filePath = '.env.local';

  try {
    // Read local .env
    const localSecrets = readLocalEnv(filePath);

    if (Object.keys(localSecrets).length === 0) {
      console.log(chalk.yellow(`No secrets found in ${filePath}`));
      return 0;
    }

    // Detect project slug
    const projectSlug = options.project || detectProjectSlug();
    if (!projectSlug) {
      console.log(chalk.red("Unable to detect project slug. Specify with -p, --project <slug>"));
      return 1;
    }

    // Push to API
    const result = await pushSecrets(projectSlug, environment, localSecrets, options.force);
    if (!result) {
      console.log(chalk.red("Failed to push secrets to vault"));
      return 1;
    }

    const { created, updated, skipped } = result;
    console.log(chalk.green(`✓ Secrets pushed to vault`));
    console.log(chalk.gray(`  Created: ${created}, Updated: ${updated}, Skipped: ${skipped}`));
    return 0;
  } catch (error) {
    console.log(chalk.red("Error pushing secrets:"));
    console.log(chalk.gray(String(error)));
    return 1;
  }
}
