
import axios from 'axios'
import { ethers } from 'ethers'

// Lightweight in-process rate limiter to avoid bursting RPC calls
class RateLimiter {
  private capacity: number;
  private tokens: number;
  private intervalMs: number;

  constructor(tokensPerInterval: number, intervalMs: number) {
    this.capacity = tokensPerInterval;
    this.tokens = tokensPerInterval;
    this.intervalMs = intervalMs;
    const timer = setInterval(() => {
      this.tokens = this.capacity;
    }, this.intervalMs);
    if (typeof timer.unref === "function") {
      timer.unref();
    }
  }

  async removeTokens(n: number = 1): Promise<void> {
    while (this.tokens < n) {
      await new Promise((r) => setTimeout(r, Math.max(50, this.intervalMs / 10)));
    }
    this.tokens -= n;
  }
}

const alchemyLimiter = new RateLimiter(10, 1000);

function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

function getAlchemyKey(): string {
  let key = process.env.ALCHEMY_API_KEY;
  // If key looks missing or placeholder, try loading dotenv explicitly (tests may not load it)
  try {
    if (!key || key.includes('your_alchemy_api_key') || key.length < 8) {
      // load .env if present
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dotenv = require('dotenv');
      dotenv.config();
      key = process.env.ALCHEMY_API_KEY || key;
    }
  } catch {
    // ignore
  }

  if (!key) {
    throw new Error("ALCHEMY_API_KEY not set in environment variables");
  }

  return key;
}

const SUPPORTED_CHAINS: Record<number, string> = {
  1: "eth-mainnet",
  137: "polygon-mainnet",
  42161: "arb-mainnet",
};

function getAlchemyUrl(chainId: number = 1): string {
  // Allow full RPC URL override via RPC_URL env var
  const rpcUrl = process.env.RPC_URL?.trim();
  if (rpcUrl && rpcUrl.length > 0) {
    // Normalize legacy alchemyapi.io -> g.alchemy.com
    let normalized = rpcUrl.replace(/alchemyapi\.io/g, 'g.alchemy.com');

    // If RPC_URL looks like a base (ends with /v2/), append key if provided
    if (normalized.endsWith('/v2/') || normalized.endsWith('/v2')) {
      const key = getAlchemyKey();
      return normalized.replace(/\/*$/, '') + '/' + key;
    }

    // If the URL already contains a key or is a full RPC endpoint, return normalized
    return normalized;
  }

  const key = getAlchemyKey();
  const network = SUPPORTED_CHAINS[chainId];
  if (!network) throw new Error(`Unsupported chain ID: ${chainId}`);
  return `https://${network}.g.alchemy.com/v2/${key}`;
}

export async function getFirstOutboundTxBlock(address: string, chainId: number = 1): Promise<number|null> {

  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'alchemy_getAssetTransfers',
    params: [{
      fromAddress: address,
      category: ['external', 'internal'],
      order: 'asc',
      maxCount: '0x1' // ONLY FIRST TX
    }]
  }
  try {
    await alchemyLimiter.removeTokens(1);
    const response = await axios.post(getAlchemyUrl(chainId), payload, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.data?.error) {
      console.error('RPC error:', response.data.error);
      return null;
    }

    const transfers = response.data?.result?.transfers;
    if (!Array.isArray(transfers) || transfers.length === 0) {
      return null;
    }

    const blockHex = transfers[0].blockNum;
    if (!blockHex || typeof blockHex !== 'string' || !blockHex.startsWith('0x')) {
      console.error('Invalid blockNum format:', blockHex);
      return null;
    }

    const parsed = parseInt(blockHex, 16);
    if (isNaN(parsed) || parsed < 0) {
      console.error('Invalid parsed block number:', parsed);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Alchemy API error:', err);
    return null;
  }

}

export async function getCurrentBlock(chainId: number = 1):Promise<number> {
  const provider = new ethers.JsonRpcProvider(getAlchemyUrl(chainId));
  const blockNumber = await provider.getBlockNumber();
  return blockNumber;
}


export async function getLastOutboundTxBlock(address: string, chainId: number = 1): Promise<number|null> {
  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload ={
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
            fromAddress: address,
            category: ['external', 'internal'],
            order: 'desc',
            maxCount: '0x1' // ONLY FIRST TX
        }]
    };
  try {
    await alchemyLimiter.removeTokens(1);
    const response = await axios.post(getAlchemyUrl(chainId), payload, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });
    if (response.data?.error) {
      console.error('RPC error:', response.data.error);
      return null;
    }

    const transfers = response.data?.result?.transfers;
    if (!Array.isArray(transfers) || transfers.length === 0) {
      return null;
    }

    const blockHex = transfers[0].blockNum;
    if (!blockHex || typeof blockHex !== 'string' || !blockHex.startsWith('0x')) {
      console.error('Invalid blockNum format:', blockHex);
      return null;
    }

    const parsed = parseInt(blockHex, 16);
    if (isNaN(parsed) || parsed < 0) {
      console.error('Invalid parsed block number:', parsed);
      return null;
    }

    return parsed;
  } catch (err) {
    console.error('Alchemy API error:', err);
    return null;
  }
}


export async function getTotalOutboundTxCount(address: string, chainId: number = 1): Promise<number|null> {
  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload ={
        jsonrpc: '2.0',
        id: 1,
        method: 'alchemy_getAssetTransfers',
        params: [{
            fromAddress: address,
            category: ['external', 'internal'],
            order: 'asc',
            maxCount: '0x3e8' // 1000 transactions
        }]
    };
  try {
    await alchemyLimiter.removeTokens(1);
    const response = await axios.post(getAlchemyUrl(chainId), payload, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });

    if (response.data?.error) {
      console.error('RPC error:', response.data.error);
      return null;
    }

    const transfers = response.data?.result?.transfers;
    if (!Array.isArray(transfers)) return 0;
    return Math.min(transfers.length, 1000);
  } catch (err) {
    console.error('Alchemy API error:', err);
    return null;
  }
};

export async function getFirstTokenTransferInBlock(
  walletAddress: string,
  tokenAddress: string,
  chainId: number = 1
): Promise<number | null> {
  if (!walletAddress || typeof walletAddress !== 'string' || !isValidEthereumAddress(walletAddress)) {
    return null;
  }
  if (!tokenAddress || typeof tokenAddress !== 'string') {
    return null;
  }
  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [{
      toAddress: walletAddress,
      contractAddresses: [tokenAddress],
      category: ["erc20", "erc721", "erc1155"],
      order: "asc",            // earliest first
      maxCount: "0x1"          // we only need the FIRST transfer
    }]
  };

  try {
    await alchemyLimiter.removeTokens(1);
    const response = await axios.post(getAlchemyUrl(chainId), payload, { timeout: 10000, headers: { 'Content-Type': 'application/json' } });
    if (response.data?.error) {
      console.error('RPC error:', response.data.error);
      return null;
    }

    const transfers = response.data?.result?.transfers;
    if (!Array.isArray(transfers) || transfers.length === 0) {
      return null; // token never received
    }

    const blockHex = transfers[0].blockNum;
    if (!blockHex || typeof blockHex !== 'string' || !blockHex.startsWith('0x')) return null;
    const parsed = parseInt(blockHex, 16);
    if (isNaN(parsed) || parsed < 0) return null;
    return parsed;
  } catch (err) {
    console.error('ALCHEMY_TOKEN_TRANSFER_QUERY_FAILED', err);
    return null;
  }
}




    
