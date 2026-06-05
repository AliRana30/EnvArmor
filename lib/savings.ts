import { getRiskRange } from "./savings-engine";
import type { Severity } from "@prisma/client";

export function estimateCostSaved(secretType: string, severity: Severity): number {
  const range = getRiskRange(secretType);
  const multiplier = severity === "CRITICAL" ? 1.5 : (severity === "HIGH" ? 1 : 0.4);
  return Math.round(range.high * multiplier);
}
