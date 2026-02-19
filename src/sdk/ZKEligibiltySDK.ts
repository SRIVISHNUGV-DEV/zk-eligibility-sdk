import { RULES } from "./ruleRegistry";
import { RuleId } from "../types/Rule";
import { OnboardParams, OnboardResult, SDKResult } from "./types";
import { ErrorCode } from "../types/ErrorCode";
import { verifyProof } from "./verifyProof";

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
          return await proveActivityClass(walletAddress, params);

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

  static async onboard(
    walletAddress: string,
    params: OnboardParams
  ): Promise<OnboardResult> {
    const results: OnboardResult["results"] = {
      WALLET_AGE: { prove: false, verify: false },
      MIN_ACTIVITY: { prove: false, verify: false },
      COOLDOWN: { prove: false, verify: false },
      TOKEN_HOLD: { prove: false, verify: false },
      ACTIVITY_CLASS: { prove: false, verify: false }
    };

    const runAndVerify = async (
      ruleId: RuleId,
      ruleParams: any,
      includeClass: boolean = false
    ): Promise<OnboardResult["results"][RuleId]> => {
      const proved = await this.prove(ruleId, walletAddress, ruleParams);
      if (!proved.isValid) {
        return {
          prove: false,
          verify: false,
          reason: proved.reason
        };
      }

      const verified = await verifyProof(ruleId, proved.proof, proved.publicSignals);
      const out: OnboardResult["results"][RuleId] = {
        prove: true,
        verify: verified.isValid === true,
        reason: verified.isValid ? undefined : verified.reason,
        proof: proved.proof,
        publicSignals: proved.publicSignals
      };

      if (includeClass && typeof (proved as any).classId === "number") {
        out.classId = (proved as any).classId as 0 | 1 | 2 | 3;
      }
      return out;
    };

    results.WALLET_AGE = await runAndVerify("WALLET_AGE", params.walletAge);
    results.MIN_ACTIVITY = await runAndVerify("MIN_ACTIVITY", params.minActivity);
    results.COOLDOWN = await runAndVerify("COOLDOWN", params.cooldown);
    results.TOKEN_HOLD = await runAndVerify("TOKEN_HOLD", params.tokenHold);
    results.ACTIVITY_CLASS = await runAndVerify("ACTIVITY_CLASS", params.activityClass ?? {}, true);

    const failedRules = (Object.keys(results) as RuleId[]).filter(
      (rule) => !(results[rule].prove && results[rule].verify)
    );

    return {
      canOnboard: failedRules.length === 0,
      results,
      failedRules
    };
  }
}
