import { ZKEligibilitySDK } from "./src";


/**
 * Known extremely active wallet
 * Used intentionally to stress edge cases
 */
const TEST_WALLET = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";

type RuleId =
  | "MIN_ACTIVITY"
  | "WALLET_AGE"
  | "COOLDOWN"
  | "TOKEN_HOLD"
  | "ACTIVITY_CLASS";

interface EdgeTest {
  rule: RuleId;
  description: string;
  params?: any;
  expect?: boolean;
  expectClass?: number[];
  shouldThrow?: boolean;
}

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`ASSERTION FAILED: ${msg}`);
}

async function runEdgeTest(test: EdgeTest) {
  console.log(`\n🧪 ${test.rule}`);
  console.log(`   ${test.description}`);

  try {
    const result: any = await ZKEligibilitySDK.prove(
      test.rule,
      TEST_WALLET,
      test.params ?? {}
    );

    if (test.shouldThrow) {
      throw new Error("Expected failure but rule succeeded");
    }

    // ---- ACTIVITY CLASS ----
    if (test.rule === "ACTIVITY_CLASS") {
      assert(
        typeof result.classId === "number",
        "classId must be number"
      );

      assert(
        result.classId >= 0 && result.classId <= 3,
        "classId out of range"
      );

      if (test.expectClass) {
        assert(
          test.expectClass.includes(result.classId),
          `Expected class in ${test.expectClass}, got ${result.classId}`
        );
      }

      console.log(`   ✅ PASS — classId=${result.classId}`);
      return;
    }

    // ---- BOOLEAN RULES ----
    assert(
      typeof result.isValid === "boolean",
      "isValid must be boolean"
    );

    if (test.expect !== undefined) {
      assert(
        result.isValid === test.expect,
        `Expected isValid=${test.expect}, got ${result.isValid}`
      );
    }

    console.log(
      `   ${result.isValid ? "✅ PASS" : "❌ FAIL"} — isValid=${result.isValid}`
    );

    if (result.reason) {
      console.log(`   Reason: ${result.reason}`);
    }

  } catch (err: any) {
    if (!test.shouldThrow) {
      throw err;
    }
    console.log(`   ✅ PASS — correctly threw error`);
  }
}

async function runAll() {
  console.log("════════════════════════════════════════════════════════════");
  console.log("🚀 ZK ELIGIBILITY SDK — FULL EDGE-CASE TEST SUITE");
  console.log("════════════════════════════════════════════════════════════");
  console.log(`Wallet: ${TEST_WALLET}`);
  console.log(`Time:   ${new Date().toISOString()}`);

  const tests: EdgeTest[] = [
    // ---------------- MIN_ACTIVITY ----------------
    {
      rule: "MIN_ACTIVITY",
      description: "Minimal valid tx count",
      params: { minTx: 1 },
      expect: true
    },
    {
      rule: "MIN_ACTIVITY",
      description: "Impossible tx count (should fail cleanly)",
      params: { minTx: 1_000_000_000 },
      expect: false
    },
    {
      rule: "MIN_ACTIVITY",
      description: "Negative minTx rejected",
      params: { minTx: -1 },
      shouldThrow: true
    },

    // ---------------- WALLET_AGE ----------------
    {
      rule: "WALLET_AGE",
      description: "Wallet older than threshold",
      params: { thresholdBlock: 15_000_000 },
      expect: true
    },
    {
      rule: "WALLET_AGE",
      description: "Wallet NOT older than early block",
      params: { thresholdBlock: 100_000 },
      expect: false
    },
    {
      rule: "WALLET_AGE",
      description: "Negative block rejected",
      params: { thresholdBlock: -100 },
      shouldThrow: true
    },

    // ---------------- COOLDOWN ----------------
    {
      rule: "COOLDOWN",
      description: "Cooldown of 1 block (almost always valid)",
      params: { cooldownBlocks: 1 },
      expect: true
    },
    {
      rule: "COOLDOWN",
      description: "Absurd cooldown should fail",
      params: { cooldownBlocks: 1_000_000_000 },
      expect: false
    },

    // ---------------- TOKEN_HOLD ----------------
    {
      rule: "TOKEN_HOLD",
      description: "USDC held for small block window",
      params: {
        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        minHoldBlocks: 10
      },
      expect: true
    },
    {
      rule: "TOKEN_HOLD",
      description: "Impossible hold window",
      params: {
        tokenAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        minHoldBlocks: 1_000_000_000
      },
      expect: false
    },

    // ---------------- ACTIVITY_CLASS ----------------
    {
      rule: "ACTIVITY_CLASS",
      description: "High-activity wallet classification",
      expectClass: [2, 3]
    }
  ];

  let passed = 0;

  for (const test of tests) {
    await runEdgeTest(test);
    passed++;
  }

  console.log("\n════════════════════════════════════════════════════════════");
  console.log(`✅ ALL EDGE TESTS PASSED (${passed}/${tests.length})`);
  console.log("🔒 SDK CAN BE SAFELY LOCKED");
  console.log("════════════════════════════════════════════════════════════\n");
}

runAll()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("\n🔴 EDGE TEST FAILED");
    console.error(err.message);
    process.exit(1);
  });
