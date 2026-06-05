import { execFileSync } from "node:child_process";
import { type Detector, type ScanFinding } from "./engine-types.js";
import { locateGitRepository } from "./git.js";

export interface HistoryFinding extends ScanFinding {
  commitHash: string;
  author: string;
  timestamp: string;
}

export interface HistoryScanOptions {
  cwd: string;
  detectors: Detector[];
  since?: string;
  until?: string;
  branch?: string;
}

export class HistoryScanner {
  private detectors: Detector[];
  private cwd: string;

  constructor(options: HistoryScanOptions) {
    this.cwd = options.cwd;
    this.detectors = options.detectors;
  }

  async scan(options: Partial<HistoryScanOptions> = {}): Promise<HistoryFinding[]> {
    const repo = locateGitRepository(this.cwd);
    if (!repo) throw new Error("Git repository not found");

    const root = repo.worktreeRoot;
    const findings: HistoryFinding[] = [];
    const seenSecrets = new Set<string>();

    // Fetch latest from remote repositories (e.g. GitHub) to get real-time history
    try {
      execFileSync("git", ["fetch", "--all"], { cwd: root, stdio: "ignore", timeout: 8000 });
    } catch {
      // Silence fetch errors (e.g. offline, no remote configured, auth required)
    }

    // 1. Get list of commits to scan
    const revListArgs = ["rev-list", "--all", "--reflog"];
    // Explicitly add stashes if they exist
    try {
      execFileSync("git", ["rev-parse", "--verify", "refs/stash"], { cwd: root, stdio: "ignore" });
      revListArgs.push("refs/stash");
    } catch {
      // No stashes found, ignore
    }
    if (options.branch) revListArgs.push(options.branch);
    if (options.since) revListArgs.push(`--since=${options.since}`);
    if (options.until) revListArgs.push(`--until=${options.until}`);

    const commits = execFileSync("git", revListArgs, { cwd: root, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);

    for (const hash of commits) {
      // 2. Get commit metadata (Name <Email> | Date)
      const metadata = execFileSync("git", ["show", "-s", "--format=%an|%ae|%ai", hash], { cwd: root, encoding: "utf8" }).trim();
      let [name, email, timestamp] = metadata.split("|");
      
      // Clean up "unknown" name
      const author = (name === "unknown" || !name) ? email : `${name} <${email}>`;

      // 3. Scan the diff of this commit
      const diff = execFileSync("git", ["show", "-p", "--unified=0", hash], { cwd: root, encoding: "utf8" });
      const lines = diff.split(/\r?\n/);

      lines.forEach((line) => {
        // Only scan added lines (+)
        if (!line.startsWith("+") || line.startsWith("+++")) return;
        
        const content = line.slice(1);
        for (const detector of this.detectors) {
          const detected = detector.scan(content, "git-history", 0);
          for (const f of detected) {
            // Noise reduction: Only flag ENV_CONFIG if it looks like an assignment
            if (f.type === "ENV_CONFIG") {
              const isAssignment = /[:=]/.test(content) || /const|let|var/.test(content);
              if (!isAssignment) continue;
            }

            const secretKey = `${f.type}:${content.trim()}`;
            if (!seenSecrets.has(secretKey)) {
              seenSecrets.add(secretKey);
              findings.push({
                ...f,
                commitHash: hash,
                author,
                timestamp
              });
            }
          }
        }
      });
    }

    return findings;
  }
}
