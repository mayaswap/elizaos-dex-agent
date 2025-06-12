/**
 * Security Utilities for ElizaOS DEX Agent
 * Handles private key sanitization, secure logging, and sensitive data protection
 */

import { logger } from './logger.js';

// Patterns to detect sensitive information
const SENSITIVE_PATTERNS = {
    PRIVATE_KEY: /0x[a-fA-F0-9]{64}/g,
    MNEMONIC_PHRASE: /\b[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\s+[a-z]+\b/gi,
    PARTIAL_MNEMONIC: /\b[a-z]+\s+[a-z]+\s+[a-z]+/gi,
    API_KEY: /sk-[a-zA-Z0-9]{48}/g,
    ETHEREUM_ADDRESS: /0x[a-fA-F0-9]{40}/g,
    // More conservative patterns for better security
    HEX_STRING_64: /0x[a-fA-F0-9]{64}/g,
    HEX_STRING_32: /0x[a-fA-F0-9]{32}/g,
    SEQUENTIAL_WORDS: /\b[a-z]+(\s+[a-z]+){2,}/gi
};

/**
 * Sanitize message content to remove sensitive information
 */
export function sanitizeMessage(message: string): string {
    if (!message || typeof message !== 'string') return message;
    
    let sanitized = message;
    
    // Replace private keys
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.PRIVATE_KEY, '[PRIVATE_KEY_REDACTED]');
    
    // Replace mnemonic phrases (12+ words)
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.MNEMONIC_PHRASE, '[MNEMONIC_PHRASE_REDACTED]');
    
    // Replace API keys
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.API_KEY, '[API_KEY_REDACTED]');
    
    // More aggressive patterns for partial matches
    sanitized = sanitized.replace(SENSITIVE_PATTERNS.HEX_STRING_64, '[SENSITIVE_HEX_REDACTED]');
    
    return sanitized;
}

/**
 * Sanitize error messages to prevent sensitive data leakage
 */
export function sanitizeError(error: Error | unknown): string {
    if (!error) return 'Unknown error';
    
    const errorMessage = error instanceof Error ? error.message : String(error);
    return sanitizeMessage(errorMessage);
}

/**
 * Secure logging wrapper that automatically sanitizes content
 */
export const secureLogger = {
    info: (message: string, meta?: Record<string, unknown>, source?: string) => {
        const sanitizedMessage = sanitizeMessage(message);
        const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
        logger.info(sanitizedMessage, sanitizedMeta, source);
    },
    
    warn: (message: string, meta?: Record<string, unknown>, source?: string) => {
        const sanitizedMessage = sanitizeMessage(message);
        const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
        logger.warn(sanitizedMessage, sanitizedMeta, source);
    },
    
    error: (message: string, error?: Error, meta?: Record<string, unknown>, source?: string) => {
        const sanitizedMessage = sanitizeMessage(message);
        const sanitizedError = error ? new Error(sanitizeError(error)) : undefined;
        const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
        logger.error(sanitizedMessage, sanitizedError, sanitizedMeta, source);
    },
    
    debug: (message: string, meta?: Record<string, unknown>, source?: string) => {
        const sanitizedMessage = sanitizeMessage(message);
        const sanitizedMeta = meta ? sanitizeObject(meta) : undefined;
        logger.debug(sanitizedMessage, sanitizedMeta, source);
    }
};

/**
 * Sanitize object properties recursively
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeMessage(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = Array.isArray(value) 
                ? value.map(v => typeof v === 'string' ? sanitizeMessage(v) : v)
                : sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

/**
 * Check if a string contains sensitive information
 */
export function containsSensitiveData(text: string): boolean {
    if (!text || typeof text !== 'string') return false;
    
    return Object.values(SENSITIVE_PATTERNS).some(pattern => pattern.test(text));
}

/**
 * Validate that a private key is properly formatted
 */
export function isValidPrivateKey(key: string): boolean {
    if (!key || typeof key !== 'string') return false;
    
    // Remove 0x prefix if present
    const cleanKey = key.startsWith('0x') ? key.slice(2) : key;
    
    // Check if it's exactly 64 hex characters
    return /^[a-fA-F0-9]{64}$/.test(cleanKey);
}

/**
 * Validate mnemonic phrase format (basic check)
 */
export function isValidMnemonic(phrase: string): boolean {
    if (!phrase || typeof phrase !== 'string') return false;
    
    const words = phrase.trim().split(/\s+/);
    
    // Check for standard mnemonic lengths (12, 15, 18, 21, 24 words)
    const validLengths = [12, 15, 18, 21, 24];
    
    return validLengths.includes(words.length) && 
           words.every(word => /^[a-z]+$/.test(word));
}

/**
 * Secure message deletion utility for Telegram
 */
export async function secureDeleteMessage(
    bot: any, 
    chatId: number, 
    messageId: number,
    reason: string = 'sensitive content'
): Promise<boolean> {
    try {
        await bot.deleteMessage(chatId, messageId);
        secureLogger.info(`Message deleted for security`, { 
            reason, 
            chatId: String(chatId).substring(0, 4) + '***' // Partial ID for logging
        }, 'Security');
        return true;
    } catch (error) {
        secureLogger.warn(`Failed to delete message containing ${reason}`, {
            error: sanitizeError(error)
        }, 'Security');
        return false;
    }
}

/**
 * Generate secure random ID for sensitive operations
 */
export function generateSecureId(prefix: string = 'secure'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    return `${prefix}_${timestamp}_${random}`;
}

/**
 * Mask sensitive values for display purposes
 */
export function maskSensitiveValue(value: string, showLength: number = 4): string {
    if (!value || value.length <= showLength * 2) {
        return '*'.repeat(value?.length || 8);
    }
    
    const start = value.substring(0, showLength);
    const end = value.substring(value.length - showLength);
    const middle = '*'.repeat(Math.max(4, value.length - showLength * 2));
    
    return `${start}${middle}${end}`;
}

/**
 * Security audit log entry
 */
export function auditSecurityEvent(
    event: string, 
    context: Record<string, unknown>, 
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
): void {
    const sanitizedContext = sanitizeObject(context);
    
    secureLogger.warn(`Security Event: ${event}`, {
        severity,
        timestamp: new Date().toISOString(),
        context: sanitizedContext
    }, 'SecurityAudit');
}

/**
 * Environment variable sanitization for logging
 */
export function sanitizeEnvForLogging(): Record<string, string> {
    const sensitiveKeys = [
        'WALLET_ENCRYPTION_KEY',
        'TELEGRAM_BOT_TOKEN', 
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
        'POSTGRES_URL',
        'DEXSCREENER_API_KEY'
    ];
    
    const sanitizedEnv: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(process.env)) {
        if (sensitiveKeys.includes(key)) {
            sanitizedEnv[key] = value ? 'SET' : 'NOT_SET';
        } else if (value) {
            sanitizedEnv[key] = value;
        }
    }
    
    return sanitizedEnv;
}

export default {
    sanitizeMessage,
    sanitizeError,
    secureLogger,
    containsSensitiveData,
    isValidPrivateKey,
    isValidMnemonic,
    secureDeleteMessage,
    generateSecureId,
    maskSensitiveValue,
    auditSecurityEvent,
    sanitizeEnvForLogging
}; 