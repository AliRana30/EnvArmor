import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import chalk from "chalk";
import type { ScanFinding } from "./scanner.js";

const CONFIG_DIR = join(homedir(), ".envarmor");
const CONFIG_PATH = join(CONFIG_DIR, "config.json");
const DEFAULT_API_BASE = "http://localhost:3000/api/v1";

type LocalConfig = {
  apiKey?: string;
};

type ApiPayload = {
  secretType: string;
  severity: string;
  filePath: string;
  lineNumber: number;
  blocked: boolean;
  projectSlug: string;
  estimatedCostSaved: number;
};

export type PushResult = {
  created: number;
  updated: number;
  skipped: number;
};

function readConfig(): LocalConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw) as LocalConfig;
  } catch {
    return {};
  }
}

function writeConfig(config: LocalConfig): void {
  try {
    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf8");
  } catch {
    // Ignore config write errors
  }
}

function getApiBaseUrl(): string {
  return process.env.ENVARMOR_API_BASE_URL?.trim() || DEFAULT_API_BASE;
}

export async function verifyApiKey(apiKey: string): Promise<boolean> {
  const response = await fetch(`${getApiBaseUrl()}/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    }
  });

  return response.ok;
}

export async function loginWithApiKey(apiKey: string): Promise<boolean> {
  const valid = await verifyApiKey(apiKey);

  if (!valid) {
    return false;
  }

  writeConfig({ apiKey });
  return true;
}

export function getStoredApiKey(): string | null {
  const config = readConfig();
  return config.apiKey ?? null;
}

export async function reportScanEvents(findings: ScanFinding[], blocked = false, projectSlug?: string): Promise<void> {
  const apiKey = getStoredApiKey();

  if (findings.length === 0) {
    return;
  }

  if (!apiKey) {
    console.log(chalk.yellow("\n⚠️  CLI is not logged in. Findings were not sent to the dashboard."));
    console.log(chalk.gray("Run: envarmor login --key <YOUR-API-KEY>\n"));
    return;
  }

  console.log(chalk.blue("\nSyncing findings to dashboard..."));

  const { locateGitRepository, getRepositoryInfo } = await import("./git.js");
  const repo = locateGitRepository();
  const { name: repoName, branch } = getRepositoryInfo(repo);
  const project = projectSlug || repoName;

  try {
    const res = await fetch(`${getApiBaseUrl()}/scan-events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        repository: project,
        branch: branch,
        events: findings.map((finding): ApiPayload => ({
          secretType: finding.type,
          severity: finding.severity,
          filePath: finding.file,
          lineNumber: finding.line,
          blocked,
          projectSlug: project,
          estimatedCostSaved: finding.risk.high
        }))
      })
    });

    if (res.ok) {
      console.log(chalk.green("✓ Successfully synced findings to dashboard!\n"));
    } else {
      console.log(chalk.red(`❌ Failed to sync findings to dashboard: ${res.statusText}\n`));
    }
  } catch (err) {
    console.log(chalk.red("❌ Failed to sync findings to dashboard. Network error.\n"));
  }
}

export async function reportBypass(reason: string, source = "git-hook"): Promise<void> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    return;
  }

  await fetch(`${getApiBaseUrl()}/bypasses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({ reason, source })
  });
}

export async function fetchSecrets(
  projectSlug: string,
  environment: string
): Promise<Record<string, string> | null> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.error("Not authenticated. Run 'envarmor login --key <your-key>' first.");
    return null;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/projects/${projectSlug}/secrets?env=${environment}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      }
    });

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as {
      secrets: Array<{ name: string; decryptedValue?: string; value?: string }>;
    };

    const secrets: Record<string, string> = {};

    for (const secret of data.secrets ?? []) {
      // Prefer decryptedValue when backend exposes it, fallback for compatibility.
      if (typeof secret.decryptedValue === "string") {
        secrets[secret.name] = secret.decryptedValue;
      } else if (typeof secret.value === "string") {
        secrets[secret.name] = secret.value;
      }
    }

    return secrets;
  } catch (error) {
    console.error("Error fetching secrets:", error);
    return null;
  }
}

export async function pushSecrets(
  projectSlug: string,
  environment: string,
  secrets: Record<string, string>,
  force = false
): Promise<PushResult | null> {
  const apiKey = getStoredApiKey();

  if (!apiKey) {
    console.error("Not authenticated. Run 'envarmor login --key <your-key>' first.");
    return null;
  }

  try {
    const result: PushResult = { created: 0, updated: 0, skipped: 0 };

    for (const [name, value] of Object.entries(secrets)) {
      const response = await fetch(`${getApiBaseUrl()}/projects/${projectSlug}/secrets`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          name,
          value,
          environment,
          force
        })
      });

      if (response.ok) {
        const data = (await response.json()) as { isNew?: boolean };
        if (data.isNew) {
          result.created += 1;
        } else {
          result.updated += 1;
        }
      } else if (response.status === 409 && !force) {
        result.skipped += 1;
      } else {
        result.skipped += 1;
        console.error(`Error pushing ${name}: ${response.status} ${response.statusText}`);
      }
    }

    return result;
  } catch (error) {
    console.error("Error pushing secrets:", error);
    return null;
  }
}
