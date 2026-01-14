import { describe, it, expect } from "vitest";
import { proveWalletAge } from "../src/rules/walletAge/walletAge";

const OLD_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

describe("WalletAge Rule", () => {

  it("accepts an old wallet", async () => {
    const result = await proveWalletAge(OLD_WALLET, {
      thresholdBlock: 18_000_000
    });

    expect(result.isValid).toBe(true);
  });

  it("rejects wallet with no outbound tx", async () => {
    const result = await proveWalletAge("0x0000000000000000000000000000000000000000", {
      thresholdBlock: 18_000_000
    });

    expect(result.isValid).toBe(false);
  });

  it("rejects invalid params", async () => {
    const result = await proveWalletAge(OLD_WALLET, {
      thresholdBlock: -1
    });

    expect(result.isValid).toBe(false);
  });
});
