import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { ethers } from "ethers";

import { proveTokenHold } from "../src/rules/tokenHold/tokenHold";
import { ErrorCode } from "../src/types/ErrorCode";
import { submitCommand } from "../src/cli/commands/submit";

async function testInvalidTokenAddressRejected(): Promise<void> {
  const res = await proveTokenHold("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", {
    tokenAddress: "not-an-address",
    minHoldBlocks: 100,
  });
  assert.equal(res.isValid, false);
  if (!res.isValid) {
    assert.equal(res.reason, ErrorCode.INVALID_PARAMS);
  }
}

async function testSubmitCommandRejectsInvalidNonceAndExpiry(): Promise<void> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "zk-sdk-test-"));
  const proofPath = path.join(tmp, "proof.json");
  const publicPath = path.join(tmp, "public.json");
  fs.writeFileSync(proofPath, JSON.stringify({ a: ["0", "0"], b: [["0", "0"], ["0", "0"]], c: ["0", "0"] }));
  fs.writeFileSync(publicPath, JSON.stringify(["1"]));

  process.env.PROVIDER_URL = "https://example.invalid";
  process.env.PRIVATE_KEY = "0x" + "11".repeat(32);

  // Invalid nonce should fail before any RPC call.
  await assert.rejects(
    () => submitCommand(["WALLET_AGE", proofPath, publicPath, "0x000000000000000000000000000000000000dEaD", "NaN"]),
    /Invalid nonce/
  );

  // Mock getBlockNumber to avoid network for expiry validation path.
  const originalGetBlockNumber = (ethers.JsonRpcProvider as any).prototype.getBlockNumber;
  (ethers.JsonRpcProvider as any).prototype.getBlockNumber = async function () {
    return 1000;
  };

  try {
    await assert.rejects(
      () => submitCommand(["WALLET_AGE", proofPath, publicPath, "0x000000000000000000000000000000000000dEaD", "1", "999"]),
      /Invalid expiryBlock/
    );
  } finally {
    (ethers.JsonRpcProvider as any).prototype.getBlockNumber = originalGetBlockNumber;
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function testEligibilityGateReplayGuardsPresent(): void {
  const gatePath = path.resolve("contracts", "gate", "EligibilityGate.sol");
  const source = fs.readFileSync(gatePath, "utf-8");

  assert.match(source, /mapping\(bytes32 => bool\) public usedProofDigests;/);
  assert.match(source, /if \(usedProofDigests\[digest\]\) revert ProofAlreadyUsed\(\);/);
  assert.match(source, /if \(usedNonces\[ruleId\]\[msg\.sender\] >= nonce\) revert NonceAlreadyUsed\(\);/);
  assert.match(source, /if \(block\.number > expiryBlock\) revert ProofExpired\(\);/);
  assert.match(source, /if \(expiryBlock > block\.number \+ MAX_PROOF_LIFETIME\) revert ExpiryTooFar\(\);/);
}

async function main(): Promise<void> {
  await testInvalidTokenAddressRejected();
  await testSubmitCommandRejectsInvalidNonceAndExpiry();
  testEligibilityGateReplayGuardsPresent();
  console.log("security-regression: all checks passed");
}

main().catch((err) => {
  console.error("security-regression failed:", err);
  process.exit(1);
});
