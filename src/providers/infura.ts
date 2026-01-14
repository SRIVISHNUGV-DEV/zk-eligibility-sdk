import 'dotenv/config';
import { ethers } from 'ethers';

export function getInfuraProvider() {
  const apiKey = process.env.INFURA_API_KEY;

  if (!apiKey) {
    throw new Error("INFURA_API_KEY not set");
  }

  return new ethers.JsonRpcProvider(
    `https://mainnet.infura.io/v3/${apiKey}`
  );
}
