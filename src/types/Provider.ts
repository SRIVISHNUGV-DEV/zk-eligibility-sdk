/**
 * Interface for blockchain data providers
 */
export interface BlockchainProvider {
  getFirstOutboundTxBlock(
    address: string
  ): Promise<number | null>;

  getLastOutboundTxBlock(
    address: string
  ): Promise<number | null>;

  getTotalOutboundTxCount(
    address: string
  ): Promise<number | null>;

  getCurrentBlock(): Promise<number>;

  getFirstTokenTransferInBlock(
    walletAddress: string,
    tokenAddress: string
  ): Promise<number | null>;
}
