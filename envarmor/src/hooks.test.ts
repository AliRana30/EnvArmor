import { describe, expect, it } from "vitest";
import { isEnvArmorBlockingFinding } from "./hook.js";

describe("hook severity rules", () => {
  it("blocks high severity findings", () => {
    expect(isEnvArmorBlockingFinding("HIGH")).toBe(true);
  });

  it("blocks critical severity findings", () => {
    expect(isEnvArmorBlockingFinding("CRITICAL")).toBe(true);
  });

  it("allows low severity findings", () => {
    expect(isEnvArmorBlockingFinding("LOW")).toBe(false);
  });
});
