import { elizaLogger } from '@elizaos/core';
import { ElizaOSDatabaseAdapter, createDatabaseAdapter } from './databaseAdapter.js';

// Interface for ElizaOS runtime
interface IAgentRuntime {
    adapter?: any;
    databaseAdapter?: any;
}

export interface TradingHistoryRecord {
    id: string;
    userPlatformId: string;
    walletId: string;
    transactionHash?: string;
    fromToken: string;
    toToken: string;
    amountIn: string;
    amountOut: string;
    priceImpact?: number;
    slippageUsed?: number;
    gasUsed?: string;
    gasCost?: string;
    success: boolean;
    timestamp: string;
    platform: string;
    dexUsed?: string;
    notes?: string;
}

export interface PriceAlert {
    id: string;
    userPlatformId: string;
    tokenSymbol: string;
    targetPrice: number;
    isAbove: boolean; // true for "above", false for "below"
    isActive: boolean;
    triggeredAt?: string;
    createdAt: string;
    platform: string;
    alertMessage?: string;
}

export interface PortfolioSnapshot {
    id: string;
    userPlatformId: string;
    walletId: string;
    tokenBalances: Record<string, string>; // {"HEX": "1000", "USDC": "500"}
    tokenPricesUSD: Record<string, number>;
    totalValueUSD: number;
    timestamp: string;
    chain: string;
}

export interface UserPreferences {
    userPlatformId: string;
    preferredTokens: string[]; // Favorite tokens
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    tradingStyle: 'scalping' | 'swing' | 'hodl' | 'mixed';
    educationProgress: Record<string, boolean>; // topic completion
    notificationSettings: {
        priceAlerts: boolean;
        tradingUpdates: boolean;
        portfolioChanges: boolean;
        educationalTips: boolean;
        gasOptimization: boolean;
    };
    tradingHours: {
        timezone: string;
        preferredStart: string; // "09:00"
        preferredEnd: string;   // "17:00"
        weekendsActive: boolean;
    };
    language: string;
    autoSlippageMax: number;
    defaultGasSpeed: 'slow' | 'standard' | 'fast';
    lastActiveAt: string;
}

export interface TokenWatchlist {
    id: string;
    userPlatformId: string;
    name: string;
    tokenSymbols: string[];
    description?: string;
    createdAt: string;
    platform: string;
    isDefault: boolean;
}

export interface EducationProgress {
    id: string;
    userPlatformId: string;
    topicId: string;
    topicName: string;
    completed: boolean;
    score?: number;
    timeSpent?: number; // minutes
    completedAt?: string;
    platform: string;
    attempts: number;
}

export interface PerformanceMetrics {
    id: string;
    userPlatformId: string;
    walletId: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    totalTrades: number;
    successfulTrades: number;
    totalVolume: string;
    totalFees: string;
    totalProfit: string;
    averageSlippage: number;
    averageGasCost: string;
    bestTrade?: {
        profit: string;
        percentage: number;
        token: string;
        date: string;
    };
    worstTrade?: {
        loss: string;
        percentage: number;
        token: string;
        date: string;
    };
    favoriteTokens: Record<string, number>; // token -> trade count
    calculatedAt: string;
}

export interface UserSession {
    sessionId: string;
    userPlatformId: string;
    platform: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    lastActiveAt: string;
    isActive: boolean;
    activityCount: number;
}

