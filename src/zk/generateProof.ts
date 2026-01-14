import fs from "fs";
import path from "path";
import { generateWitness } from "./generateWitness";
import { runCmd } from "./runCmd";
import { getCircuitArtifacts } from "./cache";
import { ErrorCode } from "../types/ErrorCode";

interface GenerateZKProofParams {
  ruleId: string;
  input: Record<string, any>;
}

export async function generateZKProof({
  ruleId,
  input
}: GenerateZKProofParams): Promise<{ proof: any; publicSignals: any }> {
  try {
    const workDir = path.join(process.cwd(), ".zk", ruleId);
    fs.mkdirSync(workDir, { recursive: true });

    const inputPath = path.join(workDir, "input.json");
    const witnessPath = path.join(workDir, "witness.wtns");
    const proofPath = path.join(workDir, "proof.json");
    const publicPath = path.join(workDir, "public.json");

    fs.writeFileSync(inputPath, JSON.stringify(input, null, 2));

    const { wasm, zkey } = getCircuitArtifacts(ruleId);

    // 1. Generate witness
    await generateWitness({
      wasmPath: wasm,
      inputPath,
      outputPath: witnessPath
    });

    // 2. Generate proof
    await runCmd("snarkjs", [
      "groth16",
      "prove",
      zkey,
      witnessPath,
      proofPath,
      publicPath
    ]);

    return {
      proof: JSON.parse(fs.readFileSync(proofPath, "utf-8")),
      publicSignals: JSON.parse(fs.readFileSync(publicPath, "utf-8"))
    };
  } catch (err: any) {
    console.error("Proof generation error:", err.message || err);
    throw {
      code: ErrorCode.PROOF_GENERATION_FAILED,
      error: err
    };
  }
}
