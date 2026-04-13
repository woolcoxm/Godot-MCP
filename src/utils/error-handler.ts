import { logger } from './logger.js';

export interface GodotMCPError extends Error {
  code: string;
  details?: any;
  recovery?: string;
  isOperational?: boolean;
}

export class ErrorHandler {
  // Error codes
  static readonly ERROR_CODES = {
    // File system errors
    FILE_NOT_FOUND: 'FILE_NOT_FOUND',
    FILE_READ_ERROR: 'FILE_READ_ERROR',
    FILE_WRITE_ERROR: 'FILE_WRITE_ERROR',
    FILE_PERMISSION_ERROR: 'FILE_PERMISSION_ERROR',
    
    // Scene errors
    SCENE_PARSE_ERROR: 'SCENE_PARSE_ERROR',
    SCENE_SERIALIZE_ERROR: 'SCENE_SERIALIZE_ERROR',
    NODE_NOT_FOUND: 'NODE_NOT_FOUND',
    NODE_ALREADY_EXISTS: 'NODE_ALREADY_EXISTS',
    INVALID_NODE_PATH: 'INVALID_NODE_PATH',
    INVALID_PARENT_NODE: 'INVALID_PARENT_NODE',
    
    // Resource errors
    RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
    RESOURCE_PARSE_ERROR: 'RESOURCE_PARSE_ERROR',
    INVALID_RESOURCE_TYPE: 'INVALID_RESOURCE_TYPE',
    
    // Script errors
    SCRIPT_PARSE_ERROR: 'SCRIPT_PARSE_ERROR',
    SCRIPT_SYNTAX_ERROR: 'SCRIPT_SYNTAX_ERROR',
    SCRIPT_NOT_FOUND: 'SCRIPT_NOT_FOUND',
    
    // Project errors
    PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
    PROJECT_SETTING_NOT_FOUND: 'PROJECT_SETTING_NOT_FOUND',
    INVALID_PROJECT_CONFIG: 'INVALID_PROJECT_CONFIG',
    
    // Transport errors
    TRANSPORT_ERROR: 'TRANSPORT_ERROR',
    TRANSPORT_TIMEOUT: 'TRANSPORT_TIMEOUT',
    GODOT_NOT_FOUND: 'GODOT_NOT_FOUND',
    GODOT_PROCESS_ERROR: 'GODOT_PROCESS_ERROR',
    
    // Validation errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Operation errors
    OPERATION_FAILED: 'OPERATION_FAILED',
    OPERATION_NOT_SUPPORTED: 'OPERATION_NOT_SUPPORTED',
    OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
    
    // System errors
    OUT_OF_MEMORY: 'OUT_OF_MEMORY',
    DISK_FULL: 'DISK_FULL',
    NETWORK_ERROR: 'NETWORK_ERROR',
    
    // Unknown errors
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  };

  // Create error with code and details
  static createError(
    code: string,
    message: string,
    details?: any,
    recovery?: string
  ): GodotMCPError {
    const error = new Error(message) as GodotMCPError;
    error.code = code;
    error.details = details;
    error.recovery = recovery;
    error.isOperational = this.isOperationalError(code);
    
    // Capture stack trace
    Error.captureStackTrace(error, this.createError);
    
    return error;
  }

  // Check if error is operational (expected/recoverable)
  static isOperationalError(code: string): boolean {
    const operationalCodes = [
      this.ERROR_CODES.FILE_NOT_FOUND,
      this.ERROR_CODES.NODE_NOT_FOUND,
      this.ERROR_CODES.RESOURCE_NOT_FOUND,
      this.ERROR_CODES.SCRIPT_NOT_FOUND,
      this.ERROR_CODES.PROJECT_NOT_FOUND,
      this.ERROR_CODES.PROJECT_SETTING_NOT_FOUND,
      this.ERROR_CODES.NODE_ALREADY_EXISTS,
      this.ERROR_CODES.INVALID_INPUT,
      this.ERROR_CODES.MISSING_REQUIRED_FIELD,
      this.ERROR_CODES.VALIDATION_ERROR,
    ];
    
    return operationalCodes.includes(code);
  }

  // Handle and log error
  static handleError(error: Error | GodotMCPError, context?: string): void {
    const godotError = this.normalizeError(error);
    
    // Log error with context
    const logMessage = context 
      ? `[${context}] ${godotError.message}`
      : godotError.message;
    
    if (godotError.isOperational) {
      logger.warn(logMessage, godotError.details);
    } else {
      logger.error(logMessage, {
        code: godotError.code,
        details: godotError.details,
        stack: godotError.stack,
      });
    }
    
    // Log recovery suggestion if available
    if (godotError.recovery) {
      logger.info(`Recovery suggestion: ${godotError.recovery}`);
    }
  }

