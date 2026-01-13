import { RuleId } from "../types/Rule";

export type RuleOutputType = "BOOLEAN" | "CLASSIFICATION";

export interface RuleMeta {
  id: RuleId;
  circuitDir: string;
  requiresParams: boolean;
  outputType: RuleOutputType;
  description: string;
}

export const RULES: Record<RuleId, RuleMeta> = {
  WALLET_AGE: {
    id: "WALLET_AGE",
    circuitDir: "walletAge",
    requiresParams: true,
    outputType: "BOOLEAN",
    description: "Proves the wallet's first outbound transaction occurred before a given block threshold"
  },

  MIN_ACTIVITY: {
    id: "MIN_ACTIVITY",
    circuitDir: "minActivity",
    requiresParams: true,
    outputType: "BOOLEAN",
    description: "Proves the wallet has at least a minimum number of outbound transactions"
  },

  COOLDOWN: {
    id: "COOLDOWN",
    circuitDir: "cooldown",
    requiresParams: true,
    outputType: "BOOLEAN",
    description: "Proves the wallet has been inactive for a minimum cooldown period"
  },

  TOKEN_HOLD: {
    id: "TOKEN_HOLD",
    circuitDir: "tokenHold",
    requiresParams: true,
    outputType: "BOOLEAN",
    description: "Proves the wallet has held a specific token for a minimum number of blocks"
  },

  ACTIVITY_CLASS: {
    id: "ACTIVITY_CLASS",
    circuitDir: "activityClass",
    requiresParams: false,
    outputType: "CLASSIFICATION",
    description: "Classifies wallet activity into one of four deterministic activity classes"
  }
} as const;
