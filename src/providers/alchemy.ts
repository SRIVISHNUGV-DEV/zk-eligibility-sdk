import axios from "axios";
import { ethers } from "ethers";

const SUPPORTED_CHAINS: Record<number, string> = {
  1: "eth-mainnet",
  137: "polygon-mainnet",
  42161: "arb-mainnet",
};

const providerCache = new Map<number, ethers.JsonRpcProvider>();
let alchemyKeyCache: string | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class RateLimiter {
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private tokens: number;
  private lastRefillTs: number;

  constructor(tokensPerSecond: number) {
    this.capacity = tokensPerSecond;
    this.refillPerSecond = tokensPerSecond;
    this.tokens = tokensPerSecond;
    this.lastRefillTs = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = Math.max(0, (now - this.lastRefillTs) / 1000);
    this.lastRefillTs = now;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillPerSecond);
  }

  async removeTokens(n: number = 1, maxWaitMs: number = 3000): Promise<void> {
    const deadline = Date.now() + maxWaitMs;

    while (true) {
      this.refill();
      if (this.tokens >= n) {
        this.tokens -= n;
        return;
      }
      if (Date.now() >= deadline) {
        throw new Error("RATE_LIMIT_TIMEOUT");
      }
      await sleep(40);
    }
  }
}

const alchemyLimiter = new RateLimiter(10);

function isValidEthereumAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

function getAlchemyKey(): string {
  if (alchemyKeyCache) return alchemyKeyCache;

  let key = process.env.ALCHEMY_API_KEY;
  try {
    if (!key || key.includes("your_alchemy_api_key") || key.length < 8) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const dotenv = require("dotenv");
      dotenv.config();
      key = process.env.ALCHEMY_API_KEY || key;
    }
  } catch {
    // ignore
  }

  if (!key) {
    throw new Error("ALCHEMY_API_KEY not set in environment variables");
  }

  alchemyKeyCache = key;
  return key;
}

