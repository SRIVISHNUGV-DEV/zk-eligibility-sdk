/**
 * Unique identifier for a rule
 */
export type RuleId =
  | "WALLET_AGE"
  | "MIN_ACTIVITY"
  | "COOLDOWN"
  | "TOKEN_HOLD"
  | "ACTIVITY_CLASS";

/**
 * Generic rule interface
 * Implemented by all rule adapters
 */
export interface Rule<Params = any, Result = any> {
  id: RuleId;
  prove(
    walletAddress: string,
    params: Params
  ): Promise<Result>;
}
