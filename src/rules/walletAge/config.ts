/**
 * Public parameters for the Wallet Age rule.
 *
 * Semantics:
 * A wallet is considered valid if its first outbound
 * transaction occurred at or before `thresholdBlock`.
 */
export interface WalletAgeParams {
  /**
   * Block number threshold.
   * Example: 18_000_000
   */
  thresholdBlock: number;
}