  // Normalize any error to GodotMCPError
  static normalizeError(error: Error | GodotMCPError): GodotMCPError {
    if (this.isGodotMCPError(error)) {
      return error;
    }
    
    // Convert generic error to GodotMCPError
    const godotError = this.createError(
      this.ERROR_CODES.UNKNOWN_ERROR,
      error.message,
      { originalError: error },
      'Check logs for details and try again.'
    );
    
    // Preserve stack trace
    godotError.stack = error.stack;
    
    return godotError;
  }

  // Type guard for GodotMCPError
  static isGodotMCPError(error: any): error is GodotMCPError {
    return error && typeof error === 'object' && 'code' in error;
  }

  // Create error from transport result
  static fromTransportResult(
    result: any,
    operation: string,
    defaultMessage: string = 'Transport operation failed'
  ): GodotMCPError {
    if (result.error) {
      // Check for common transport errors
      if (result.error.includes('timeout') || result.error.includes('Timeout')) {
        return this.createError(
          this.ERROR_CODES.TRANSPORT_TIMEOUT,
          `Transport timeout during ${operation}`,
          { operation, error: result.error },
          'Check if Godot is running and accessible. Increase timeout if needed.'
        );
      }
      
      if (result.error.includes('not found') || result.error.includes('ENOENT')) {
        return this.createError(
          this.ERROR_CODES.GODOT_NOT_FOUND,
          `Godot executable not found or inaccessible`,
          { operation, error: result.error },
          'Set GODOT_PATH environment variable to point to Godot executable.'
        );
      }
      
      if (result.error.includes('permission') || result.error.includes('EACCES')) {
        return this.createError(
          this.ERROR_CODES.FILE_PERMISSION_ERROR,
          `Permission denied during ${operation}`,
          { operation, error: result.error },
          'Check file permissions and ensure you have write access.'
        );
      }
      
      return this.createError(
        this.ERROR_CODES.TRANSPORT_ERROR,
        `${defaultMessage}: ${result.error}`,
        { operation, error: result.error },
        'Check transport configuration and Godot process status.'
      );
    }
    
    return this.createError(
      this.ERROR_CODES.OPERATION_FAILED,
      defaultMessage,
      { operation },
      'Check operation parameters and try again.'
    );
  }

  // Create error for file operations
  static fileError(
    operation: 'read' | 'write' | 'delete',
    path: string,
    error: any
  ): GodotMCPError {
    const operationMap = {
      read: 'read from',
      write: 'write to',
      delete: 'delete',
    };
    
    void operationMap;
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('ENOENT') || errorMessage.includes('not found')) {
      return this.createError(
        this.ERROR_CODES.FILE_NOT_FOUND,
        `File not found: ${path}`,
        { operation, path, error: errorMessage },
        `Ensure the file exists at ${path} or create it first.`
      );
    }
    
    if (errorMessage.includes('EACCES') || errorMessage.includes('permission')) {
      return this.createError(
        this.ERROR_CODES.FILE_PERMISSION_ERROR,
        `Permission denied: cannot ${operation} ${path}`,
        { operation, path, error: errorMessage },
        'Check file permissions and ensure you have appropriate access.'
      );
    }
    
    if (errorMessage.includes('disk') || errorMessage.includes('space')) {
      return this.createError(
        this.ERROR_CODES.DISK_FULL,
        `Disk full: cannot ${operation} ${path}`,
        { operation, path, error: errorMessage },
        'Free up disk space and try again.'
      );
    }
    
