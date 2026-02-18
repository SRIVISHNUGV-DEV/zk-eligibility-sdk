#!/usr/bin/env node

import "dotenv/config";
import { listRulesCommand } from "./commands/listRules";
import { proveCommand } from "./commands/prove";
import { verifyCommand } from "./commands/verify";

async function main() {
  const [, , command, ...args] = process.argv;

  try {
    switch (command) {
      case "list-rules":
        await listRulesCommand();
        break;

      case "prove":
        await proveCommand(args);
        break;

      case "verify":
        await verifyCommand(args);
        break;

      case "submit":
        // Submit a proof on-chain (requires PROVIDER_URL and PRIVATE_KEY in env)
        // Usage: zkesdk submit <RULE_NAME_OR_ID> <proof.json> <public.json> <GATE_ADDRESS> [nonce] [expiryBlock]
        const { submitCommand } = await import('./commands/submit');
        await submitCommand(args);
        break;

      case "--help":
      case "-h":
      default:
        printHelp();
        process.exit(command ? 1 : 0);
    }
  } catch (err: any) {
    console.error("❌ CLI Error:", err.message ?? err);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
ZK Eligibility SDK CLI

Usage:
  zkesdk list-rules

  zkesdk prove <RULE_ID> <WALLET> "<PARAMS_JSON>"
    Example:
      zkesdk prove MIN_ACTIVITY 0xabc "{\\"minTx\\":10}"

  zkesdk verify <RULE_ID> <proof.json> <public.json>

Commands:
  list-rules     List all supported eligibility rules
  prove          Generate a zero-knowledge proof
  verify         Verify a proof (off-chain)

Notes:
  - PARAMS_JSON must be valid JSON
  - On Windows / PowerShell, JSON must be escaped
`);
}

main();