function resolveRpcOverride(chainId: number): string | null {
  const chainSpecific = process.env[`RPC_URL_${chainId}`]?.trim();
  const generic = process.env.RPC_URL?.trim();
  const raw = chainSpecific || generic || "";
  if (!raw) return null;

  const normalized = raw.replace(/alchemyapi\.io/g, "g.alchemy.com");
  if (normalized.endsWith("/v2/") || normalized.endsWith("/v2")) {
    const key = getAlchemyKey();
    return normalized.replace(/\/*$/, "") + "/" + key;
  }
  return normalized;
}

function getAlchemyUrl(chainId: number = 1): string {
  if (!Number.isInteger(chainId) || chainId <= 0) {
    throw new Error(`Invalid chain ID: ${String(chainId)}`);
  }

  const override = resolveRpcOverride(chainId);
  if (override) return override;

  const network = SUPPORTED_CHAINS[chainId];
  if (!network) {
    throw new Error(`Unsupported chain ID: ${chainId}`);
  }
  return `https://${network}.g.alchemy.com/v2/${getAlchemyKey()}`;
}

function getProvider(chainId: number = 1): ethers.JsonRpcProvider {
  const cached = providerCache.get(chainId);
  if (cached) return cached;

  const provider = new ethers.JsonRpcProvider(getAlchemyUrl(chainId));
  providerCache.set(chainId, provider);
  return provider;
}

function shouldRetry(err: any): boolean {
  const status = err?.response?.status;
  if (status === 429 || status === 503 || status === 504) return true;

  const code = String(err?.code || "");
  if (code.includes("ECONNRESET") || code.includes("ETIMEDOUT")) return true;

  const message = String(err?.message || "").toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("rate limit") ||
    message.includes("too many requests")
  );
}

async function requestWithRetry(
  chainId: number,
  payload: Record<string, unknown>,
  retries: number = 2
): Promise<any> {
  let attempt = 0;

  while (true) {
    try {
      await alchemyLimiter.removeTokens(1);
      const response = await axios.post(getAlchemyUrl(chainId), payload, {
        timeout: 10000,
        headers: { "Content-Type": "application/json" },
      });

      if (response.data?.error) {
        const rpcMessage = String(response.data.error?.message || "").toLowerCase();
        if (
          attempt < retries &&
          (rpcMessage.includes("rate") || rpcMessage.includes("limit") || rpcMessage.includes("timeout"))
        ) {
          attempt++;
          await sleep(120 * Math.pow(2, attempt));
          continue;
        }
      }

      return response.data;
    } catch (err) {
      if (attempt < retries && shouldRetry(err)) {
        attempt++;
        await sleep(120 * Math.pow(2, attempt));
        continue;
      }
      throw err;
    }
  }
}

function parseTransferBlockHex(data: any): number | null {
  const transfers = data?.result?.transfers;
  if (!Array.isArray(transfers) || transfers.length === 0) return null;

  const blockHex = transfers[0]?.blockNum;
  if (!blockHex || typeof blockHex !== "string" || !blockHex.startsWith("0x")) return null;

  const parsed = parseInt(blockHex, 16);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

export async function getFirstOutboundTxBlock(
  address: string,
  chainId: number = 1
): Promise<number | null> {
  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromAddress: address,
        category: ["external", "internal"],
        order: "asc",
        maxCount: "0x1",
      },
    ],
  };

  try {
    const data = await requestWithRetry(chainId, payload);
    return parseTransferBlockHex(data);
  } catch (err) {
    console.error("Alchemy API error:", err);
    return null;
  }
}

export async function getCurrentBlock(chainId: number = 1): Promise<number> {
  return getProvider(chainId).getBlockNumber();
}

export async function getLastOutboundTxBlock(
  address: string,
  chainId: number = 1
): Promise<number | null> {
  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromAddress: address,
        category: ["external", "internal"],
        order: "desc",
        maxCount: "0x1",
      },
    ],
  };

  try {
    const data = await requestWithRetry(chainId, payload);
    return parseTransferBlockHex(data);
  } catch (err) {
    console.error("Alchemy API error:", err);
    return null;
  }
}

export async function getTotalOutboundTxCount(
  address: string,
  chainId: number = 1
): Promise<number | null> {
  if (!address || typeof address !== "string" || !isValidEthereumAddress(address)) {
    return null;
  }

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [
      {
        fromAddress: address,
        category: ["external", "internal"],
        order: "asc",
        maxCount: "0x3e8",
      },
    ],
  };

  try {
    const data = await requestWithRetry(chainId, payload);
    const transfers = data?.result?.transfers;
    if (!Array.isArray(transfers)) return 0;
    return Math.min(transfers.length, 1000);
  } catch (err) {
    console.error("Alchemy API error:", err);
    return null;
  }
}

export async function getFirstTokenTransferInBlock(
  walletAddress: string,
  tokenAddress: string,
  chainId: number = 1
): Promise<number | null> {
  if (!walletAddress || typeof walletAddress !== "string" || !isValidEthereumAddress(walletAddress)) {
    return null;
  }
  if (!tokenAddress || typeof tokenAddress !== "string" || !isValidEthereumAddress(tokenAddress)) {
    return null;
  }

  const payload = {
    jsonrpc: "2.0",
    id: 1,
    method: "alchemy_getAssetTransfers",
    params: [
      {
        toAddress: walletAddress,
        contractAddresses: [tokenAddress],
        category: ["erc20", "erc721", "erc1155"],
        order: "asc",
        maxCount: "0x1",
      },
    ],
  };

  try {
    const data = await requestWithRetry(chainId, payload);
    return parseTransferBlockHex(data);
  } catch (err) {
    console.error("ALCHEMY_TOKEN_TRANSFER_QUERY_FAILED", err);
    return null;
  }
}
