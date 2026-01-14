/**
 * Raw ZK proof object
 * Opaque to SDK consumers
 */
export interface ZKProof {
  proof: any;
  publicSignals: any;
}

/**
 * Verified proof result
 */
export interface VerifiedProof {
  isValid: boolean;
}
