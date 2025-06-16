/**
 * Custom error classes for ElizaOS DEX Agent
 */

/**
 * Base error class for all DEX Agent errors
 */
export class DexAgentError extends Error {
    public readonly code: string;
    public readonly timestamp: Date;
    public readonly context?: Record<string, any>;

    constructor(message: string, code: string, context?: Record<string, any>) {
        super(message);
        this.name = 'DexAgentError';
        this.code = code;
        this.timestamp = new Date();
        this.context = context;
        
        // Maintains proper stack trace for where our error was thrown
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    toJSON(): Record<string, any> {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack
        };
    }
}

/**
 * Wallet-related errors
 */
export class WalletError extends DexAgentError {
    constructor(message: string, code: string = 'WALLET_ERROR', context?: Record<string, any>) {
        super(message, code, context);
        this.name = 'WalletError';
    }
}

export class WalletNotFoundError extends WalletError {
    constructor(platformUser?: string) {
        super(
            'No wallet found for this user',
            'WALLET_NOT_FOUND',
            { platformUser }
        );
        this.name = 'WalletNotFoundError';
    }
}

export class WalletCreationError extends WalletError {
    constructor(reason: string, context?: Record<string, any>) {
        super(
            `Failed to create wallet: ${reason}`,
            'WALLET_CREATION_FAILED',
            context
        );
        this.name = 'WalletCreationError';
    }
}

export class WalletLimitExceededError extends WalletError {
    constructor(currentCount: number, maxCount: number) {
        super(
            `Wallet limit exceeded. You have ${currentCount} wallets (max: ${maxCount})`,
            'WALLET_LIMIT_EXCEEDED',
            { currentCount, maxCount }
        );
        this.name = 'WalletLimitExceededError';
    }
}

/**
 * Trading-related errors
 */
export class TradingError extends DexAgentError {
    constructor(message: string, code: string = 'TRADING_ERROR', context?: Record<string, any>) {
        super(message, code, context);
        this.name = 'TradingError';
    }
}

export class InsufficientBalanceError extends TradingError {
    constructor(required: string, available: string, token: string) {
        super(
            `Insufficient ${token} balance. Required: ${required}, Available: ${available}`,
            'INSUFFICIENT_BALANCE',
            { required, available, token }
        );
        this.name = 'InsufficientBalanceError';
    }
}

export class SlippageExceededError extends TradingError {
    constructor(expectedSlippage: number, maxSlippage: number) {
        super(
            `Slippage too high. Expected: ${expectedSlippage}%, Max allowed: ${maxSlippage}%`,
            'SLIPPAGE_EXCEEDED',
            { expectedSlippage, maxSlippage }
        );
        this.name = 'SlippageExceededError';
    }
}

export class TransactionFailedError extends TradingError {
    constructor(reason: string, txHash?: string) {
        super(
            `Transaction failed: ${reason}`,
            'TRANSACTION_FAILED',
            { reason, txHash }
        );
        this.name = 'TransactionFailedError';
    }
}

/**
 * Network-related errors
 */
export class NetworkError extends DexAgentError {
    constructor(message: string, code: string = 'NETWORK_ERROR', context?: Record<string, any>) {
        super(message, code, context);
        this.name = 'NetworkError';
    }
}

export class RPCError extends NetworkError {
    constructor(endpoint: string, originalError?: Error) {
        super(
            `RPC connection failed: ${endpoint}`,
            'RPC_ERROR',
            { endpoint, originalError: originalError?.message }
        );
        this.name = 'RPCError';
    }
}

export class APIError extends NetworkError {
    constructor(api: string, statusCode?: number, originalError?: Error) {
        super(
            `API request failed: ${api}`,
            'API_ERROR',
            { api, statusCode, originalError: originalError?.message }
        );
        this.name = 'APIError';
    }
}

/**
 * Database-related errors
 */
export class DatabaseError extends DexAgentError {
    constructor(message: string, operation?: string, originalError?: Error) {
        super(
            message,
            'DATABASE_ERROR',
            { operation, originalError: originalError?.message }
        );
        this.name = 'DatabaseError';
    }
}

/**
 * Validation errors
 */
export class ValidationError extends DexAgentError {
    constructor(field: string, value: any, expectedType?: string) {
        super(
            `Validation failed for field '${field}'`,
            'VALIDATION_ERROR',
            { field, value, expectedType }
        );
        this.name = 'ValidationError';
    }
}

export class InvalidAddressError extends ValidationError {
    constructor(address: string) {
        super('address', address, 'valid Ethereum address');
        this.message = `Invalid Ethereum address: ${address}`;
        this.name = 'InvalidAddressError';
    }
}

export class InvalidAmountError extends ValidationError {
    constructor(amount: string) {
        super('amount', amount, 'positive number');
        this.message = `Invalid amount: ${amount}`;
        this.name = 'InvalidAmountError';
    }
}

/**
 * Session-related errors
 */
export class SessionError extends DexAgentError {
    constructor(message: string, code: string = 'SESSION_ERROR', context?: Record<string, any>) {
        super(message, code, context);
        this.name = 'SessionError';
    }
}

export class TransactionExpiredError extends SessionError {
    constructor(transactionId: string, expiryTime: Date) {
        super(
            `Transaction ${transactionId} has expired`,
            'TRANSACTION_EXPIRED',
            { transactionId, expiryTime }
        );
        this.name = 'TransactionExpiredError';
    }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends DexAgentError {
    constructor(message: string, missingVars?: string[]) {
        super(
            message,
            'CONFIGURATION_ERROR',
            { missingVars }
        );
        this.name = 'ConfigurationError';
    }
}

/**
 * Error utility functions
 */
export function isRetryableError(error: Error): boolean {
    if (error instanceof NetworkError) return true;
    if (error instanceof DatabaseError) return true;
    if (error.message.includes('ETIMEDOUT')) return true;
    if (error.message.includes('ECONNREFUSED')) return true;
    return false;
}

export function getUserFriendlyMessage(error: Error): string {
    if (error instanceof WalletNotFoundError) {
        return "You don't have a wallet yet. Use 'create wallet' to get started.";
    }
    if (error instanceof WalletLimitExceededError) {
        return "You've reached the maximum number of wallets. Please delete one before creating another.";
    }
    if (error instanceof InsufficientBalanceError) {
        return `Not enough ${error.context?.token} in your wallet. Check your balance and try again.`;
    }
    if (error instanceof SlippageExceededError) {
        return "The price has moved too much. Try again with higher slippage tolerance.";
    }
    if (error instanceof TransactionFailedError) {
        return "Transaction failed. This could be due to network congestion or insufficient gas.";
    }
    if (error instanceof NetworkError) {
        return "Network connection issue. Please try again in a moment.";
    }
    if (error instanceof ValidationError) {
        return `Invalid input: ${error.message}`;
    }
    if (error instanceof TransactionExpiredError) {
        return "This transaction has expired. Please create a new one.";
    }
    
    // Generic fallback
    return "An unexpected error occurred. Please try again or contact support if the issue persists.";
}