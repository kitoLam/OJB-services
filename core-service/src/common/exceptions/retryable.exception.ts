export class RetryableException extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'RetryableException';
  }
}

export class NonRetryableException extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'NonRetryableException';
  }
}