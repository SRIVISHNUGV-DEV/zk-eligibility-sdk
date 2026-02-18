import type { Provider } from "./types";
import * as alchemy from "./alchemy";
import { getInfuraProvider } from "./infura";

/**
 * Default provider (Alchemy)
 */
export const defaultProvider: Provider = {
  getFirstOutboundTxBlock: alchemy.getFirstOutboundTxBlock,
  getLastOutboundTxBlock: alchemy.getLastOutboundTxBlock,
  getTotalOutboundTxCount: alchemy.getTotalOutboundTxCount,
  getCurrentBlock: alchemy.getCurrentBlock,
  getFirstTokenTransferInBlock: alchemy.getFirstTokenTransferInBlock
};

/**
 * Optional Infura provider factory
 * User must explicitly call this
 */
export function createInfuraProvider(): Provider {
  const provider = getInfuraProvider();

  return {
    getCurrentBlock: async (_chainId?: number) => {
      return provider.getBlockNumber();
    },

    // ⚠️ Infura DOES NOT support alchemy_getAssetTransfers
    // These are intentionally unimplemented
    getFirstOutboundTxBlock: async (_address: string, _chainId?: number) => {
      throw new Error("INFURA_UNSUPPORTED_METHOD");
    },

    getLastOutboundTxBlock: async (_address: string, _chainId?: number) => {
      throw new Error("INFURA_UNSUPPORTED_METHOD");
    },

    getTotalOutboundTxCount: async (_address: string, _chainId?: number) => {
      throw new Error("INFURA_UNSUPPORTED_METHOD");
    },

    getFirstTokenTransferInBlock: async (_walletAddress: string, _tokenAddress: string, _chainId?: number) => {
      throw new Error("INFURA_UNSUPPORTED_METHOD");
    }
  };
}
