import { ethers } from "ethers";

const ELIGIBILITY_GATE_ABI = [
  "function verifyEligibility(bytes32 ruleId, tuple(uint256[2] a, uint256[2][2] b, uint256[2] c) proof, uint256[] publicSignals, uint256 nonce, uint256 expiryBlock) returns (bool)",
  "event ProofVerified(bytes32 indexed ruleId, address indexed verifier, address indexed sender, uint256 nonce, bool isValid, uint256 blockNumber)",
];

export interface EthSubmitResult {
  txHash: string;
  wait: () => Promise<ethers.TransactionReceipt>;
}

export async function submitProofOnChain(
  providerOrSigner: ethers.ContractRunner,
  gateAddress: string,
  ruleId: string,
  proof: { a: [string, string]; b: [[string, string], [string, string]]; c: [string, string] },
  publicSignals: Array<string | number>,
  nonce: number,
  expiryBlock: number,
  overrides?: ethers.Overrides
): Promise<EthSubmitResult> {
  if (!ethers.isAddress(gateAddress)) {
    throw new Error("Invalid gate address");
  }
  if (!ruleId || typeof ruleId !== "string") {
    throw new Error("Invalid ruleId");
  }

  const contract = new ethers.Contract(gateAddress, ELIGIBILITY_GATE_ABI, providerOrSigner);
  const tx = await contract.verifyEligibility(ruleId, proof, publicSignals, nonce, expiryBlock, overrides ?? {});

  return {
    txHash: tx.hash as string,
    wait: async () => tx.wait(),
  };
}

export function makeRuleId(name: string): string {
  return ethers.keccak256(ethers.toUtf8Bytes(name));
}
