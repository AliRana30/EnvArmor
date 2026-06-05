import { Severity } from "./patterns.js";

export interface RiskEstimate {
  low: number;
  high: number;
  basis: string;
}

export interface ScanFinding {
  file: string;
  line: number;
  type: string;
  severity: Severity;
  risk: RiskEstimate;
  content?: string;
}

export interface Detector {
  name: string;
  scan(line: string, file: string, lineNumber: number): ScanFinding[];
}

export interface EngineOptions {
  cwd: string;
  detectors: Detector[];
  stagedOnly?: boolean;
  paths?: string[];
}

export interface EngineResult {
  findings: ScanFinding[];
  totalExposureLow: number;
  totalExposureHigh: number;
  filesScanned: number;
  durationMs: number;
}
