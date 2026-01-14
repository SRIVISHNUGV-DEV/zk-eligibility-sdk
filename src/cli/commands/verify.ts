import fs from "fs";
import { verifyZKProof as verifyProof } from "../../zk/verifyProof";
import { RULES } from "../../sdk/ruleRegistry";

export async function verifyCommand(args: string[]) {
  try {
    const [ruleId, proofPath, publicPath] = args;

    if (!ruleId || !proofPath || !publicPath) {
      throw new Error(
        "Usage: verify <RULE_ID> <proof.json> <public.json>"
      );
    }

    // Validate rule
    if (!RULES[ruleId as keyof typeof RULES]) {
      throw new Error(`Unknown rule: ${ruleId}`);
    }

    // Validate files
    if (!fs.existsSync(proofPath)) {
      throw new Error(`Proof file not found: ${proofPath}`);
    }

    if (!fs.existsSync(publicPath)) {
      throw new Error(`Public signals file not found: ${publicPath}`);
    }

    const proof = JSON.parse(fs.readFileSync(proofPath, "utf-8"));
    const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf-8"));

    const isValid = await verifyProof(ruleId, proof, publicSignals);

    console.log(
      isValid
        ? `✅ Proof is valid for rule ${ruleId}`
        : `❌ Proof is INVALID for rule ${ruleId}`
    );

    process.exit(isValid ? 0 : 1);

  } catch (err: any) {
    console.error(`❌ Verification failed: ${err.message}`);
    process.exit(1);
  }
}