    return this.createError(
      operation === 'read' ? this.ERROR_CODES.FILE_READ_ERROR :
      operation === 'write' ? this.ERROR_CODES.FILE_WRITE_ERROR :
      this.ERROR_CODES.OPERATION_FAILED,
      `Failed to ${operation} file: ${path}`,
      { operation, path, error: errorMessage },
      'Check file path and ensure it\'s accessible.'
    );
  }

  // Create error for scene operations
  static sceneError(
    operation: string,
    scenePath: string,
    error: any,
    nodePath?: string
  ): GodotMCPError {
    const errorMessage = error.message || String(error);
    
    if (errorMessage.includes('node not found') || errorMessage.includes('Node not found')) {
      return this.createError(
        this.ERROR_CODES.NODE_NOT_FOUND,
        `Node not found: ${nodePath || 'unknown'}`,
        { operation, scenePath, nodePath, error: errorMessage },
        `Check if node exists at path: ${nodePath}`
      );
    }
    
    if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
      return this.createError(
        this.ERROR_CODES.NODE_ALREADY_EXISTS,
        `Node already exists: ${nodePath || 'unknown'}`,
        { operation, scenePath, nodePath, error: errorMessage },
        'Use a different node name or delete the existing node first.'
      );
    }
    
    if (errorMessage.includes('invalid path') || errorMessage.includes('Invalid path')) {
      return this.createError(
        this.ERROR_CODES.INVALID_NODE_PATH,
        `Invalid node path: ${nodePath || 'unknown'}`,
        { operation, scenePath, nodePath, error: errorMessage },
        'Node paths should use forward slashes (/) and not contain special characters.'
      );
    }
    
    if (errorMessage.includes('parse') || errorMessage.includes('Parse')) {
      return this.createError(
        this.ERROR_CODES.SCENE_PARSE_ERROR,
        `Failed to parse scene: ${scenePath}`,
        { operation, scenePath, error: errorMessage },
        'Check if the scene file is a valid Godot scene (.tscn) file.'
      );
    }
    
    return this.createError(
      this.ERROR_CODES.OPERATION_FAILED,
      `Scene operation failed: ${operation} on ${scenePath}`,
      { operation, scenePath, nodePath, error: errorMessage },
      'Check scene file and operation parameters.'
    );
  }

  // Create error for validation failures
  static validationError(
    field: string,
    value: any,
    expected: string,
    details?: any
  ): GodotMCPError {
    return this.createError(
      this.ERROR_CODES.VALIDATION_ERROR,
      `Validation failed for field "${field}": got ${JSON.stringify(value)}, expected ${expected}`,
      { field, value, expected, details },
      `Provide a valid value for ${field} that matches: ${expected}`
    );
  }

  // Create error for missing required fields
  static missingFieldError(field: string, context?: string): GodotMCPError {
    const message = context 
      ? `Missing required field "${field}" in ${context}`
      : `Missing required field: ${field}`;
    
    return this.createError(
      this.ERROR_CODES.MISSING_REQUIRED_FIELD,
      message,
      { field, context },
      `Provide a value for the required field: ${field}`
    );
  }

  // Wrap async operation with error handling
  static async wrapAsync<T>(
    operation: () => Promise<T>,
    context: string,
    recovery?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      const normalizedError = this.normalizeError(error);
      
      // Add context and recovery if provided
      if (context && !normalizedError.message.includes(context)) {
        normalizedError.message = `[${context}] ${normalizedError.message}`;
      }
      
      if (recovery && !normalizedError.recovery) {
        normalizedError.recovery = recovery;
      }
      
      this.handleError(normalizedError, context);
      throw normalizedError;
    }
  }

  // Get user-friendly error message
  static getUserMessage(error: GodotMCPError): string {
    const messages: Record<string, string> = {
      [this.ERROR_CODES.FILE_NOT_FOUND]: 'File not found',
      [this.ERROR_CODES.FILE_READ_ERROR]: 'Cannot read file',
      [this.ERROR_CODES.FILE_WRITE_ERROR]: 'Cannot write file',
      [this.ERROR_CODES.NODE_NOT_FOUND]: 'Node not found in scene',
      [this.ERROR_CODES.NODE_ALREADY_EXISTS]: 'Node already exists',
      [this.ERROR_CODES.SCENE_PARSE_ERROR]: 'Invalid scene file',
      [this.ERROR_CODES.RESOURCE_NOT_FOUND]: 'Resource not found',
      [this.ERROR_CODES.SCRIPT_NOT_FOUND]: 'Script not found',
      [this.ERROR_CODES.PROJECT_NOT_FOUND]: 'Project not found',
      [this.ERROR_CODES.GODOT_NOT_FOUND]: 'Godot not found',
      [this.ERROR_CODES.TRANSPORT_TIMEOUT]: 'Operation timed out',
      [this.ERROR_CODES.VALIDATION_ERROR]: 'Invalid input',
      [this.ERROR_CODES.MISSING_REQUIRED_FIELD]: 'Missing required information',
      [this.ERROR_CODES.OPERATION_NOT_SUPPORTED]: 'Operation not supported',
      [this.ERROR_CODES.DISK_FULL]: 'Disk full',
    };
    
    return messages[error.code] || 'An error occurred';
  }

  // Check if error should be retried
  static shouldRetry(error: GodotMCPError, attempt: number, maxAttempts: number = 3): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }
    
    const retryableCodes = [
      this.ERROR_CODES.TRANSPORT_TIMEOUT,
      this.ERROR_CODES.NETWORK_ERROR,
      this.ERROR_CODES.GODOT_PROCESS_ERROR,
      this.ERROR_CODES.OPERATION_TIMEOUT,
    ];
    
    return retryableCodes.includes(error.code);
  }

  // Get retry delay in milliseconds
  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds
  }
}