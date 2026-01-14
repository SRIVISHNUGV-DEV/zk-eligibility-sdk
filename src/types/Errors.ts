/**
 * Base error for the SDK
 */
export class BaseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BaseError";
  }
}

/**
 * Thrown when provider fails
 */
export class ProviderError extends BaseError {
  constructor(message = "Blockchain provider error") {
    super(message);
    this.name = "ProviderError";
  }
}

/**
 * Thrown when rule execution fails
 */
export class RuleExecutionError extends BaseError {
  constructor(message = "Rule execution failed") {
    super(message);
    this.name = "RuleExecutionError";
  }
}

export class RuleNotFoundError extends BaseError {
  constructor(ruleId: string) {
    super(`Rule not found: ${ruleId}`);
    this.name = "RuleNotFoundError";
  }
}
