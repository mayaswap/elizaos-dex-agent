/**
 * Global Type Definitions for ElizaOS DEX Agent
 * Fixes missing Node.js types and other global definitions
 */

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            LOG_LEVEL?: string;
            LOG_TO_FILE?: string;
            LOG_FILE_PATH?: string;
            NODE_ENV?: 'development' | 'production' | 'test';
            TELEGRAM_BOT_TOKEN?: string;
            OPENAI_API_KEY?: string;
            ANTHROPIC_API_KEY?: string;
            WALLET_ENCRYPTION_KEY?: string;
            SQLITE_DATA_DIR?: string;
            POSTGRES_URL?: string;
            DEXSCREENER_API_KEY?: string;
            GRAPHQL_ENDPOINT?: string;
            PULSECHAIN_RPC?: string;
            DEX_API_BASE_URL?: string;
            [key: string]: string | undefined;
        }
    }

    // Telegram Bot API types (temporary fix for missing types)
    interface TelegramMessage {
        message_id: number;
        from?: {
            id: number;
            is_bot: boolean;
            first_name: string;
            last_name?: string;
            username?: string;
        };
        chat: {
            id: number;
            type: 'private' | 'group' | 'supergroup' | 'channel';
            title?: string;
            username?: string;
            first_name?: string;
            last_name?: string;
        };
        date: number;
        text?: string;
        entities?: Array<{
            type: string;
            offset: number;
            length: number;
        }>;
    }

    // Database types
    interface DatabaseRow {
        [key: string]: unknown;
    }

    // Pool/Token types
    interface PoolData {
        id: string;
        token0: {
            symbol: string;
            address: string;
            decimals: number;
        };
        token1: {
            symbol: string;
            address: string;
            decimals: number;
        };
        feeTier: string;
        totalValueLockedUSD: string;
        volumeUSD: string;
        feesUSD?: string;
        token0Price: string;
        token1Price: string;
        poolDayData?: Array<{
            feesUSD: string;
            volumeUSD: string;
        }>;
    }

    // Price data interface
    interface PriceDataResponse {
        price: string;
        priceUSD: number;
        error?: string;
        chain?: string;
        level?: string;
        gasPrice?: string;
        maxFeePerGas?: string;
        maxPriorityFeePerGas?: string;
        symbol?: string;
        costs?: {
            swap?: string;
            transfer?: string;
            liquidity?: string;
        };
    }

    // Performance metrics
    interface PerformanceData {
        netPnL: number;
        pnlPercentage: number;
        feesEarned: number;
        impermanentLoss: number;
        apy: number;
        currentValue: number;
        initialValue: number;
        pool: string;
        tokenId: string;
        entryDate: string;
        daysActive: number;
        liquidity: {
            hex?: string;
            usdc?: string;
        };
        priceRange: {
            lower: number;
            current: number;
            upper: number;
            inRange: boolean;
        };
    }
}

export {}; 