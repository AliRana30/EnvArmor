import { describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { locateGitRepository } from "./git.js";

describe("locateGitRepository", () => {
  it("finds the nearest git root walking upward", () => {
    const root = mkdtempSync(join(tmpdir(), "envarmor-git-"));
    mkdirSync(join(root, ".git"));
    const nested = join(root, "apps", "web");
    mkdirSync(nested, { recursive: true });

    const repo = locateGitRepository(nested);

    expect(repo?.worktreeRoot).toBe(root);
    expect(repo?.gitDir).toBe(join(root, ".git"));
  });

  it("returns null outside a git repository", () => {
    const root = mkdtempSync(join(tmpdir(), "envarmor-no-git-"));
    expect(locateGitRepository(root)).toBeNull();
  });
});
