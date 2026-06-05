import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import ignoreModule from "ignore";

// Handle ESM/CJS compatibility for the 'ignore' package
const ignore = (ignoreModule as any).default || ignoreModule;

export class Ignorer {
  private ig: any;
  private inlineIgnoreRegex = /envarmor-ignore(-line)?/i;

  constructor(cwd: string) {
    this.ig = ignore().add([
      "node_modules",
      ".git",
      "dist",
      "build",
      ".next",
      ".env",
      ".env.*",
      "package-lock.json",
      "pnpm-lock.yaml",
      "yarn.lock",
      "bun.lockb"
    ]);
    
    // Respect .gitignore if it exists
    const gitignorePath = join(cwd, ".gitignore");
    if (existsSync(gitignorePath)) {
      try {
        const content = readFileSync(gitignorePath, "utf8");
        this.ig.add(content);
      } catch (err) {
        // Silently fail if gitignore can't be read
      }
    }

    const ignorePath = join(cwd, ".envarmorignore");
    if (existsSync(ignorePath)) {
      try {
        const content = readFileSync(ignorePath, "utf8");
        this.ig.add(content);
      } catch (err) {
        console.warn("Failed to read .envarmorignore:", err);
      }
    }
  }


  /**
   * Checks if a file path is ignored by .envarmorignore or default patterns
   */
  isIgnored(filePath: string, root: string): boolean {
    const relPath = relative(root, filePath).replace(/\\/g, "/");
    return this.ig.ignores(relPath);
  }

  /**
   * Checks if a specific line should be ignored due to inline comments
   */
  isLineIgnored(line: string): boolean {
    return this.inlineIgnoreRegex.test(line);
  }
}
