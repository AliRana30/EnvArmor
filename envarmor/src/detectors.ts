import { type Detector, type ScanFinding } from "./engine-types.js";
import { STATIC_PATTERNS, ENV_KEY_PATTERNS, CONTEXTUAL_PATTERNS, getRiskEstimate } from "./patterns.js";

/**
 * Extracts hardcoded secret value(s) from a line if it is a valid assignment.
 * Excludes comparisons, conditionals, reads, and self-referencing assignments.
 */
export function getLineSecretValues(line: string, file: string): string[] {
  // Strip comments first to avoid matching false patterns in comments
  const cleanLine = line.split("//")[0].split("/*")[0].trim();
  if (!cleanLine) return [];

  // 1. Exclude comparisons (===, !==, ==, !=)
  if (/(?:===|!==|==|!=)/.test(cleanLine)) {
    return [];
  }

  // 2. Exclude conditionals (if, switch, case, ternary)
  if (/\b(?:if|switch|case)\b/.test(cleanLine)) {
    return [];
  }
  // Check for ternary operator: has ? and : (excluding URLs)
  if (cleanLine.includes("?") && cleanLine.includes(":")) {
    const withoutUrl = cleanLine.replace(/https?:\/\/[^\s]+/g, "");
    if (withoutUrl.includes("?") && withoutUrl.includes(":")) {
      return [];
    }
  }

  // 3. Extract Assignment Left-Hand Side (LHS) and Right-Hand Side (RHS)
  let lhs = "";
  let rhs = "";
  
  // Try splitting by '=' first (highest priority)
  const eqIndex = cleanLine.indexOf("=");
  let isValidEq = false;
  if (eqIndex !== -1) {
    const before = cleanLine[eqIndex - 1];
    const after = cleanLine[eqIndex + 1];
    
    const isComparison = (after === "=") || (before === "=") || (before === "!") || (before === "<") || (before === ">");
    const isArrow = (after === ">");
    
    if (!isComparison && !isArrow) {
      isValidEq = true;
      lhs = cleanLine.substring(0, eqIndex);
      rhs = cleanLine.substring(eqIndex + 1);
    }
  }
  
  if (!isValidEq) {
    // If no '=', split by ':'
    const colonIndex = cleanLine.indexOf(":");
    if (colonIndex !== -1) {
      // Ensure it's not a URL protocol like "http:" or "https:"
      const beforeUrl = cleanLine.substring(0, colonIndex);
      if (!(beforeUrl.endsWith("http") || beforeUrl.endsWith("https"))) {
        lhs = cleanLine.substring(0, colonIndex);
        rhs = cleanLine.substring(colonIndex + 1);
      }
    }
  }

  // If no assignment operator found, this is a read/reference without assignment. Discard!
  if (!rhs) {
    return [];
  }

  // 4. Pre-filter: if RHS is itself an env reference (process.env.X), discard.
  if (/\bprocess\.env\./.test(rhs)) {
    return [];
  }

  // 5. Extract actual string literal values to analyze
  const isEnvFile = /\b\.env(?:\..+)?$/i.test(file);
  const values = extractValuesToAnalyze(rhs, isEnvFile);

  return values;
}