export class DatabaseService {
    private runtime: IAgentRuntime;
    private db: ElizaOSDatabaseAdapter;

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        
        // Create unified adapter
        this.db = createDatabaseAdapter(runtime);
        elizaLogger.info("📊 DatabaseService initialized with unified adapter");
    }

    /**
     * Initialize all database schemas
     */
    async initializeDatabase(): Promise<void> {
        try {
            // Create tables with proper PostgreSQL/SQLite compatibility
            await this.db.execute(`
                -- Wallets table
                CREATE TABLE IF NOT EXISTS wallets (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    encryptedPrivateKey TEXT NOT NULL,
                    userPlatformId TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    platformUserId TEXT NOT NULL,
                    platformUsername TEXT,
                    settings TEXT NOT NULL,
                    createdAt TEXT NOT NULL,
                    lastUsed TEXT NOT NULL,
                    isActive INTEGER NOT NULL DEFAULT 0
                );

                -- Trading history table
                CREATE TABLE IF NOT EXISTS trading_history (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    walletId TEXT NOT NULL,
                    transactionHash TEXT,
                    fromToken TEXT NOT NULL,
                    toToken TEXT NOT NULL,
                    amountIn TEXT NOT NULL,
                    amountOut TEXT NOT NULL,
                    priceImpact REAL,
                    slippageUsed REAL,
                    gasUsed TEXT,
                    gasCost TEXT,
                    success INTEGER NOT NULL,
                    timestamp TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    dexUsed TEXT,
                    notes TEXT
                );

                -- Price alerts table
                CREATE TABLE IF NOT EXISTS price_alerts (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    tokenSymbol TEXT NOT NULL,
                    targetPrice REAL NOT NULL,
                    isAbove INTEGER NOT NULL,
                    isActive INTEGER DEFAULT 1,
                    triggeredAt TEXT,
                    createdAt TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    alertMessage TEXT
                );

                -- Portfolio snapshots table
                CREATE TABLE IF NOT EXISTS portfolio_snapshots (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    walletId TEXT NOT NULL,
                    tokenBalances TEXT NOT NULL,
                    tokenPricesUSD TEXT NOT NULL,
                    totalValueUSD REAL NOT NULL,
                    timestamp TEXT NOT NULL,
                    chain TEXT NOT NULL DEFAULT 'pulsechain'
                );

                -- User preferences table
                CREATE TABLE IF NOT EXISTS user_preferences (
                    userPlatformId TEXT PRIMARY KEY,
                    preferredTokens TEXT NOT NULL,
                    riskTolerance TEXT DEFAULT 'moderate',
                    tradingStyle TEXT DEFAULT 'mixed',
                    educationProgress TEXT NOT NULL,
                    notificationSettings TEXT NOT NULL,
                    tradingHours TEXT NOT NULL,
                    language TEXT DEFAULT 'en',
                    autoSlippageMax REAL DEFAULT 5.0,
                    defaultGasSpeed TEXT DEFAULT 'standard',
                    lastActiveAt TEXT NOT NULL
                );

                -- Token watchlists table
                CREATE TABLE IF NOT EXISTS token_watchlists (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    name TEXT NOT NULL,
                    tokenSymbols TEXT NOT NULL,
                    description TEXT,
                    createdAt TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    isDefault INTEGER DEFAULT 0
                );

                -- Education progress table
                CREATE TABLE IF NOT EXISTS education_progress (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    topicId TEXT NOT NULL,
                    topicName TEXT NOT NULL,
                    completed INTEGER DEFAULT 0,
                    score INTEGER,
                    timeSpent INTEGER,
                    completedAt TEXT,
                    platform TEXT NOT NULL,
                    attempts INTEGER DEFAULT 0
                );

                -- Performance metrics table
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    walletId TEXT NOT NULL,
                    period TEXT NOT NULL,
                    totalTrades INTEGER DEFAULT 0,
                    successfulTrades INTEGER DEFAULT 0,
                    totalVolume TEXT DEFAULT '0',
                    totalFees TEXT DEFAULT '0',
                    totalProfit TEXT DEFAULT '0',
                    averageSlippage REAL DEFAULT 0,
                    averageGasCost TEXT DEFAULT '0',
                    bestTrade TEXT,
                    worstTrade TEXT,
                    favoriteTokens TEXT NOT NULL,
                    calculatedAt TEXT NOT NULL
                );

                -- User sessions table
                CREATE TABLE IF NOT EXISTS user_sessions (
                    sessionId TEXT PRIMARY KEY,
                    userPlatformId TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    ipAddress TEXT,
                    userAgent TEXT,
                    createdAt TEXT NOT NULL,
                    lastActiveAt TEXT NOT NULL,
                    isActive INTEGER DEFAULT 1,
                    activityCount INTEGER DEFAULT 0
                );

                -- Token registry table
                CREATE TABLE IF NOT EXISTS token_registry (
                    id TEXT PRIMARY KEY,
                    symbol TEXT NOT NULL,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    decimals INTEGER DEFAULT 18,
                    variations TEXT NOT NULL,
                    chain TEXT NOT NULL DEFAULT 'pulsechain',
                    isActive INTEGER DEFAULT 1,
                    addedAt TEXT NOT NULL,
                    updatedAt TEXT NOT NULL
                );
            `);

            // Create indexes for performance
            await this.db.execute(`
                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);
                CREATE INDEX IF NOT EXISTS idx_trading_history_user ON trading_history(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_trading_history_wallet ON trading_history(walletId);
                CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(isActive, tokenSymbol);
                CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_snapshots(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_watchlists_user ON token_watchlists(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_education_user ON education_progress(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_performance_user ON performance_metrics(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_token_registry_symbol ON token_registry(symbol);
            `);

            elizaLogger.info("✅ Complete database schema initialized with all tables and indexes");
        } catch (error) {
            elizaLogger.error("Error initializing database schema:", error);
            throw error;
        }
    }

    // Trading History Methods
    async recordTrade(trade: Omit<TradingHistoryRecord, 'id'>): Promise<string> {
        const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.db.insert(`
            INSERT INTO trading_history (
                id, userPlatformId, walletId, transactionHash, fromToken, toToken,
                amountIn, amountOut, priceImpact, slippageUsed, gasUsed, gasCost,
                success, timestamp, platform, dexUsed, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
            id, trade.userPlatformId, trade.walletId, trade.transactionHash || null,
            trade.fromToken, trade.toToken, trade.amountIn, trade.amountOut,
            trade.priceImpact || null, trade.slippageUsed || null,
            trade.gasUsed || null, trade.gasCost || null,
            trade.success ? 1 : 0, trade.timestamp, trade.platform,
            trade.dexUsed || null, trade.notes || null
        ]);

        elizaLogger.info(`📊 Recorded trade: ${trade.fromToken} → ${trade.toToken}`);
        return id;
    }

    async getTradingHistory(userPlatformId: string, limit = 50): Promise<TradingHistoryRecord[]> {
        const result = await this.db.query(`
            SELECT * FROM trading_history 
            WHERE userPlatformId = $1 
            ORDER BY timestamp DESC 
            LIMIT $2
        `, [userPlatformId, limit]);

        return result.rows.map(trade => ({
            ...trade,
            success: Boolean(trade.success)
        }));
    }

    // Price Alerts Methods
    async createPriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<string> {
        const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.db.insert(`
            INSERT INTO price_alerts (
                id, userPlatformId, tokenSymbol, targetPrice, isAbove,
                isActive, createdAt, platform, alertMessage
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
            id, alert.userPlatformId, alert.tokenSymbol, alert.targetPrice,
            alert.isAbove ? 1 : 0, alert.isActive ? 1 : 0,
            alert.createdAt, alert.platform, alert.alertMessage || null
        ]);

        elizaLogger.info(`🔔 Created price alert: ${alert.tokenSymbol} ${alert.isAbove ? 'above' : 'below'} $${alert.targetPrice}`);
        return id;
    }

    async getActivePriceAlerts(userPlatformId?: string): Promise<PriceAlert[]> {
        const query = userPlatformId
            ? `SELECT * FROM price_alerts WHERE userPlatformId = $1 AND isActive = 1`
            : `SELECT * FROM price_alerts WHERE isActive = 1`;
        
        const params = userPlatformId ? [userPlatformId] : [];
        const result = await this.db.query(query, params);

        return result.rows.map(alert => ({
            ...alert,
            isAbove: Boolean(alert.isAbove),
            isActive: Boolean(alert.isActive)
        }));
    }

    // Portfolio Methods
    async savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'id'>): Promise<string> {
        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.db.insert(`
            INSERT INTO portfolio_snapshots (
                id, userPlatformId, walletId, tokenBalances, tokenPricesUSD,
                totalValueUSD, timestamp, chain
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            id, snapshot.userPlatformId, snapshot.walletId,
            JSON.stringify(snapshot.tokenBalances),
            JSON.stringify(snapshot.tokenPricesUSD),
            snapshot.totalValueUSD, snapshot.timestamp, snapshot.chain
        ]);

        elizaLogger.info(`📈 Saved portfolio snapshot for wallet ${snapshot.walletId}`);
        return id;
    }

    // Watchlist Methods
    async createWatchlist(watchlist: Omit<TokenWatchlist, 'id'>): Promise<string> {
        const id = `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.db.insert(`
            INSERT INTO token_watchlists (
                id, userPlatformId, name, tokenSymbols, description,
                createdAt, platform, isDefault
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            id, watchlist.userPlatformId, watchlist.name,
            JSON.stringify(watchlist.tokenSymbols),
            watchlist.description || null,
            watchlist.createdAt, watchlist.platform,
            watchlist.isDefault ? 1 : 0
        ]);

        elizaLogger.info(`📋 Created watchlist: ${watchlist.name}`);
        return id;
    }

    async getUserWatchlists(userPlatformId: string): Promise<TokenWatchlist[]> {
        const result = await this.db.query(`
            SELECT * FROM token_watchlists 
            WHERE userPlatformId = $1 
            ORDER BY isDefault DESC, createdAt ASC
        `, [userPlatformId]);

        return result.rows.map(w => {
            try {
                return {
                    ...w,
                    tokenSymbols: JSON.parse(w.tokenSymbols),
                    isDefault: Boolean(w.isDefault)
                };
            } catch (error) {
                elizaLogger.error(`Failed to parse watchlist tokens for watchlist ${w.id}:`, error);
                // Return with empty token list as fallback
                return {
                    ...w,
                    tokenSymbols: [],
                    isDefault: Boolean(w.isDefault)
                };
            }
        });
    }

    // Token Registry Methods
    async addToken(token: {
        symbol: string;
        name: string;
        address: string;
        decimals?: number;
        variations: string[];
        chain?: string;
    }): Promise<string> {
        const id = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        await this.db.insert(`
            INSERT INTO token_registry (
                id, symbol, name, address, decimals, variations,
                chain, isActive, addedAt, updatedAt
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
            id, token.symbol, token.name, token.address,
            token.decimals || 18, JSON.stringify(token.variations),
            token.chain || 'pulsechain', 1, now, now
        ]);

        elizaLogger.info(`🪙 Added token to registry: ${token.symbol} (${token.name})`);
        return id;
    }

    async getToken(symbol: string): Promise<any | null> {
        const result = await this.db.queryOne(`
            SELECT * FROM token_registry 
            WHERE symbol = $1 AND isActive = 1
        `, [symbol]);

        if (!result) return null;

        return {
            ...result,
            variations: JSON.parse(result.variations),
            isActive: Boolean(result.isActive)
        };
    }

    async getAllTokens(chain: string = 'pulsechain'): Promise<any[]> {
        const result = await this.db.query(`
            SELECT * FROM token_registry 
            WHERE chain = $1 AND isActive = 1
            ORDER BY symbol ASC
        `, [chain]);

        return result.rows.map(token => ({
            ...token,
            variations: JSON.parse(token.variations),
            isActive: Boolean(token.isActive)
        }));
    }

    async searchTokens(query: string): Promise<any[]> {
        const searchPattern = `%${query.toLowerCase()}%`;
        const result = await this.db.query(`
            SELECT * FROM token_registry 
            WHERE (LOWER(symbol) LIKE $1 OR LOWER(name) LIKE $2 OR LOWER(variations) LIKE $3)
            AND isActive = 1
            ORDER BY 
                CASE 
                    WHEN LOWER(symbol) = $4 THEN 1
                    WHEN LOWER(symbol) LIKE $5 THEN 2
                    ELSE 3
                END,
                symbol ASC
            LIMIT 10
        `, [
            searchPattern, searchPattern, searchPattern,
            query.toLowerCase(), `${query.toLowerCase()}%`
        ]);

        return result.rows.map(token => ({
            ...token,
            variations: JSON.parse(token.variations),
            isActive: Boolean(token.isActive)
        }));
    }

    async importTokensFromJson(tokensData: any[]): Promise<number> {
        let imported = 0;
        
        for (const token of tokensData) {
            try {
                await this.addToken({
                    symbol: token.symbol,
                    name: token.name,
                    address: token.address,
                    decimals: token.decimals,
                    variations: token.variations || [token.symbol.toLowerCase()],
                    chain: token.chain || 'pulsechain'
                });
                imported++;
            } catch (error) {
                elizaLogger.error(`Failed to import token ${token.symbol}:`, error);
            }
        }

        elizaLogger.info(`✅ Imported ${imported} tokens into registry`);
        return imported;
    }

    // Additional methods would follow the same pattern...
    // Using this.db.query(), this.db.insert(), this.db.queryOne(), etc.
} 