import { describe, it, expect } from "vitest";
import { proveCooldown } from "../src/rules/cooldown/cooldown";

const WALLET = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";

describe("Cooldown Rule", () => {

  it("returns a boolean result", async () => {
    const result = await proveCooldown(WALLET, {
      cooldownBlocks: 1000
    });

    expect(typeof result.isValid).toBe("boolean");
  });
});
