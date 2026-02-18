/**
 * Interface for blockchain data providers
 */
export interface BlockchainProvider {
  getFirstOutboundTxBlock(
    address: string,
    chainId?: number
  ): Promise<number | null>;

  getLastOutboundTxBlock(
    address: string,
    chainId?: number
  ): Promise<number | null>;

  getTotalOutboundTxCount(
    address: string,
    chainId?: number
  ): Promise<number | null>;

  getCurrentBlock(chainId?: number): Promise<number>;

  getFirstTokenTransferInBlock(
    walletAddress: string,
    tokenAddress: string,
    chainId?: number
  ): Promise<number | null>;
}
