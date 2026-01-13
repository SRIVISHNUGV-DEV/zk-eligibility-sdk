import { describe, it, expect } from "vitest";
import { executeRule } from "../src/sdk/executeRule";

const WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

describe("SDK Rule Dispatcher", () => {

  it("executes WALLET_AGE via dispatcher", async () => {
    const result = await executeRule(
      "WALLET_AGE",
      WALLET,
      { thresholdBlock: 18_000_000 }
    );

    expect(result).toHaveProperty("isValid");
  });

  it("throws on unknown rule", async () => {
    await expect(
      executeRule("UNKNOWN" as any, WALLET, {})
    ).rejects.toThrow();
  });
});
