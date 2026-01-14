export class SDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SDKError";
  }
}

export class ProofGenerationError extends SDKError {
  constructor() {
    super("Failed to generate ZK proof");
  }
}

export class ProofVerificationError extends SDKError {
  constructor() {
    super("ZK proof verification failed");
  }
}
