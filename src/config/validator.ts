/**
 * Configuration Validator for ElizaOS DEX Agent
 * Ensures all required environment variables are present and valid
 */

import { z } from 'zod';
import { logInfo, logError, logWarn } from '../services/logger.js';
import { ConfigurationError } from '../errors/index.js';
import { IAppConfig } from '../types/extended.js';

// Define the configuration schema
const configSchema = z.object({
    // Required fields
    OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
    RPC_URL: z.string().url('RPC_URL must be a valid URL'),
    
    // Optional fields with defaults
    TELEGRAM_BOT_TOKEN: z.string().optional(),
    DATABASE_URL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).optional().default('info'),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
    PORT: z.string().regex(/^\d+$/, 'PORT must be a number').optional().default('3000'),
    DEPLOYMENT_MODE: z.enum(['telegram', 'web', 'all']).optional().default('all'),
    
    // Service configurations with defaults
    CACHE_TTL: z.string().regex(/^\d+$/).optional().default('300000'), // 5 minutes
    MAX_WALLETS_PER_USER: z.string().regex(/^\d+$/).optional().default('5'),
    TRANSACTION_TIMEOUT: z.string().regex(/^\d+$/).optional().default('300000'), // 5 minutes
    HEALTH_CHECK_INTERVAL: z.string().regex(/^\d+$/).optional().default('30000'), // 30 seconds
    
    // Wallet encryption key (generate if not provided)
    WALLET_ENCRYPTION_KEY: z.string().optional(),
    
    // Additional service URLs
    GRAPH_URL: z.string().url().optional(),
    DEXSCREENER_API_KEY: z.string().optional(),
    
    // Feature flags
    ENABLE_METRICS: z.string().transform(val => val === 'true').optional().default('true'),
    ENABLE_HEALTH_CHECKS: z.string().transform(val => val === 'true').optional().default('true'),
    ENABLE_CACHE: z.string().transform(val => val === 'true').optional().default('true'),
});

/**
 * Validate configuration from environment variables
 */
