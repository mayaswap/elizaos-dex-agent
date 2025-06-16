import { IAgentRuntime, Memory } from '@elizaos/core';
import { ElizaOSDatabaseAdapter } from '../services/databaseAdapter.js';
import { WalletService } from '../services/walletService.js';
import { DatabaseService } from '../services/databaseService.js';

/**
 * Extended runtime interface that includes database adapter
 */
export interface IRuntimeWithDB extends IAgentRuntime {
    databaseAdapter: ElizaOSDatabaseAdapter;
}

/**
 * Extended runtime interface with all custom services
 */
export interface IExtendedRuntime extends IRuntimeWithDB {
    walletService?: WalletService;
    databaseService?: DatabaseService;
    customServices?: {
        wallet?: WalletService;
        database?: DatabaseService;
    };
}

/**
 * Platform user interface for cross-platform compatibility
 */
export interface IPlatformUser {
    id: string;
    platform: 'telegram' | 'discord' | 'web' | 'api';
    userId: string;
    username?: string;
    created?: Date;
    lastActive?: Date;
}

/**
 * Action validation result
 */
export interface IActionValidation {
    valid: boolean;
    error?: string;
    params?: Record<string, any>;
}

/**
 * Extended memory interface with platform-specific data
 */
export interface IExtendedMemory extends Memory {
    platform?: 'telegram' | 'discord' | 'web' | 'api';
    platformUserId?: string;
    userId?: string;
    chatId?: string | number;
    channelId?: string | number;
    messageId?: string | number;
    username?: string;
    user?: {
        id?: string;
        username?: string;
        displayName?: string;
        name?: string;
    };
}

/**
 * Service health status
 */
export interface IServiceHealth {
    status: 'healthy' | 'degraded' | 'critical';
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
    details: string;
    metrics?: Record<string, any>;
}

/**
 * Wallet operation result
 */
export interface IWalletOperationResult {
    success: boolean;
    data?: any;
    error?: string;
    transactionHash?: string;
}

/**
 * Transaction confirmation params
 */
export interface ITransactionConfirmation {
    transactionId: string;
    userId: string;
    platform: 'telegram' | 'discord' | 'web' | 'api';
    action: string;
    params: Record<string, any>;
    expiresAt: number;
    status: 'pending' | 'confirmed' | 'rejected' | 'expired';
}

/**
 * Price data interface
 */
export interface IPriceData {
    price: string;
    change24h: number;
    liquidity: number;
    volume24h: number;
    lastUpdated: string;
}

/**
 * Token metadata interface
 */
export interface ITokenMetadata {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    logoURI?: string;
}

/**
 * Pool information interface
 */
export interface IPoolInfo {
    poolAddress: string;
    token0: ITokenMetadata;
    token1: ITokenMetadata;
    fee: number;
    liquidity: string;
    volume24h: string;
    tvl: string;
    apr?: number;
}

/**
 * Swap parameters interface
 */
export interface ISwapParams {
    tokenIn: string;
    tokenOut: string;
    amountIn?: string;
    amountOut?: string;
    slippage?: number;
    recipient?: string;
}

/**
 * Action handler interface
 */
export interface IActionHandler {
    name: string;
    description: string;
    validate: (runtime: IExtendedRuntime, message: IExtendedMemory) => Promise<IActionValidation>;
    handler: (runtime: IExtendedRuntime, message: IExtendedMemory, params: Record<string, any>) => Promise<boolean>;
    examples: string[];
}

/**
 * Cache entry interface
 */
export interface ICacheEntry<T = any> {
    value: T;
    expiry: number;
    hits?: number;
    lastAccessed?: number;
}

/**
 * Metric event interface
 */
export interface IMetricEvent {
    type: 'user_action' | 'system_event' | 'error' | 'performance';
    category: string;
    action: string;
    user?: IPlatformUser;
    data: any;
    timestamp: number;
}

/**
 * Configuration schema interface
 */
export interface IAppConfig {
    // Required
    TELEGRAM_BOT_TOKEN?: string;
    OPENAI_API_KEY: string;
    RPC_URL: string;
    
    // Optional
    DATABASE_URL?: string;
    ANTHROPIC_API_KEY?: string;
    LOG_LEVEL?: string;
    NODE_ENV?: string;
    PORT?: string;
    DEPLOYMENT_MODE?: 'telegram' | 'web' | 'all';
    
    // Service configurations
    CACHE_TTL?: number;
    MAX_WALLETS_PER_USER?: number;
    TRANSACTION_TIMEOUT?: number;
    HEALTH_CHECK_INTERVAL?: number;
}

/**
 * Type guards
 */
export function isExtendedRuntime(runtime: any): runtime is IExtendedRuntime {
    return runtime && 
           typeof runtime === 'object' && 
           'databaseAdapter' in runtime;
}

export function isExtendedMemory(memory: any): memory is IExtendedMemory {
    return memory && 
           typeof memory === 'object' && 
           'content' in memory;
}

export function isPlatformUser(user: any): user is IPlatformUser {
    return user && 
           typeof user === 'object' && 
           'id' in user && 
           'platform' in user && 
           'userId' in user;
}

/**
 * Utility type for making properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making properties required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;