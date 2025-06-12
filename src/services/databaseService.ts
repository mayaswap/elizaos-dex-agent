import Database from 'better-sqlite3';

// Simple logger
const elizaLogger = {
    info: (msg: string) => console.log(`ℹ️ ${msg}`),
    warn: (msg: string) => console.warn(`⚠️ ${msg}`),
    error: (msg: string, error?: any) => console.error(`❌ ${msg}`, error || '')
};

// Simple runtime interface
interface IAgentRuntime {
    databaseAdapter?: {
        db: Database.Database;
    };
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

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
    }

    /**
     * Initialize all database schemas
     */
    async initializeDatabase(): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.warn("No database adapter available, skipping database initialization");
            return;
        }

        try {
            await this.runtime.databaseAdapter.db.exec(`
                -- Wallets table (from WalletService)
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
                    isActive INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(userPlatformId, address)
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
                    attempts INTEGER DEFAULT 0,
                    UNIQUE(userPlatformId, topicId)
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
                    calculatedAt TEXT NOT NULL,
                    UNIQUE(userPlatformId, walletId, period)
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
            `);

            // Create indexes for performance
            await this.runtime.databaseAdapter.db.exec(`
                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);
                CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(userPlatformId, isActive);
                
                CREATE INDEX IF NOT EXISTS idx_trading_history_user ON trading_history(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_trading_history_wallet ON trading_history(walletId);
                CREATE INDEX IF NOT EXISTS idx_trading_history_timestamp ON trading_history(timestamp);
                CREATE INDEX IF NOT EXISTS idx_trading_history_tokens ON trading_history(fromToken, toToken);
                
                CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(isActive, tokenSymbol);
                
                CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_snapshots(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_portfolio_wallet ON portfolio_snapshots(walletId);
                CREATE INDEX IF NOT EXISTS idx_portfolio_timestamp ON portfolio_snapshots(timestamp);
                
                CREATE INDEX IF NOT EXISTS idx_watchlists_user ON token_watchlists(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_education_user ON education_progress(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_performance_user ON performance_metrics(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_sessions_active ON user_sessions(isActive, lastActiveAt);
            `);

            elizaLogger.info("✅ Complete database schema initialized with all tables and indexes");
        } catch (error) {
            elizaLogger.error("Error initializing database schema:", error);
            throw error;
        }
    }

    // Trading History Methods
    async recordTrade(trade: Omit<TradingHistoryRecord, 'id'>): Promise<string> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        const id = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.runtime.databaseAdapter.db.prepare(`
            INSERT INTO trading_history (
                id, userPlatformId, walletId, transactionHash, fromToken, toToken,
                amountIn, amountOut, priceImpact, slippageUsed, gasUsed, gasCost,
                success, timestamp, platform, dexUsed, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, trade.userPlatformId, trade.walletId, trade.transactionHash || null,
            trade.fromToken, trade.toToken, trade.amountIn, trade.amountOut,
            trade.priceImpact || null, trade.slippageUsed || null,
            trade.gasUsed || null, trade.gasCost || null,
            trade.success ? 1 : 0, trade.timestamp, trade.platform,
            trade.dexUsed || null, trade.notes || null
        );

        elizaLogger.info(`📊 Recorded trade: ${trade.fromToken} → ${trade.toToken}`);
        return id;
    }

    async getTradingHistory(userPlatformId: string, limit = 50): Promise<TradingHistoryRecord[]> {
        if (!this.runtime.databaseAdapter) return [];

        const trades = await this.runtime.databaseAdapter.db.prepare(`
            SELECT * FROM trading_history 
            WHERE userPlatformId = ? 
            ORDER BY timestamp DESC 
            LIMIT ?
        `).all(userPlatformId, limit) as any[];

        return trades.map(trade => ({
            ...trade,
            success: Boolean(trade.success)
        }));
    }

    // Price Alerts Methods
    async createPriceAlert(alert: Omit<PriceAlert, 'id'>): Promise<string> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.runtime.databaseAdapter.db.prepare(`
            INSERT INTO price_alerts (
                id, userPlatformId, tokenSymbol, targetPrice, isAbove,
                isActive, createdAt, platform, alertMessage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, alert.userPlatformId, alert.tokenSymbol, alert.targetPrice,
            alert.isAbove ? 1 : 0, alert.isActive ? 1 : 0,
            alert.createdAt, alert.platform, alert.alertMessage || null
        );

        elizaLogger.info(`🔔 Created price alert: ${alert.tokenSymbol} ${alert.isAbove ? 'above' : 'below'} $${alert.targetPrice}`);
        return id;
    }

    async getActivePriceAlerts(userPlatformId?: string): Promise<PriceAlert[]> {
        if (!this.runtime.databaseAdapter) return [];

        const query = userPlatformId
            ? `SELECT * FROM price_alerts WHERE userPlatformId = ? AND isActive = 1`
            : `SELECT * FROM price_alerts WHERE isActive = 1`;
        
        const params = userPlatformId ? [userPlatformId] : [];
        const alerts = await this.runtime.databaseAdapter.db.prepare(query).all(...params) as any[];

        return alerts.map(alert => ({
            ...alert,
            isAbove: Boolean(alert.isAbove),
            isActive: Boolean(alert.isActive)
        }));
    }

    // Portfolio Methods
    async savePortfolioSnapshot(snapshot: Omit<PortfolioSnapshot, 'id'>): Promise<string> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.runtime.databaseAdapter.db.prepare(`
            INSERT INTO portfolio_snapshots (
                id, userPlatformId, walletId, tokenBalances, tokenPricesUSD,
                totalValueUSD, timestamp, chain
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, snapshot.userPlatformId, snapshot.walletId,
            JSON.stringify(snapshot.tokenBalances),
            JSON.stringify(snapshot.tokenPricesUSD),
            snapshot.totalValueUSD, snapshot.timestamp, snapshot.chain
        );

        elizaLogger.info(`📈 Saved portfolio snapshot: $${snapshot.totalValueUSD.toFixed(2)}`);
        return id;
    }

    // User Preferences Methods
    async saveUserPreferences(prefs: UserPreferences): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        await this.runtime.databaseAdapter.db.prepare(`
            INSERT OR REPLACE INTO user_preferences (
                userPlatformId, preferredTokens, riskTolerance, tradingStyle,
                educationProgress, notificationSettings, tradingHours,
                language, autoSlippageMax, defaultGasSpeed, lastActiveAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            prefs.userPlatformId,
            JSON.stringify(prefs.preferredTokens),
            prefs.riskTolerance,
            prefs.tradingStyle,
            JSON.stringify(prefs.educationProgress),
            JSON.stringify(prefs.notificationSettings),
            JSON.stringify(prefs.tradingHours),
            prefs.language,
            prefs.autoSlippageMax,
            prefs.defaultGasSpeed,
            prefs.lastActiveAt
        );

        elizaLogger.info(`⚙️ Saved user preferences for ${prefs.userPlatformId}`);
    }

    async getUserPreferences(userPlatformId: string): Promise<UserPreferences | null> {
        if (!this.runtime.databaseAdapter) return null;

        const prefs = await this.runtime.databaseAdapter.db.prepare(`
            SELECT * FROM user_preferences WHERE userPlatformId = ?
        `).get(userPlatformId) as any;

        if (!prefs) return null;

        try {
            return {
                ...prefs,
                preferredTokens: JSON.parse(prefs.preferredTokens),
                educationProgress: JSON.parse(prefs.educationProgress),
                notificationSettings: JSON.parse(prefs.notificationSettings),
                tradingHours: JSON.parse(prefs.tradingHours)
            };
        } catch (error) {
            elizaLogger.error(`Failed to parse user preferences for ${userPlatformId}:`, error);
            // Return null to indicate corrupted data
            return null;
        }
    }

    // Watchlist Methods
    async createWatchlist(watchlist: Omit<TokenWatchlist, 'id'>): Promise<string> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        const id = `watchlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.runtime.databaseAdapter.db.prepare(`
            INSERT INTO token_watchlists (
                id, userPlatformId, name, tokenSymbols, description,
                createdAt, platform, isDefault
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, watchlist.userPlatformId, watchlist.name,
            JSON.stringify(watchlist.tokenSymbols),
            watchlist.description || null,
            watchlist.createdAt, watchlist.platform,
            watchlist.isDefault ? 1 : 0
        );

        elizaLogger.info(`📋 Created watchlist: ${watchlist.name}`);
        return id;
    }

    async getUserWatchlists(userPlatformId: string): Promise<TokenWatchlist[]> {
        if (!this.runtime.databaseAdapter) return [];

        const watchlists = await this.runtime.databaseAdapter.db.prepare(`
            SELECT * FROM token_watchlists 
            WHERE userPlatformId = ? 
            ORDER BY isDefault DESC, createdAt ASC
        `).all(userPlatformId) as any[];

        return watchlists.map(w => {
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

    // Session Management
    async createSession(session: UserSession): Promise<void> {
        if (!this.runtime.databaseAdapter) return;

        await this.runtime.databaseAdapter.db.prepare(`
            INSERT OR REPLACE INTO user_sessions (
                sessionId, userPlatformId, platform, ipAddress, userAgent,
                createdAt, lastActiveAt, isActive, activityCount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            session.sessionId, session.userPlatformId, session.platform,
            session.ipAddress || null, session.userAgent || null,
            session.createdAt, session.lastActiveAt,
            session.isActive ? 1 : 0, session.activityCount
        );
    }

    async updateSessionActivity(sessionId: string): Promise<void> {
        if (!this.runtime.databaseAdapter) return;

        await this.runtime.databaseAdapter.db.prepare(`
            UPDATE user_sessions 
            SET lastActiveAt = ?, activityCount = activityCount + 1 
            WHERE sessionId = ?
        `).run(new Date().toISOString(), sessionId);
    }

    // Analytics and Insights
    async calculatePerformanceMetrics(userPlatformId: string, walletId: string, period: string): Promise<void> {
        if (!this.runtime.databaseAdapter) return;

        const trades = await this.getTradingHistory(userPlatformId, 1000);
        const walletTrades = trades.filter(t => t.walletId === walletId);

        // Calculate metrics based on trades
        const totalTrades = walletTrades.length;
        const successfulTrades = walletTrades.filter(t => t.success).length;
        
        // Create performance record
        const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await this.runtime.databaseAdapter.db.prepare(`
            INSERT OR REPLACE INTO performance_metrics (
                id, userPlatformId, walletId, period, totalTrades, successfulTrades,
                totalVolume, totalFees, totalProfit, averageSlippage, averageGasCost,
                bestTrade, worstTrade, favoriteTokens, calculatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            id, userPlatformId, walletId, period, totalTrades, successfulTrades,
            '0', '0', '0', 0, '0', null, null, '{}', new Date().toISOString()
        );

        elizaLogger.info(`📊 Calculated performance metrics for ${period} period`);
    }
}

export default DatabaseService; 