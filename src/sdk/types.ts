import { ErrorCode } from "../types/ErrorCode";

export interface ProofResult {
  proof: any;
  publicSignals: any;
}

export interface RuleResult {
  isValid: boolean;
  proof?: any;
  publicSignals?: any;
  reason?: string;
}

export interface GenerateProofInput {
  ruleId: string;
  input: Record<string, any>;
}

export type SDKResult =
  | {
      isValid: true;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };
