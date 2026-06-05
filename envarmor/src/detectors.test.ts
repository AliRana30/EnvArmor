import { describe, expect, it } from "vitest";
import { RegexDetector, EntropyDetector, getLineSecretValues } from "./detectors.js";

describe("Secret Scanner Assignment and Value-Only Rules", () => {
  const regexDetector = new RegexDetector();
  const entropyDetector = new EntropyDetector();

  describe("getLineSecretValues pre-filtering", () => {
    it("excludes NODE_ENV comparison (must NOT flag)", () => {
      const line = "process.env.NODE_ENV === 'development'";
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual([]);
    });

    it("excludes conditional env check (must NOT flag)", () => {
      const line = "if (process.env.DEBUG) { console.log('debug'); }";
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual([]);
    });

    it("excludes process.env read with no assignment (must NOT flag)", () => {
      const line = "const env = process.env.VERCEL_ENV";
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual([]);
    });

    it("excludes empty string assignment (must NOT flag)", () => {
      const line = "const STRIPE_KEY = ''";
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual([]);
    });

    it("includes STRIPE_KEY assignment with real key format (must flag)", () => {
      const line = "const STRIPE_KEY = 'sk_test_12345abcdef12345abcdef12345abcdef'"; // envarmor-ignore
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual(["sk_test_12345abcdef12345abcdef12345abcdef"]);
    });

    it("includes process.env.OPENAI_KEY assignment", () => {
      const line = "process.env.OPENAI_KEY = 'sk-123456789012345678901234567890123456789012345678'"; // envarmor-ignore
      const values = getLineSecretValues(line, "app.ts");
      expect(values).toEqual(["sk-123456789012345678901234567890123456789012345678"]);
    });
  });

  describe("RegexDetector Scan Verification", () => {
    it("does NOT flag comparisons", () => {
      const line = "process.env.NODE_ENV === 'development'";
      const findings = regexDetector.scan(line, "app.ts", 1);
      expect(findings).toEqual([]);
    });

    it("does NOT flag conditionals", () => {
      const line = "if (process.env.DATABASE_URL) { connect(); }";
      const findings = regexDetector.scan(line, "app.ts", 1);
      expect(findings).toEqual([]);
    });

    it("does NOT flag simple reads", () => {
      const line = "console.log(process.env.DATABASE_URL);";
      const findings = regexDetector.scan(line, "app.ts", 1);
      expect(findings).toEqual([]);
    });

    it("does NOT flag empty assignments", () => {
      const line = "const DATABASE_URL = \"\";";
      const findings = regexDetector.scan(line, "app.ts", 1);
      expect(findings).toEqual([]);
    });

    it("flags valid Stripe key assignment", () => {
      const line = "const STRIPE_SECRET = 'sk_test_12345abcdef12345abcdef12345abcdef';"; // envarmor-ignore
      const findings = regexDetector.scan(line, "app.ts", 1);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].type).toBe("STRIPE_SECRET");
      expect(findings[0].severity).toBe("CRITICAL");
    });
  });

  describe("EntropyDetector Scan Verification", () => {
    it("does NOT flag simple string assignments with low entropy", () => {
      const line = "const stripe_secret = 'skprojsasassasasasasasasasasasasasasasasasasasasasasasas';";
      const findings = entropyDetector.scan(line, "app.ts", 1);
      expect(findings).toEqual([]);
    });

    it("flags high entropy contextual secret assignments", () => {
      // High-entropy random 32 character key
      const line = "const jwt_secret = 'x8f7s2j9k4m1q5v8w0y3z6b9p2r5d8e1';"; // envarmor-ignore
      const findings = entropyDetector.scan(line, "app.ts", 1);
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].type).toBe("JWT_SECRET");
    });
  });
});
