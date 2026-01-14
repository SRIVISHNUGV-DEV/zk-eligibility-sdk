import { describe, it, expect } from "vitest";
import { proveMinActivity } from "../src/rules/minActivity/minActivity";

const ACTIVE_WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

describe("MinActivity Rule", () => {

  it("accepts active wallet", async () => {
    const result = await proveMinActivity(ACTIVE_WALLET, {
      minTx: 5
    });

    expect(result.isValid).toBe(true);
  });

  it("rejects inactive wallet", async () => {
    const result = await proveMinActivity("0x0000000000000000000000000000000000000000", {
      minTx: 5
    });

    expect(result.isValid).toBe(false);
  });
});
