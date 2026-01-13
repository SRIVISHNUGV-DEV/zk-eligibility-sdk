import fs from "fs";
import path from "path";
import { runCmd } from "./runCmd";
import { getCircuitArtifacts } from "./cache";

export async function verifyZKProof(
  ruleId: string,
  proof: any,
  publicSignals: any
): Promise<boolean> {
  const workDir = path.join(process.cwd(), ".zk", ruleId);
  fs.mkdirSync(workDir, { recursive: true });

  const proofPath = path.join(workDir, "proof.json");
  const publicPath = path.join(workDir, "public.json");

  fs.writeFileSync(proofPath, JSON.stringify(proof, null, 2));
  fs.writeFileSync(publicPath, JSON.stringify(publicSignals, null, 2));

  const { verificationKey } = getCircuitArtifacts(ruleId);

  try {
    await runCmd("snarkjs", [
      "groth16",
      "verify",
      verificationKey,
      publicPath,
      proofPath
    ]);

    // snarkjs exits cleanly → proof is valid
    return true;

  } catch {
    // snarkjs throws → proof is invalid
    return false;
  }
}
