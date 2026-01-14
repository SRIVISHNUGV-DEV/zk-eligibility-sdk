import { defaultProvider } from "../../providers";
import { generateZKProof } from "../../zk/generateProof";
import { CooldownParams } from "./config";
import { LIMITS } from "../../constants/limits";
import { ErrorCode } from "../../types/ErrorCode";

export type CooldownResult =
  | {
      isValid: true;
      proof: any;
      publicSignals: any;
    }
  | {
      isValid: false;
      reason: ErrorCode;
    };

export async function proveCooldown(
  walletAddress: string,
  params: CooldownParams
): Promise<CooldownResult> {
  // 1. Validate inputs
  if (!walletAddress || typeof walletAddress !== "string") {
    return { isValid: false, reason: ErrorCode.INVALID_WALLET };
  }

  if (
    typeof params.cooldownBlocks !== "number" ||
    params.cooldownBlocks < 0
  ) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  // 2. Fetch facts
  const lastTxBlock =
    await defaultProvider.getLastOutboundTxBlock(walletAddress);

  const currentBlock =
    await defaultProvider.getCurrentBlock();

  // 3. Edge cases
  if (lastTxBlock === null) {
    return { isValid: false, reason: ErrorCode.NO_ACTIVITY };
  }

  if (currentBlock > LIMITS.MAX_BLOCK_NUMBER) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  if (params.cooldownBlocks > currentBlock) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  if (params.cooldownBlocks === 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (params.cooldownBlocks < 0) {
    return { isValid: false, reason: ErrorCode.INVALID_PARAMS };
  }

  if (params.cooldownBlocks > LIMITS.MAX_COOLDOWN_BLOCKS) {
    return { isValid: false, reason: ErrorCode.PARAM_OUT_OF_RANGE };
  }

  // 4. Prepare circuit input (MUST match circom)
  const zkInput = {
    last_tx_block: lastTxBlock,
    current_block: currentBlock,
    cooldown_blocks: params.cooldownBlocks
  };

  // 5. Generate proof
  try {
    const { proof, publicSignals } = await generateZKProof({
      ruleId: "COOLDOWN",
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
