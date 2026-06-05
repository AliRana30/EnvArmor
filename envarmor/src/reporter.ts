import chalk from "chalk";
import type { ScanFinding, ScanResult } from "./scanner.js";

function colorizeSeverity(severity: ScanFinding["severity"]): string {
  if (severity === "CRITICAL") return chalk.redBright(severity);
  if (severity === "HIGH") return chalk.red(severity);
  if (severity === "MEDIUM") return chalk.yellow(severity);
  return chalk.green(severity);
}

export function printScanResult(result: ScanResult): void {
  if (result.findings.length === 0) {
    console.log(chalk.green("No secrets detected. Your tree is clean."));
    console.log(chalk.gray(`Scanned files: ${result.scannedFiles}`));
    return;
  }

  console.log(chalk.bold.red(`Found ${result.findings.length} potential secret(s)`));
  console.log(chalk.gray(`Scanned files: ${result.scannedFiles}`));

  // Custom table formatting for better alignment with ANSI colors
  const headers = ["Index", "File", "Line", "Type", "Severity", "Exposure Basis", "Risk Range"];
  const colWidths = [6, 35, 6, 16, 10, 42, 22];

  // Header
  console.log(
    chalk.bgWhite.black(
      headers.map((h, i) => h.padEnd(colWidths[i])).join(" ")
    )
  );

  result.findings.forEach((finding, idx) => {
    // findings.file is already absolute, but we want a cleaner display
    // If it's absolute, try to make it relative to the current working directory
    const cwd = process.cwd();
    const relativePath = finding.file.startsWith(cwd) 
      ? finding.file.slice(cwd.length + 1).replace(/\\/g, "/")
      : finding.file;

    const displayPath = relativePath.length > colWidths[1] 
      ? `...${relativePath.slice(-(colWidths[1] - 3))}`
      : relativePath;

    const rangeStr = `$${finding.risk.low.toLocaleString()}–$${finding.risk.high.toLocaleString()}`;

    const row = [
      String(idx + 1).padEnd(colWidths[0]),
      displayPath.padEnd(colWidths[1]),
      String(finding.line).padEnd(colWidths[2]),
      finding.type.padEnd(colWidths[3]),
      colorizeSeverity(finding.severity).padEnd(colWidths[4] + 10), // Add padding for ANSI
      finding.risk.basis.padEnd(colWidths[5]),
      rangeStr.padEnd(colWidths[6])
    ];
    console.log(row.join(" "));
  });

  console.log(chalk.gray("-".repeat(colWidths.reduce((a, b) => a + b, 0) + 10)));
  console.log(
    chalk.bold(
      `Exposure range prevented: $${result.totalExposureLow.toLocaleString()}–$${result.totalExposureHigh.toLocaleString()} (cumulative risk range)`
    )
  );
  console.log(chalk.gray(" Estimates reflect typical abuse scenarios, not guaranteed losses."));
}

export function printHistoryResult(findings: any[]): void {
  if (findings.length === 0) {
    console.log(chalk.green("✓ No secrets detected in git history."));
    return;
  }

  console.log(chalk.bold.red(`⚠ Found ${findings.length} leaked secrets in git history!`));
  console.log(chalk.gray("--------------------------------------------------------------------------------"));

  findings.forEach((finding, idx) => {
    console.log(`${chalk.bold(idx + 1)}. ${colorizeSeverity(finding.severity)} ${chalk.bold(finding.type)}`);
    console.log(`   Commit: ${chalk.cyan(finding.commitHash.slice(0, 8))} by ${chalk.yellow(finding.author)}`);
    console.log(`   Date:   ${chalk.gray(finding.timestamp)}`);
    console.log(`   Range:  ${chalk.red(`$${finding.risk.low.toLocaleString()}–$${finding.risk.high.toLocaleString()} (${finding.risk.basis})`)}`);
    console.log("");
  });

  const totalLow = findings.reduce((sum, f) => sum + f.risk.low, 0);
  const totalHigh = findings.reduce((sum, f) => sum + f.risk.high, 0);
  console.log(
    chalk.bold.bgRed.white(
      ` TOTAL HISTORICAL EXPOSURE RANGE: $${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()} `
    )
  );
  console.log(chalk.gray(" Estimates reflect typical abuse scenarios, not guaranteed losses."));
}

export function printBlockingFindings(findings: any[]): void {
  console.error(chalk.redBright("EnvArmor blocked the commit because high-risk secrets were detected."));
  for (const finding of findings) {
    console.error(
      chalk.redBright(
        `${finding.severity} ${finding.type} in ${finding.file}:${finding.line} - exposure range $${finding.risk.low.toLocaleString()}–$${finding.risk.high.toLocaleString()} (${finding.risk.basis})`
      )
    );
  }
}

export function exportToJson(result: any): string {
  return JSON.stringify(result, null, 2);
}
