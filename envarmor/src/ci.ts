import chalk from "chalk";
import { type ScanFinding } from "./engine-types.js";

export type CiEnvironment = "github" | "gitlab" | "jenkins" | "circleci" | "unknown";

export function detectCi(): CiEnvironment {
  if (process.env.GITHUB_ACTIONS) return "github";
  if (process.env.GITLAB_CI) return "gitlab";
  if (process.env.JENKINS_URL) return "jenkins";
  if (process.env.CIRCLECI) return "circleci";
  return "unknown";
}

/**
 * Formats findings for CI log output (e.g., GitHub Actions annotations)
 */
export function formatCiLog(findings: ScanFinding[]): void {
  const env = detectCi();

  for (const finding of findings) {
    if (env === "github") {
      // ::error file={name},line={line},col={col},title={title}::{message}
      const severity = finding.severity === "CRITICAL" || finding.severity === "HIGH" ? "error" : "warning";
      console.log(`::${severity} file=${finding.file},line=${finding.line},title=EnvArmor [${finding.type}]::Potential secret detected (${finding.severity})`);
    } else {
      const color = finding.severity === "CRITICAL" || finding.severity === "HIGH" ? chalk.red : chalk.yellow;
      console.log(color(`[${finding.severity}] ${finding.type} in ${finding.file}:${finding.line}`));
    }
  }
}

/**
 * Returns true if findings should fail the build based on options
 */
export function shouldFailBuild(findings: ScanFinding[], options: { failOnHigh?: boolean; failOnDetection?: boolean }): boolean {
  if (options.failOnDetection && findings.length > 0) return true;
  
  if (options.failOnHigh) {
    return findings.some(f => f.severity === "CRITICAL" || f.severity === "HIGH");
  }

  return false;
}
