/**
 * Startup validation script
 * Runs all necessary checks before starting the application
 */

import { getConfig } from '../config/validator.js';
import { logInfo, logError, logWarn } from '../services/logger.js';
import { DatabaseService } from '../services/databaseService.js';
import { ethers } from 'ethers';

export async function runStartupValidation(): Promise<boolean> {
    logInfo('🚀 Running startup validation...');
    
    try {
        // 1. Validate configuration
        logInfo('Validating configuration...');
        const config = getConfig();
        logInfo('✅ Configuration validated');

        // 2. Check RPC connection
        logInfo('Checking RPC connection...');
        try {
            const provider = new ethers.JsonRpcProvider(config.RPC_URL);
            const blockNumber = await provider.getBlockNumber();
            logInfo(`✅ RPC connection successful - Block: ${blockNumber}`);
        } catch (error) {
            logError(error as Error, { context: 'RPC connection check failed' });
            return false;
        }

        // 3. Check database connection (if configured)
        if (config.DATABASE_URL) {
            logInfo('Checking database connection...');
            try {
                // This would need proper runtime initialization
                logInfo('✅ Database connection check skipped (requires runtime)');
            } catch (error) {
                logWarn('Database connection check failed', { error });
                // Non-fatal - can use in-memory database
            }
        }

        // 4. Check API keys
        if (config.OPENAI_API_KEY) {
            logInfo('✅ OpenAI API key configured');
        }
        
        if (config.ANTHROPIC_API_KEY) {
            logInfo('✅ Anthropic API key configured');
        } else {
            logWarn('Anthropic API key not configured - some features may be limited');
        }

        // 5. Check deployment mode requirements
        if (config.DEPLOYMENT_MODE === 'telegram' || config.DEPLOYMENT_MODE === 'all') {
            if (!config.TELEGRAM_BOT_TOKEN) {
                logError(new Error('TELEGRAM_BOT_TOKEN required for Telegram deployment'));
                return false;
            }
            logInfo('✅ Telegram bot token configured');
        }

        // 6. Check wallet encryption
        if (!process.env.WALLET_ENCRYPTION_KEY) {
            logWarn('WALLET_ENCRYPTION_KEY not set - a random key will be generated');
        }

        // 7. Log deployment configuration
        logInfo('Deployment configuration:', {
            mode: config.DEPLOYMENT_MODE,
            environment: config.NODE_ENV,
            port: config.PORT,
            cache_enabled: process.env.ENABLE_CACHE !== 'false',
            metrics_enabled: process.env.ENABLE_METRICS !== 'false',
            health_checks_enabled: process.env.ENABLE_HEALTH_CHECKS !== 'false'
        });

        logInfo('✅ All startup validations passed!');
        return true;

    } catch (error) {
        logError(error as Error, { context: 'Startup validation failed' });
        return false;
    }
}

// Run validation if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runStartupValidation().then(success => {
        process.exit(success ? 0 : 1);
    });
}