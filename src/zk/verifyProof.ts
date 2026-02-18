import fs from "fs";
import * as snarkjs from "snarkjs";
import { getCircuitArtifacts } from "./cache";

export async function verifyZKProof(
  ruleId: string,
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const { verificationKey } = getCircuitArtifacts(ruleId);

  try {
    if (!fs.existsSync(verificationKey)) {
      throw new Error(`Verification key not found: ${verificationKey}`);
    }
    const vKey = JSON.parse(fs.readFileSync(verificationKey, "utf-8"));
    return await snarkjs.groth16.verify(vKey, publicSignals, proof);
  } catch {
    return false;
  }
}
