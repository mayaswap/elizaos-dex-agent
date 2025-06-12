/**
 * Comprehensive Error Handling Service for ElizaOS DEX Agent
 * Provides structured error handling, logging, and recovery mechanisms
 */

import { elizaLogger } from '../utils/logger.js';

export enum ErrorType {
    VALIDATION = 'VALIDATION',
    NETWORK = 'NETWORK',
    DATABASE = 'DATABASE',
    BLOCKCHAIN = 'BLOCKCHAIN',
    API = 'API',
    AUTHENTICATION = 'AUTH',
    PERMISSION = 'PERMISSION',
    RATE_LIMIT = 'RATE_LIMIT',
    TIMEOUT = 'TIMEOUT',
    INTERNAL = 'INTERNAL',
    USER_INPUT = 'USER_INPUT'
}

export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
    userId?: string;
    action?: string;
    platform?: string;
    requestId?: string;
    additionalData?: Record<string, unknown>;
}

export interface StructuredError {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    code?: string;
    originalError?: Error;
    context?: ErrorContext;
    timestamp: Date;
    recoverable: boolean;
    userMessage: string;
    debugInfo?: Record<string, unknown>;
}

class ErrorHandlerService {
    private errorCounts: Map<string, number> = new Map();
    private errorThreshold = 5;
    private timeWindow = 300000; // 5 minutes

    /**
     * Handle and process errors with proper logging and user feedback
     */
    handleError(
        error: Error | unknown,
        type: ErrorType = ErrorType.INTERNAL,
        severity: ErrorSeverity = ErrorSeverity.MEDIUM,
        context?: ErrorContext,
        recoverable: boolean = true
    ): StructuredError {
        const structuredError: StructuredError = {
            type,
            severity,
            message: error instanceof Error ? error.message : String(error),
            originalError: error instanceof Error ? error : undefined,
            context,
            timestamp: new Date(),
            recoverable,
            userMessage: this.generateUserMessage(type, severity, error),
            debugInfo: this.extractDebugInfo(error, context)
        };

        // Log the error
        this.logError(structuredError);

        // Track error frequency
        this.trackErrorFrequency(structuredError);

        // Handle circuit breaker pattern for critical errors
        if (severity === ErrorSeverity.CRITICAL) {
            this.handleCriticalError(structuredError);
        }

        return structuredError;
    }

    /**
     * Generate user-friendly error messages
     */
    private generateUserMessage(type: ErrorType, severity: ErrorSeverity, error: Error | unknown): string {
        const errorMessage = error instanceof Error ? error.message : String(error);

        switch (type) {
            case ErrorType.NETWORK:
                return '🌐 **Network Issue**: Having trouble connecting to services. Please try again in a moment.';
            
            case ErrorType.DATABASE:
                return '💾 **Database Issue**: Temporary storage issue. Your data is safe, please retry.';
            
            case ErrorType.BLOCKCHAIN:
                return '⛓️ **Blockchain Issue**: Network congestion detected. Please wait and try again.';
            
            case ErrorType.API:
                return '🔌 **Service Issue**: External service temporarily unavailable. Retrying shortly.';
            
            case ErrorType.AUTHENTICATION:
                return '🔐 **Authentication Issue**: Please check your credentials and try again.';
            
            case ErrorType.VALIDATION:
                return '⚠️ **Input Error**: Please check your input and try again.';
            
            case ErrorType.RATE_LIMIT:
                return '⏰ **Rate Limited**: Too many requests. Please wait a moment before trying again.';
            
            case ErrorType.TIMEOUT:
                return '⏱️ **Timeout**: Request took too long. Please try again.';
            
            case ErrorType.USER_INPUT:
                return `📝 **Input Error**: ${errorMessage.length > 100 ? 'Invalid input format' : errorMessage}`;
            
            default:
                if (severity === ErrorSeverity.CRITICAL) {
                    return '🚨 **Critical Error**: Something went wrong. Our team has been notified.';
                }
                return '❌ **Error**: Something unexpected happened. Please try again.';
        }
    }

    /**
     * Extract debug information from errors
     */
    private extractDebugInfo(error: Error | unknown, context?: ErrorContext): Record<string, unknown> {
        const debugInfo: Record<string, unknown> = {
            timestamp: new Date().toISOString(),
            nodeVersion: process.version,
            platform: process.platform
        };

        if (error instanceof Error) {
            debugInfo.errorName = error.name;
            debugInfo.errorStack = error.stack;
        }

        if (context) {
            debugInfo.context = context;
        }

        return debugInfo;
    }

    /**
     * Log errors with appropriate levels
     */
    private logError(structuredError: StructuredError): void {
        const { type, severity, message, context, debugInfo } = structuredError;
        
        const logMessage = `[${type}] ${message}`;
        const logMeta = {
            severity,
            context,
            debugInfo
        };

        switch (severity) {
            case ErrorSeverity.CRITICAL:
                elizaLogger.error(logMessage, structuredError.originalError, logMeta);
                break;
            case ErrorSeverity.HIGH:
                elizaLogger.error(logMessage, structuredError.originalError, logMeta);
                break;
            case ErrorSeverity.MEDIUM:
                elizaLogger.warn(logMessage, logMeta);
                break;
            case ErrorSeverity.LOW:
                elizaLogger.info(logMessage, logMeta);
                break;
        }
    }

