import { defaultProvider } from "../../providers";
import { generateZKProof } from "../../zk/generateProof";
import { WalletAgeParams } from "./config";
import { LIMITS } from "../../constants/limits";
import { ErrorCode } from "../../types/ErrorCode";

/**
 * Result returned by all rule evaluators
 */
export type WalletAgeResult =
  | {
      isValid: true;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };

/**
 * Proves that a wallet’s first outbound transaction
 * occurred before a given threshold block.
 *
 * Semantics:
 * - Chain-specific
 * - Outbound tx defines "activity"
 * - No outbound tx => invalid
 */
export async function proveWalletAge(
  walletAddress: string,
  params: WalletAgeParams
): Promise<WalletAgeResult> {

  // 1. Input validation
  if (!walletAddress || typeof walletAddress !== "string") {
    return {
      isValid: false,
      reason: ErrorCode.INVALID_WALLET
    };
  }

  if (
    typeof params.thresholdBlock !== "number" ||
    params.thresholdBlock <= 0
  ) {
    return {
      isValid: false,
      reason: ErrorCode.INVALID_PARAMS
    };
  }

  // 2. Fetch blockchain fact
  const firstTxBlock = await defaultProvider.getFirstOutboundTxBlock(walletAddress);

  const currentBlock = await defaultProvider.getCurrentBlock();

  if (params.thresholdBlock > currentBlock) {
    return {
      isValid: false,
      reason: ErrorCode.PARAM_OUT_OF_RANGE
    };
  }
  if (currentBlock > LIMITS.MAX_BLOCK_NUMBER) {
    return {
      isValid: false,
      reason: ErrorCode.PARAM_OUT_OF_RANGE
    };
  }
 if (params.thresholdBlock <= 0) {
    return {
      isValid: false,
      reason: ErrorCode.INVALID_PARAMS
    };
  }

  // 3. Semantic early rejection
  if (firstTxBlock === null) {
    return {
      isValid: false,
      reason: ErrorCode.NO_ACTIVITY
    };
  }

  // 4. Prepare ZK inputs
  const zkInput = {
    first_tx_block: firstTxBlock,
    threshold_block: params.thresholdBlock
  };

  // 5. Generate ZK proof
  try {
    const proofResult = await generateZKProof({
      ruleId: "WALLET_AGE",
      input: zkInput
    });

    // 6. Interpret proof output
    // 7. Normalize return
    // The proof is successful if we reach here
    const proofIsValid = proofResult.publicSignals[0] === "1";

    if (proofIsValid) {
      return {
        isValid: true,
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals
      };
    } else {
      return {
        isValid: false,
        reason: ErrorCode.PROOF_OUTPUT_FALSE
      };
    }
  } catch {
    return { isValid: false, reason: ErrorCode.PROOF_GENERATION_FAILED };
  }
}
