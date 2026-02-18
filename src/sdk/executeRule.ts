import { RuleId } from "../types/Rule";
import { SDKResult } from "./types";
import { ErrorCode } from "../types/ErrorCode";

// Import rule adapters
import { proveWalletAge } from "../rules/walletAge/walletAge";
import { proveMinActivity } from "../rules/minActivity/minActivity";
import { proveCooldown } from "../rules/cooldown/cooldown";
import { proveTokenHold } from "../rules/tokenHold/tokenHold";
import { proveActivityClass } from "../rules/activityClass/activityClass";

/**
 * Central rule dispatcher.
 * CLI and SDK users call THIS, never rules directly.
 * Never throws - always returns SDKResult.
 */
export async function executeRule(
  ruleId: RuleId,
  wallet: string,
  params: any
): Promise<SDKResult> {
  try {
    switch (ruleId) {
      case "WALLET_AGE":
        return await proveWalletAge(wallet, params);

      case "MIN_ACTIVITY":
        return await proveMinActivity(wallet, params);

      case "COOLDOWN":
        return await proveCooldown(wallet, params);

      case "TOKEN_HOLD":
        return await proveTokenHold(wallet, params);

      case "ACTIVITY_CLASS":
        return await proveActivityClass(wallet, params);

      default:
        return {
          isValid: false,
          reason: ErrorCode.INTERNAL_ERROR
        };
    }
  } catch (err: any) {
    console.error("Rule execution error:", err);
    return {
      isValid: false,
      reason: ErrorCode.INTERNAL_ERROR
    };
  }
}
