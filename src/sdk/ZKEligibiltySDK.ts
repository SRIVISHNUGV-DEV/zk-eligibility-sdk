import { RULES } from "./ruleRegistry";
import { RuleId } from "../types/Rule";
import { SDKResult } from "./types";
import { ErrorCode } from "../types/ErrorCode";

// Rule executors
import { proveWalletAge } from "../rules/walletAge/walletAge";
import { proveMinActivity } from "../rules/minActivity/minActivity";
import { proveCooldown } from "../rules/cooldown/cooldown";
import { proveTokenHold } from "../rules/tokenHold/tokenHold";
import { proveActivityClass } from "../rules/activityClass/activityClass";

export class ZKEligibilitySDK {

  static listRules() {
    return Object.values(RULES).map(rule => ({
      id: rule.id,
      description: rule.description,
      requiresParams: rule.requiresParams,
      outputType: rule.outputType
    }));
  }

  static getRule(ruleId: RuleId) {
    const rule = RULES[ruleId];
    if (!rule) {
      throw new Error(`Unknown rule: ${ruleId}`);
    }
    return rule;
  }

  static async prove(
    ruleId: RuleId,
    walletAddress: string,
    params?: any
  ): Promise<SDKResult> {
    try {
      switch (ruleId) {
        case "WALLET_AGE":
          return await proveWalletAge(walletAddress, params);

        case "MIN_ACTIVITY":
          return await proveMinActivity(walletAddress, params);

        case "COOLDOWN":
          return await proveCooldown(walletAddress, params);

        case "TOKEN_HOLD":
          return await proveTokenHold(walletAddress, params);

        case "ACTIVITY_CLASS":
          return await proveActivityClass(walletAddress);

        default:
          return {
            isValid: false,
            reason: ErrorCode.INTERNAL_ERROR
          };
      }
    } catch (err: any) {
      console.error("SDK prove error:", err);
      return {
        isValid: false,
        reason: ErrorCode.INTERNAL_ERROR
      };
    }
  }
}
