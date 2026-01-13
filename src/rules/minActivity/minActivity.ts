import { defaultProvider } from "../../providers";
import { generateZKProof } from "../../zk/generateProof";
import { MinActivityParams } from "./config";
import { LIMITS } from "../../constants/limits";
import { ErrorCode } from "../../types/ErrorCode";

export type MinActivityResult =
  | {
      isValid: true;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };

export async function proveMinActivity(
  walletAddress: string,
  params: MinActivityParams
): Promise<MinActivityResult> {
  // 1. Validate inputs
  if (!walletAddress || typeof walletAddress !== "string") {
    return { isValid: false, reason: ErrorCode.INVALID_WALLET };
  }

  if (typeof params.minTx !== "number" || params.minTx < 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  // 2. Fetch facts
  const txCount = await defaultProvider.getTotalOutboundTxCount(walletAddress);
  const currentBlock = await defaultProvider.getCurrentBlock();

  if (currentBlock > LIMITS.MAX_BLOCK_NUMBER) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  // 3. Edge cases
  if (txCount === null) {
    return { isValid: false, reason: ErrorCode.NO_ACTIVITY };
  }

  if (params.minTx === 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (params.minTx < 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (params.minTx > LIMITS.MAX_MIN_TX) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  // 4. Prepare circuit input (MUST match circom)
  const zkInput = {
    tx_count: txCount,
    min_tx: params.minTx
  };

  // 5. Generate proof
  try {
    const { proof, publicSignals } = await generateZKProof({
      ruleId: "MIN_ACTIVITY",
      input: zkInput
    });

    // 6. Interpret result
    const proofIsValid = publicSignals[0] === "1";

    if (proofIsValid) {
      return {
        isValid: true,
        proof,
        publicSignals
      };
    } else {
      return {
        isValid: false,
        reason: ErrorCode.INVALID_PARAMS
      };
    }
  } catch (err: any) {
    console.error("MIN_ACTIVITY_ERROR:", err);
    return { isValid: false, reason: ErrorCode.PROOF_GENERATION_FAILED };
  }
}
