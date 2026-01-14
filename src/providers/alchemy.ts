import 'dotenv/config'
import axios from 'axios'
import { ethers } from 'ethers'

const ALCHEMY_KEY = process.env.ALCHEMY_API_KEY
const url = `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`

// ---------- PROVIDER ----------
const provider = new ethers.JsonRpcProvider(
  `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`
)

export async function getFirstOutboundTxBlock(address: string): Promise<number|null> {

  if (!address || typeof address !== "string") {
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

  const response = await axios.post(url, payload)

  const transfers = response.data.result.transfers

  if (transfers.length === 0) {
    return null;
  }

  return parseInt(transfers[0].blockNum, 16)

}

export async function getCurrentBlock():Promise<number> {
  const blockNumber = await provider.getBlockNumber()
  return blockNumber
}


export async function getLastOutboundTxBlock(address: string): Promise<number|null> {

    if (!address || typeof address !== "string") {
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
    
    const response = await axios.post(url, payload);
    
    const transfers = response.data.result.transfers;
    
    if (transfers.length === 0) {
        return null;
    }
    
    return parseInt(transfers[0].blockNum, 16);
}


export async function getTotalOutboundTxCount(address: string): Promise<number|null> {

    if (!address || typeof address !== "string") {
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

    const response = await axios.post(url, payload);
    const transfers = response.data.result.transfers;
    return Math.min(transfers.length, 1000);
};

export async function getFirstTokenTransferInBlock(
  walletAddress: string,
  tokenAddress: string
): Promise<number | null> {

    if (!walletAddress|| typeof walletAddress !== "string") {
  return null;
}
    if(!tokenAddress || typeof tokenAddress !== "string") {
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
    const response = await axios.post(url, payload);
    const transfers = response.data?.result?.transfers;

    if (!transfers || transfers.length === 0) {
      return null; // token never received
    }

    const blockHex = transfers[0].blockNum;
    return parseInt(blockHex, 16);

  } catch (err) {
    throw new Error("ALCHEMY_TOKEN_TRANSFER_QUERY_FAILED");
  }
}




    