    /**
     * Track error frequency for circuit breaker pattern
     */
    private trackErrorFrequency(error: StructuredError): void {
        const key = `${error.type}:${error.context?.action || 'unknown'}`;
        const current = this.errorCounts.get(key) || 0;
        this.errorCounts.set(key, current + 1);

        // Reset counter after time window
        setTimeout(() => {
            const count = this.errorCounts.get(key) || 0;
            if (count > 0) {
                this.errorCounts.set(key, Math.max(0, count - 1));
            }
        }, this.timeWindow);

        // Alert if threshold exceeded
        if (current >= this.errorThreshold) {
            elizaLogger.error(`Error threshold exceeded for ${key}`, undefined, {
                errorType: error.type,
                count: current,
                threshold: this.errorThreshold
            });
        }
    }

    /**
     * Handle critical errors that may require system shutdown
     */
    private handleCriticalError(error: StructuredError): void {
        elizaLogger.error('CRITICAL ERROR DETECTED', error.originalError, {
            error: error,
            action: 'SYSTEM_ALERT'
        });
        
        // In a production system, this might trigger alerts, notifications, etc.
        // For now, we'll just log the critical error
    }

    /**
     * Validate user inputs to prevent common errors
     */
    validateInput(input: unknown, rules: ValidationRule[]): ValidationResult {
        const errors: string[] = [];

        for (const rule of rules) {
            const result = rule.validate(input);
            if (!result.valid) {
                errors.push(result.message);
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            sanitizedInput: errors.length === 0 ? this.sanitizeInput(input) : undefined
        };
    }

    /**
     * Sanitize user input to prevent injection attacks
     */
    private sanitizeInput(input: unknown): unknown {
        if (typeof input === 'string') {
            // Basic sanitization - remove potential SQL injection patterns
            return input
                .replace(/['"\\]/g, '') // Remove quotes and backslashes
                .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b/gi, '') // Remove SQL keywords
                .trim();
        }
        return input;
    }

    /**
     * Retry mechanism for recoverable errors
     */
    async retryOperation<T>(
        operation: () => Promise<T>,
        maxRetries: number = 3,
        backoffMs: number = 1000,
        context?: ErrorContext
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                if (attempt === maxRetries) {
                    this.handleError(lastError, ErrorType.INTERNAL, ErrorSeverity.HIGH, {
                        ...context,
                        additionalData: { attempts: attempt, maxRetries }
                    });
                    throw lastError;
                }

                // Exponential backoff
                const delay = backoffMs * Math.pow(2, attempt - 1);
                elizaLogger.warn(`Retry attempt ${attempt}/${maxRetries} failed, retrying in ${delay}ms`, {
                    error: lastError.message,
                    context
                });
                
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }
}

// Validation interfaces
export interface ValidationRule {
    validate(input: unknown): { valid: boolean; message: string };
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    sanitizedInput?: unknown;
}

// Common validation rules
export const ValidationRules = {
    required: (): ValidationRule => ({
        validate: (input: unknown) => ({
            valid: input !== null && input !== undefined && input !== '',
            message: 'This field is required'
        })
    }),

    string: (minLength: number = 0, maxLength: number = 1000): ValidationRule => ({
        validate: (input: unknown) => {
            if (typeof input !== 'string') {
                return { valid: false, message: 'Must be a string' };
            }
            if (input.length < minLength) {
                return { valid: false, message: `Minimum length is ${minLength}` };
            }
            if (input.length > maxLength) {
                return { valid: false, message: `Maximum length is ${maxLength}` };
            }
            return { valid: true, message: '' };
        }
    }),

    number: (min?: number, max?: number): ValidationRule => ({
        validate: (input: unknown) => {
            const num = typeof input === 'string' ? parseFloat(input) : input;
            if (typeof num !== 'number' || isNaN(num)) {
                return { valid: false, message: 'Must be a valid number' };
            }
            if (min !== undefined && num < min) {
                return { valid: false, message: `Minimum value is ${min}` };
            }
            if (max !== undefined && num > max) {
                return { valid: false, message: `Maximum value is ${max}` };
            }
            return { valid: true, message: '' };
        }
    }),

    ethereumAddress: (): ValidationRule => ({
        validate: (input: unknown) => {
            if (typeof input !== 'string') {
                return { valid: false, message: 'Address must be a string' };
            }
            const addressRegex = /^0x[a-fA-F0-9]{40}$/;
            return {
                valid: addressRegex.test(input),
                message: 'Must be a valid Ethereum address'
            };
        }
    })
};

// Export singleton instance
export const errorHandler = new ErrorHandlerService();
export default errorHandler; 