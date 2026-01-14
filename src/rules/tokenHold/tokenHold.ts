import { defaultProvider } from "../../providers";
import { generateZKProof } from "../../zk/generateProof";
import { TokenHoldParams } from "./config";
import { LIMITS } from "../../constants/limits";
import { ErrorCode } from "../../types/ErrorCode";

export type TokenHoldResult =
  | {
      isValid: true;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };

export async function proveTokenHold(
  walletAddress: string,
  params: TokenHoldParams
): Promise<TokenHoldResult> {
  // 1. Validate inputs
  if (!walletAddress || typeof walletAddress !== "string") {
    return { isValid: false, reason: ErrorCode.INVALID_WALLET };
  }

  if (!params.tokenAddress || typeof params.tokenAddress !== "string") {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (
    typeof params.minHoldBlocks !== "number" ||
    params.minHoldBlocks < 0
  ) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  // 2. Fetch facts
  const firstTokenTxBlock =
    await defaultProvider.getFirstTokenTransferInBlock(
      walletAddress,
      params.tokenAddress
    );

  const currentBlock =
    await defaultProvider.getCurrentBlock();

  // 3. Edge cases
  if (firstTokenTxBlock === null) {
    return { isValid: false, reason: ErrorCode.NO_ACTIVITY };
  }

  if (currentBlock > LIMITS.MAX_BLOCK_NUMBER) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  if (params.minHoldBlocks > currentBlock) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  if(params.minHoldBlocks === 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (params.minHoldBlocks < 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }
  if (params.minHoldBlocks > LIMITS.MAX_HOLD_BLOCKS) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  // 4. Prepare circuit input
  const zkInput = {
    first_token_tx_block: firstTokenTxBlock,
    current_block: currentBlock,
    min_hold_blocks: params.minHoldBlocks
  };

  // 5. Generate proof
  try {
    const { proof, publicSignals } = await generateZKProof({
      ruleId: "TOKEN_HOLD",
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
  } catch {
    return { isValid: false, reason: ErrorCode.PROOF_GENERATION_FAILED };
  }
}
