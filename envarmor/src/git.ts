import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

export type GitRepository = {
  worktreeRoot: string;
  gitDir: string;
};

function resolveGitDirFromFile(gitFilePath: string): string | null {
  try {
    const raw = readFileSync(gitFilePath, "utf8").trim();
    const match = raw.match(/^gitdir:\s*(.+)$/i);
    if (!match?.[1]) {
      return null;
    }

    const gitDirPath = match[1].trim();
    return resolve(dirname(gitFilePath), gitDirPath);
  } catch {
    return null;
  }
}

export function locateGitRepository(startDir = process.cwd()): GitRepository | null {
  let currentDir = resolve(startDir);

  while (true) {
    const gitPath = join(currentDir, ".git");

    if (existsSync(gitPath)) {
      try {
        if (statSync(gitPath).isDirectory()) {
          return { worktreeRoot: currentDir, gitDir: gitPath };
        }
      } catch {
        // Fall through to gitfile resolution.
      }

      const resolvedGitDir = resolveGitDirFromFile(gitPath);
      if (resolvedGitDir) {
        return { worktreeRoot: currentDir, gitDir: resolvedGitDir };
      }
    }

    const parentDir = dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }

    currentDir = parentDir;
  }
}

export function detectHusky(repo: GitRepository): boolean {
  if (existsSync(join(repo.worktreeRoot, ".husky"))) {
    return true;
  }

  try {
    const packageJson = JSON.parse(readFileSync(join(repo.worktreeRoot, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return Boolean(packageJson.dependencies?.husky || packageJson.devDependencies?.husky);
  } catch {
    return false;
  }
}

export function getRepositoryInfo(repo: GitRepository | null): { name: string; branch: string } {
  if (!repo) {
    return { name: "local-project", branch: "unknown" };
  }

  let name = dirname(repo.worktreeRoot) !== repo.worktreeRoot ? repo.worktreeRoot.split(/[/\\]/).pop() || "unknown" : "unknown";
  let branch = "unknown";

  try {
    const headPath = join(repo.gitDir, "HEAD");
    const headContent = readFileSync(headPath, "utf8").trim();
    if (headContent.startsWith("ref: refs/heads/")) {
      branch = headContent.replace("ref: refs/heads/", "");
    } else {
      branch = headContent.substring(0, 7); // Short SHA
    }
  } catch {
    // Fallback if HEAD is missing or unreadable
  }

  return { name, branch };
}
