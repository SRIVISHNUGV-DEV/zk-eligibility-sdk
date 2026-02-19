import { ErrorCode } from "../types/ErrorCode";
import type { ActivityClassParams } from "../rules/activityClass/config";
import type { CooldownParams } from "../rules/cooldown/config";
import type { MinActivityParams } from "../rules/minActivity/config";
import type { TokenHoldParams } from "../rules/tokenHold/config";
import type { WalletAgeParams } from "../rules/walletAge/config";

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

export interface OnboardParams {
  walletAge: WalletAgeParams;
  minActivity: MinActivityParams;
  cooldown: CooldownParams;
  tokenHold: TokenHoldParams;
  activityClass?: ActivityClassParams;
}

export interface OnboardRuleResult {
  prove: boolean;
  verify: boolean;
  reason?: ErrorCode;
  proof?: any;
  publicSignals?: any;
  classId?: 0 | 1 | 2 | 3;
}

export interface OnboardResult {
  canOnboard: boolean;
  results: {
    WALLET_AGE: OnboardRuleResult;
    MIN_ACTIVITY: OnboardRuleResult;
    COOLDOWN: OnboardRuleResult;
    TOKEN_HOLD: OnboardRuleResult;
    ACTIVITY_CLASS: OnboardRuleResult;
  };
  failedRules: string[];
}
