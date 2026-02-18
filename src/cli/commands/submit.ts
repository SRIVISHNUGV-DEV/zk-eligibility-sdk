import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { submitProofOnChain, makeRuleId } from '../../sdk/eth';

export async function submitCommand(args: string[]) {
  const [ruleNameOrId, proofPath, publicPath, gateAddress, nonceArg, expiryArg] = args;

  if (!ruleNameOrId || !proofPath || !publicPath || !gateAddress) {
    throw new Error('Usage: submit <RULE_NAME_OR_ID> <proof.json> <public.json> <GATE_ADDRESS> [nonce] [expiryBlock]');
  }

  const resolvedProof = path.resolve(process.cwd(), proofPath);
  const resolvedPublic = path.resolve(process.cwd(), publicPath);

  if (!fs.existsSync(resolvedProof)) throw new Error(`Proof file not found: ${resolvedProof}`);
  if (!fs.existsSync(resolvedPublic)) throw new Error(`Public file not found: ${resolvedPublic}`);

  const proof = JSON.parse(fs.readFileSync(resolvedProof, 'utf-8'));
  const publicSignals = JSON.parse(fs.readFileSync(resolvedPublic, 'utf-8'));

  const providerUrl = process.env.PROVIDER_URL;
  const privateKey = process.env.PRIVATE_KEY;
  if (!providerUrl || !privateKey) throw new Error('PROVIDER_URL and PRIVATE_KEY must be set in environment to submit on-chain');

  const provider = new ethers.JsonRpcProvider(providerUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  if (!ethers.isAddress(gateAddress)) {
    throw new Error(`Invalid gate address: ${gateAddress}`);
  }

  const nonce = nonceArg ? Number(nonceArg) : Date.now();
  if (!Number.isSafeInteger(nonce) || nonce <= 0) {
    throw new Error(`Invalid nonce: ${String(nonceArg)}`);
  }

  const currentBlock = await provider.getBlockNumber();
  const expiryBlock = expiryArg ? Number(expiryArg) : currentBlock + 100;
  if (!Number.isSafeInteger(expiryBlock) || expiryBlock <= currentBlock) {
    throw new Error(`Invalid expiryBlock: ${String(expiryArg)}`);
  }
  if (expiryBlock > currentBlock + 100) {
    throw new Error(`expiryBlock too far in future. max is currentBlock+100 (${currentBlock + 100})`);
  }

  const ruleId = ruleNameOrId.length === 66 && ruleNameOrId.startsWith('0x') ? ruleNameOrId : makeRuleId(ruleNameOrId);

  const res = await submitProofOnChain(signer, gateAddress, ruleId, proof, publicSignals, nonce, expiryBlock);

  console.log('Submitted tx:', res.txHash);
  const receipt = await res.wait();
  console.log('Transaction mined:', res.txHash, 'status=', receipt.status, 'block=', receipt.blockNumber);
}