export function validateConfig(): IAppConfig {
    try {
        // Parse and validate environment variables
        const rawConfig = {
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            RPC_URL: process.env.RPC_URL,
            TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
            DATABASE_URL: process.env.DATABASE_URL,
            ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
            LOG_LEVEL: process.env.LOG_LEVEL,
            NODE_ENV: process.env.NODE_ENV,
            PORT: process.env.PORT,
            DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE,
            CACHE_TTL: process.env.CACHE_TTL,
            MAX_WALLETS_PER_USER: process.env.MAX_WALLETS_PER_USER,
            TRANSACTION_TIMEOUT: process.env.TRANSACTION_TIMEOUT,
            HEALTH_CHECK_INTERVAL: process.env.HEALTH_CHECK_INTERVAL,
            WALLET_ENCRYPTION_KEY: process.env.WALLET_ENCRYPTION_KEY,
            GRAPH_URL: process.env.GRAPH_URL,
            DEXSCREENER_API_KEY: process.env.DEXSCREENER_API_KEY,
            ENABLE_METRICS: process.env.ENABLE_METRICS,
            ENABLE_HEALTH_CHECKS: process.env.ENABLE_HEALTH_CHECKS,
            ENABLE_CACHE: process.env.ENABLE_CACHE,
        };

        // Validate using Zod schema
        const validated = configSchema.parse(rawConfig);

        // Transform to proper types
        const config: IAppConfig = {
            OPENAI_API_KEY: validated.OPENAI_API_KEY,
            RPC_URL: validated.RPC_URL,
            TELEGRAM_BOT_TOKEN: validated.TELEGRAM_BOT_TOKEN,
            DATABASE_URL: validated.DATABASE_URL,
            ANTHROPIC_API_KEY: validated.ANTHROPIC_API_KEY,
            LOG_LEVEL: validated.LOG_LEVEL,
            NODE_ENV: validated.NODE_ENV,
            PORT: validated.PORT,
            DEPLOYMENT_MODE: validated.DEPLOYMENT_MODE as 'telegram' | 'web' | 'all',
            CACHE_TTL: parseInt(validated.CACHE_TTL),
            MAX_WALLETS_PER_USER: parseInt(validated.MAX_WALLETS_PER_USER),
            TRANSACTION_TIMEOUT: parseInt(validated.TRANSACTION_TIMEOUT),
            HEALTH_CHECK_INTERVAL: parseInt(validated.HEALTH_CHECK_INTERVAL),
        };

        // Log configuration status
        logInfo('Configuration validated successfully', {
            deployment_mode: config.DEPLOYMENT_MODE,
            node_env: config.NODE_ENV,
            log_level: config.LOG_LEVEL,
            has_telegram: !!config.TELEGRAM_BOT_TOKEN,
            has_database: !!config.DATABASE_URL,
            has_anthropic: !!config.ANTHROPIC_API_KEY,
        });

        // Warn about missing optional configurations
        if (!config.TELEGRAM_BOT_TOKEN && (config.DEPLOYMENT_MODE === 'telegram' || config.DEPLOYMENT_MODE === 'all')) {
            logWarn('TELEGRAM_BOT_TOKEN not provided - Telegram bot will not be available');
        }

        if (!config.DATABASE_URL) {
            logWarn('DATABASE_URL not provided - Using in-memory SQLite database');
        }

        if (!config.ANTHROPIC_API_KEY && !config.OPENAI_API_KEY.startsWith('sk-')) {
            logWarn('ANTHROPIC_API_KEY not provided - AI parsing may have reduced functionality');
        }

        return config;

    } catch (error) {
        if (error instanceof z.ZodError) {
            const missingFields = error.errors
                .filter(err => err.code === 'invalid_type' && err.received === 'undefined')
                .map(err => err.path.join('.'));

            const invalidFields = error.errors
                .filter(err => err.code !== 'invalid_type' || err.received !== 'undefined')
                .map(err => ({
                    field: err.path.join('.'),
                    message: err.message
                }));

            logError(new Error('Configuration validation failed'), {
                missing: missingFields,
                invalid: invalidFields
            });

            // Create helpful error message
            let errorMessage = 'Configuration validation failed:\n';
            
            if (missingFields.length > 0) {
                errorMessage += `\nMissing required fields:\n${missingFields.map(f => `  - ${f}`).join('\n')}`;
            }

            if (invalidFields.length > 0) {
                errorMessage += `\n\nInvalid fields:\n${invalidFields.map(f => `  - ${f.field}: ${f.message}`).join('\n')}`;
            }

            errorMessage += '\n\nPlease check your .env file and ensure all required variables are set correctly.';

            throw new ConfigurationError(errorMessage, missingFields);
        }

        throw error;
    }
}

/**
 * Get validated configuration (singleton)
 */
let cachedConfig: IAppConfig | null = null;

export function getConfig(): IAppConfig {
    if (!cachedConfig) {
        cachedConfig = validateConfig();
    }
    return cachedConfig;
}

/**
 * Reload configuration (useful for testing)
 */
export function reloadConfig(): IAppConfig {
    cachedConfig = null;
    return getConfig();
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: string): boolean {
    const config = getConfig();
    const featureKey = `ENABLE_${feature.toUpperCase()}`;
    return process.env[featureKey] === 'true';
}

/**
 * Get deployment-specific configuration
 */
export function getDeploymentConfig() {
    const config = getConfig();
    
    return {
        isTelegramEnabled: config.DEPLOYMENT_MODE === 'telegram' || config.DEPLOYMENT_MODE === 'all',
        isWebEnabled: config.DEPLOYMENT_MODE === 'web' || config.DEPLOYMENT_MODE === 'all',
        isProduction: config.NODE_ENV === 'production',
        isDevelopment: config.NODE_ENV === 'development',
        port: parseInt(config.PORT || '3000'),
    };
}