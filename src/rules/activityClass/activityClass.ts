import { defaultProvider } from "../../providers";
import { generateZKProof } from "../../zk/generateProof";
import { ErrorCode } from "../../types/ErrorCode";

export type ActivityClassResult =
  | {
      isValid: true;
      classId: 0 | 1 | 2 | 3;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };

export async function proveActivityClass(
  walletAddress: string
): Promise<ActivityClassResult> {
  // 1. Validate input
  if (!walletAddress || typeof walletAddress !== "string") {
    return { isValid: false, reason: ErrorCode.INVALID_WALLET };
  }

  // 2. Fetch facts
  const txCount = await defaultProvider.getTotalOutboundTxCount(walletAddress);

  // 3. Edge cases
  if (txCount === null) {
    return { isValid: false, reason: ErrorCode.NO_ACTIVITY };
  }

  // 4. Prepare circuit input
  const zkInput = {
    tx_count: txCount
  };

  // 5. Generate proof
  try {
    const { proof, publicSignals } = await generateZKProof({
      ruleId: "ACTIVITY_CLASS",
      input: zkInput
    });

    // 6. Decode one-hot output
    const bits = publicSignals.map((v: string) => v === "1");

    const classId = bits.indexOf(true);

    if (classId === -1 || classId > 3) {
      return { isValid: false, reason: ErrorCode.INTERNAL_ERROR };
    }

    return {
      isValid: true,
      classId: classId as 0 | 1 | 2 | 3,
      proof,
      publicSignals
    };
  } catch {
    return { isValid: false, reason: ErrorCode.PROOF_GENERATION_FAILED };
  }
}
