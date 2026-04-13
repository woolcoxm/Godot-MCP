import { logger } from './logger.js';

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  initialDelay: 100,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  retryableErrors: [
    'timeout',
    'connection',
    'network',
    'ECONNREFUSED',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND'
  ]
};

export class RetryManager {
  static async execute<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const config = { ...defaultOptions, ...options };
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Check if this is the last attempt
        if (attempt === config.maxAttempts) {
          logger.error(`Operation failed after ${attempt} attempts:`, lastError);
          throw lastError;
        }
        
        // Check if error is retryable
        if (!this.isRetryableError(lastError, config.retryableErrors || [])) {
          logger.error(`Non-retryable error on attempt ${attempt}:`, lastError);
          throw lastError;
        }
        
        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt, config);
        
        // Call onRetry callback if provided
        if (config.onRetry) {
          config.onRetry(attempt, lastError, delay);
        }
        
        logger.warn(`Operation failed on attempt ${attempt}, retrying in ${delay}ms:`, lastError.message);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw lastError || new Error('Operation failed');
  }

  private static isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    for (const retryableError of retryableErrors) {
      if (errorMessage.includes(retryableError.toLowerCase()) || 
          errorName.includes(retryableError.toLowerCase())) {
        return true;
      }
    }
    
    // Default to retryable for network/connection errors
    return errorMessage.includes('timeout') || 
           errorMessage.includes('connection') || 
           errorMessage.includes('network');
  }

  private static calculateDelay(attempt: number, config: RetryOptions): number {
    // Exponential backoff: delay = initialDelay * (backoffFactor ^ (attempt - 1))
    let delay = config.initialDelay * Math.pow(config.backoffFactor, attempt - 1);
    
    // Apply jitter (±20%)
    if (config.jitter) {
      const jitter = 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2
      delay *= jitter;
    }
    
    // Cap at maxDelay
    return Math.min(delay, config.maxDelay);
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Specialized retry handlers for different operations
export class TransportRetry {
  static async executeTransportOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const transportOptions: RetryOptions = {
      ...defaultOptions,
      maxAttempts: 5, // More attempts for transport operations
      initialDelay: 500,
      maxDelay: 30000,
      retryableErrors: [
        'timeout',
        'connection',
        'network',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'process',
        'Godot',
        'WebSocket'
      ],
      onRetry: (attempt, _error, delay) => {
        logger.warn(`Transport operation "${operationName}" failed (attempt ${attempt}), retrying in ${delay}ms`);
      },
      ...options
    };
    
    return RetryManager.execute(operation, transportOptions);
  }
}

export class FileOperationRetry {
  static async executeFileOperation<T>(
    operation: () => Promise<T>,
    fileName: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const fileOptions: RetryOptions = {
      ...defaultOptions,
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 5000,
      retryableErrors: [
        'ENOENT', // File not found (might be timing issue)
        'EBUSY',  // File busy
        'EACCES', // Permission denied (might be temporary)
        'EAGAIN', // Resource temporarily unavailable
        'timeout'
      ],
      onRetry: (attempt, _error, delay) => {
        logger.warn(`File operation on "${fileName}" failed (attempt ${attempt}), retrying in ${delay}ms`);
      },
      ...options
    };
    
    return RetryManager.execute(operation, fileOptions);
  }
}

export class NetworkRetry {
  static async executeNetworkOperation<T>(
    operation: () => Promise<T>,
    url: string,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const networkOptions: RetryOptions = {
      ...defaultOptions,
      maxAttempts: 3,
      initialDelay: 1000,
      maxDelay: 10000,
      retryableErrors: [
        'timeout',
        'connection',
        'network',
        'ECONNREFUSED',
        'ECONNRESET',
        'ETIMEDOUT',
        'ENOTFOUND',
        '500',
        '502',
        '503',
        '504'
      ],
      onRetry: (attempt, _error, delay) => {
        logger.warn(`Network operation to "${url}" failed (attempt ${attempt}), retrying in ${delay}ms`);
      },
      ...options
    };
    
    return RetryManager.execute(operation, networkOptions);
  }
}

// Utility function for circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold: number;
  private readonly resetTimeout: number;
  private readonly halfOpenMaxAttempts: number;
  private halfOpenAttempts = 0;

  constructor(
    failureThreshold: number = 5,
    resetTimeout: number = 30000,
    halfOpenMaxAttempts: number = 3
  ) {
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
    this.halfOpenMaxAttempts = halfOpenMaxAttempts;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.checkState();
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private checkState(): void {
    const now = Date.now();
    
    switch (this.state) {
      case 'open':
        if (now - this.lastFailureTime > this.resetTimeout) {
          this.state = 'half-open';
          this.halfOpenAttempts = 0;
          logger.info('Circuit breaker transitioning to half-open state');
        } else {
          throw new Error('Circuit breaker is open - operation blocked');
        }
        break;
        
      case 'half-open':
        if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
          this.state = 'open';
          this.lastFailureTime = now;
          throw new Error('Circuit breaker re-opened after half-open failures');
        }
        this.halfOpenAttempts++;
        break;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.halfOpenAttempts = 0;
    
    if (this.state === 'half-open') {
      this.state = 'closed';
      logger.info('Circuit breaker closed after successful half-open operation');
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === 'closed' && this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.error(`Circuit breaker opened after ${this.failures} failures`);
    } else if (this.state === 'half-open') {
      // Half-open attempt failed, stay in half-open for next attempt
      logger.warn('Half-open operation failed');
    }
  }

  getState(): string {
    return this.state;
  }

  getFailures(): number {
    return this.failures;
  }

  reset(): void {
    this.failures = 0;
    this.state = 'closed';
    this.halfOpenAttempts = 0;
    logger.info('Circuit breaker manually reset');
  }
}