function extractValuesToAnalyze(rhs: string, isEnvFile: boolean): string[] {
  const trimmed = rhs.trim();
  if (trimmed.length === 0) return [];
  
  // For env/properties files, the whole RHS (minus optional comments/quotes) is the value
  if (isEnvFile) {
    const stripped = trimmed.replace(/^(['"`])(.*)\1$/, "$2");
    return stripped ? [stripped] : [];
  }
  
  // For code files, extract all quoted string literals
  const stringLiteralRegex = /(["'`])(.*?)\1/g;
  const literals: string[] = [];
  let match;
  while ((match = stringLiteralRegex.exec(trimmed)) !== null) {
    const val = match[2];
    if (val) {
      literals.push(val);
    }
  }
  
  return literals;
}

/**
 * Detects secrets based on known high-confidence regex patterns
 */
export class RegexDetector implements Detector {
  name = "RegexDetector";

  scan(line: string, file: string, lineNumber: number): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const values = getLineSecretValues(line, file);
    if (values.length === 0) return [];

    const allPatterns = [...STATIC_PATTERNS, ...ENV_KEY_PATTERNS];

    for (const pattern of allPatterns) {
      const isEnvKey = ENV_KEY_PATTERNS.includes(pattern);
      
      if (isEnvKey) {
        // For env keys (like JWT_SECRET, DATABASE_URL), LHS must match the key pattern
        const source = pattern.regex.source;
        const regex = new RegExp(`\\b(?:${source})\\b`, "i");
        
        // Extract LHS
        const cleanLine = line.split("//")[0].split("/*")[0].trim();
        const eqIndex = cleanLine.indexOf("=");
        let lhs = cleanLine;
        if (eqIndex !== -1) {
          lhs = cleanLine.substring(0, eqIndex);
        } else {
          const colonIndex = cleanLine.indexOf(":");
          if (colonIndex !== -1) {
            lhs = cleanLine.substring(0, colonIndex);
          }
        }

        if (regex.test(lhs)) {
          // If LHS matches, ensure any extracted RHS value is non-empty
          for (const val of values) {
            if (val.trim().length > 0) {
              findings.push({
                file,
                line: lineNumber,
                type: pattern.type,
                severity: pattern.severity,
                risk: getRiskEstimate(pattern.type)
              });
              break;
            }
          }
        }
      } else {
        // For static patterns (AWS secrets, Stripe secrets, etc.), match directly against the extracted string values
        const source = pattern.regex.source;
        const flags = pattern.regex.flags.includes("g") ? pattern.regex.flags : pattern.regex.flags + "g";
        const regex = new RegExp(source, flags);
        
        for (const val of values) {
          if (regex.test(val)) {
            findings.push({
              file,
              line: lineNumber,
              type: pattern.type,
              severity: pattern.severity,
              risk: getRiskEstimate(pattern.type)
            });
            break;
          }
        }
      }
    }
    return findings;
  }
}

/**
 * Detects secrets based on Shannon entropy (randomness) in sensitive contexts
 */
export class EntropyDetector implements Detector {
  name = "EntropyDetector";

  scan(line: string, file: string, lineNumber: number): ScanFinding[] {
    const findings: ScanFinding[] = [];
    const values = getLineSecretValues(line, file);
    if (values.length === 0) return [];
    
    // Check common contextual keywords in LHS
    const contextualPatterns = Object.values(CONTEXTUAL_PATTERNS);
    
    // Extract LHS
    const cleanLine = line.split("//")[0].split("/*")[0].trim();
    const eqIndex = cleanLine.indexOf("=");
    let lhs = cleanLine;
    if (eqIndex !== -1) {
      lhs = cleanLine.substring(0, eqIndex);
    } else {
      const colonIndex = cleanLine.indexOf(":");
      if (colonIndex !== -1) {
        lhs = cleanLine.substring(0, colonIndex);
      }
    }
    
    for (const cp of contextualPatterns) {
      if (cp.contextRegex.test(cleanLine)) {
        for (const val of values) {
          const entropyScore = this.calculateEntropy(val);
          
          // High entropy string (>= 4.0 bits) usually indicates a generated secret
          if (entropyScore >= 4.0 && val.length > 16) {
            findings.push({
              file,
              line: lineNumber,
              type: cp.type,
              severity: cp.severity,
              risk: getRiskEstimate(cp.type)
            });
            break;
          }
        }
      }
    }

    return findings;
  }

  private calculateEntropy(text: string): number {
    const counts = new Map<string, number>();
    for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
    let score = 0;
    for (const count of counts.values()) {
      const p = count / text.length;
      score -= p * Math.log2(p);
    }
    return score;
  }
}
