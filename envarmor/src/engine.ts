import { readFileSync, openSync, readSync, closeSync } from "node:fs";
import { join, relative } from "node:path";
import { globSync } from "glob";
import { execFileSync, execFile } from "node:child_process";
import { promisify } from "node:util";
import { Ignorer } from "./ignorer.js";
import { type Detector, type EngineOptions, type EngineResult, type ScanFinding } from "./engine-types.js";
import { locateGitRepository } from "./git.js";

const execFileAsync = promisify(execFile);

export class ScannerEngine {
  private ignorer: Ignorer;
  private detectors: Detector[];
  private cwd: string;
  private repoRoot: string;
  private options: EngineOptions;

  constructor(options: EngineOptions) {
    this.cwd = options.cwd;
    this.detectors = options.detectors;
    const repo = locateGitRepository(options.cwd);
    this.repoRoot = repo?.worktreeRoot ?? options.cwd;
    this.ignorer = new Ignorer(this.repoRoot);
    this.options = options;
  }

  async scan(): Promise<EngineResult> {
    const startTime = Date.now();
    const files = await this.getTargetFiles(this.options.stagedOnly);
    const findings: ScanFinding[] = [];

    if (this.options.stagedOnly) {
      const fileFindingsList = await Promise.all(
        files.map(async (file) => {
          try {
            const relPath = relative(this.repoRoot, file).replace(/\\/g, "/");
            const { stdout } = await execFileAsync("git", ["show", `:${relPath}`], {
              cwd: this.repoRoot,
              encoding: "buffer",
              maxBuffer: 10 * 1024 * 1024 // 10MB limit
            });
            if (this.isBinaryBuffer(stdout)) return [];
            const content = stdout.toString("utf8");
            return this.scanContent(content, file);
          } catch {
            return [];
          }
        })
      );
      for (const fileFindings of fileFindingsList) {
        findings.push(...fileFindings);
      }
    } else {
      const fileFindingsList = await Promise.all(
        files.map(async (file) => {
          return this.scanFile(file);
        })
      );
      for (const fileFindings of fileFindingsList) {
        findings.push(...fileFindings);
      }
    }

    const durationMs = Date.now() - startTime;
    const totalExposureLow = findings.reduce((sum, f) => sum + f.risk.low, 0);
    const totalExposureHigh = findings.reduce((sum, f) => sum + f.risk.high, 0);

    return {
      findings,
      totalExposureLow,
      totalExposureHigh,
      filesScanned: files.length,
      durationMs
    };
  }

  private scanContent(content: string, filePath: string): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Skip if line has an ignore comment
      if (this.ignorer.isLineIgnored(line)) return;

      for (const detector of this.detectors) {
        const detected = detector.scan(line, filePath, lineNumber);
        findings.push(...detected);
      }
    });
    return findings;
  }

  private scanFile(filePath: string): ScanFinding[] {
    try {
      if (this.isBinaryFile(filePath)) return [];
      const content = readFileSync(filePath, "utf8");
      return this.scanContent(content, filePath);
    } catch {
      return [];
    }
  }

  private async getTargetFiles(stagedOnly?: boolean): Promise<string[]> {
    let allFiles: string[] = [];
    
    try {
      if (stagedOnly) {
        const output = execFileSync(
          "git", 
          ["diff", "--cached", "--name-only", "--diff-filter=ACM", "-z"], 
          { cwd: this.repoRoot, encoding: "utf8" }
        );
        allFiles = output.split("\0").filter(Boolean).map(f => join(this.repoRoot, f));
      } else {
        // Use -c for cached, -o for others (untracked), and --exclude-standard to respect .gitignore
        const output = execFileSync("git", ["ls-files", "-c", "-o", "--exclude-standard", "-z"], { cwd: this.repoRoot, encoding: "utf8" });
        allFiles = output.split("\0").filter(Boolean).map(f => join(this.repoRoot, f));
      }
    } catch {
      allFiles = globSync("**/*", { cwd: this.repoRoot, nodir: true, absolute: true });
    }

    return allFiles.filter(file => !this.ignorer.isIgnored(file, this.repoRoot));
  }

  private isBinaryFile(filePath: string): boolean {
    const binaryExts = [".png", ".jpg", ".jpeg", ".gif", ".pdf", ".zip", ".exe", ".dll", ".so", ".node"];
    if (binaryExts.some(ext => filePath.toLowerCase().endsWith(ext))) {
      return true;
    }
    try {
      const fd = openSync(filePath, "r");
      const buffer = Buffer.alloc(512);
      const bytesRead = readSync(fd, buffer, 0, 512, 0);
      closeSync(fd);
      for (let i = 0; i < bytesRead; i++) {
        if (buffer[i] === 0) return true;
      }
    } catch {
      // Ignored
    }
    return false;
  }

  private isBinaryBuffer(buffer: Buffer): boolean {
    const checkLimit = Math.min(buffer.length, 512);
    for (let i = 0; i < checkLimit; i++) {
      if (buffer[i] === 0) return true;
    }
    return false;
  }
}
