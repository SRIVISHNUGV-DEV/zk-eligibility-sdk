import { GenerateProofInput, ProofResult } from "./types";
import { generateZKProof } from "../zk/generateProof";
import { ProofGenerationError } from "./errors";

export async function generateProof(
  params: GenerateProofInput
): Promise<ProofResult> {
  try {
    return await generateZKProof(params);
  } catch (err) {
    throw new ProofGenerationError();
  }
}
