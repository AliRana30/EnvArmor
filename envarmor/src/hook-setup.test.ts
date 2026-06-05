import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { locateGitRepository } from "./git.js";
import { getHookPath, writePreCommitHook } from "./hook.js";

describe("pre-commit hook setup", () => {
  it("writes the hook to .husky/pre-commit when husky is detected", () => {
    const root = mkdtempSync(join(tmpdir(), "envarmor-husky-"));
    mkdirSync(join(root, ".git"));
    mkdirSync(join(root, ".husky"));
    writeFileSync(
      join(root, "package.json"),
      JSON.stringify({ devDependencies: { husky: "^9.0.0" } }, null, 2),
      "utf8"
    );

    const repo = locateGitRepository(root);
    expect(repo).not.toBeNull();
    expect(getHookPath(repo!)).toBe(join(root, ".husky", "pre-commit"));

    const hookPath = writePreCommitHook(repo!);
    const content = readFileSync(hookPath, "utf8");

    expect(content).toContain("npx envarmor scan --staged --hook-mode");
    expect(content).toContain("# envarmor-start");
    expect(content).toContain("# envarmor-end");
  });
});
