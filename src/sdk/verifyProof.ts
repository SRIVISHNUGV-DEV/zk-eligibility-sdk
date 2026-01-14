import { verifyZKProof } from "../zk/verifyProof";
import { ErrorCode } from "../types/ErrorCode";

export type VerifyProofResult =
  | { isValid: true }
  | { isValid: false; reason: ErrorCode };

export async function verifyProof(
  ruleId: string,
  proof: any,
  publicSignals: any
): Promise<VerifyProofResult> {
  try {
    const isValid = await verifyZKProof(ruleId, proof, publicSignals);
    if (isValid) {
      return { isValid: true };
    } else {
      return { isValid: false, reason: ErrorCode.PROOF_VERIFICATION_FAILED };
    }
  } catch (err: any) {
    console.error("Proof verification error:", err);
    return { isValid: false, reason: ErrorCode.PROOF_VERIFICATION_FAILED };
  }
}
