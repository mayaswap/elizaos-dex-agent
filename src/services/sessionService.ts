import { elizaLogger } from '@elizaos/core';
import { cleanupManager } from '../utils/cleanupManager.js';
import { WalletService } from './walletService.js';
import { IExtendedRuntime } from '../types/extended.js';

export interface PlatformUser {
    platform: 'telegram' | 'discord' | 'web' | 'api';
    platformUserId: string;
    platformUsername?: string;
    displayName?: string;
}

export interface GlobalSettings {
    slippagePercentage: number;
    mevProtection: boolean;
    autoSlippage: boolean;
    transactionDeadline: number;
    preferredGasPrice: 'slow' | 'standard' | 'fast';
    notifications: {
        priceAlerts: boolean;
        transactionUpdates: boolean;
        portfolioChanges: boolean;
    };
}

export interface PendingTransaction {
    id: string;
    type: 'swap' | 'addLiquidity' | 'removeLiquidity' | 'wrap' | 'unwrap';
    fromToken: string;
    toToken: string;
    amount: string;
    quote?: any; // Optional for wrap/unwrap operations
    wrapQuote?: any; // For wrap/unwrap operations
    timestamp: number;
    expires: number;
    platformUser: PlatformUser;
    chatId?: number; // For Telegram
}

export interface UserSession {
    platformUser: PlatformUser;
    hasWallet: boolean;
    activeWalletId?: string;
    settings: GlobalSettings;
    pendingTransactions: Map<string, PendingTransaction>;
    lastActivity: number;
}

/**
 * SessionService - Manages user sessions, global settings, and transaction confirmations
 * Keeps everything in memory for fast access across all platforms
 */
export class SessionService {
    private static instance: SessionService;
    private sessions: Map<string, UserSession> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    private constructor() {
        // Clean up expired sessions every 30 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 30 * 60 * 1000);

        elizaLogger.info("🔄 SessionService initialized with in-memory global settings");
    }

    public static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    private createUserKey(platformUser: PlatformUser): string {
        return `${platformUser.platform}:${platformUser.platformUserId}`;
    }

    private createDefaultSettings(): GlobalSettings {
        return {
            slippagePercentage: 0.5,
            mevProtection: false, // 🔧 DISABLED: 9X API doesn't support MEV protection
            autoSlippage: false,
            transactionDeadline: 20,
            preferredGasPrice: 'standard',
            notifications: {
                priceAlerts: true,
                transactionUpdates: true,
                portfolioChanges: false
            }
        };
    }

    /**
     * Get or create user session
     */
    public async getSession(platformUser: PlatformUser, runtime?: IExtendedRuntime): Promise<UserSession> {
        const userKey = this.createUserKey(platformUser);
        
        if (!this.sessions.has(userKey)) {
            const session: UserSession = {
                platformUser,
                hasWallet: false,
                settings: this.createDefaultSettings(),
                pendingTransactions: new Map(),
                lastActivity: Date.now()
            };
            
            // 🔄 SYNC SETTINGS FROM WALLET: If user has a wallet, load their persisted settings
            if (runtime) {
                try {
                    const walletService = new WalletService(runtime);
                    const activeWallet = await walletService.getActiveWallet(platformUser);
                    
                    if (activeWallet && activeWallet.settings) {
                        // Merge wallet settings into session settings
                        session.settings = {
                            ...session.settings,
                            slippagePercentage: activeWallet.settings.slippagePercentage ?? session.settings.slippagePercentage,
                            mevProtection: activeWallet.settings.mevProtection ?? session.settings.mevProtection,
                            autoSlippage: activeWallet.settings.autoSlippage ?? session.settings.autoSlippage,
                            transactionDeadline: activeWallet.settings.transactionDeadline ?? session.settings.transactionDeadline,
                            preferredGasPrice: activeWallet.settings.preferredGasPrice ?? session.settings.preferredGasPrice,
                            notifications: {
                                ...session.settings.notifications,
                                ...activeWallet.settings.notifications
                            }
                        };
                        
                        session.hasWallet = true;
                        session.activeWalletId = activeWallet.id;
                        
                        elizaLogger.info(`🔄 Synced settings from wallet ${activeWallet.id} for ${platformUser.platform}:${platformUser.platformUserId} - slippage: ${session.settings.slippagePercentage}%`);
                    }
                } catch (error) {
                    // Don't fail session creation if wallet sync fails
                    elizaLogger.warn(`⚠️ Could not sync wallet settings for ${platformUser.platform}:${platformUser.platformUserId}:`, error);
                }
            }
            
            this.sessions.set(userKey, session);
            elizaLogger.info(`👤 Created new session for ${platformUser.platform} user ${platformUser.platformUserId}`);
        }

        const session = this.sessions.get(userKey)!;
        session.lastActivity = Date.now();
        return session;
    }

    /**
     * Update session when user creates/switches wallet
     */
    public async updateWalletStatus(platformUser: PlatformUser, hasWallet: boolean, activeWalletId?: string): Promise<void> {
        const session = await this.getSession(platformUser);
        session.hasWallet = hasWallet;
        session.activeWalletId = activeWalletId;
        
        elizaLogger.info(`💼 Updated wallet status for ${platformUser.platform}:${platformUser.platformUserId} - hasWallet: ${hasWallet}`);
    }

    /**
     * Check if user has a wallet
     */
    public async hasWallet(platformUser: PlatformUser): Promise<boolean> {
        const session = await this.getSession(platformUser);
        return session.hasWallet;
    }

    /**
     * Get user's global settings
     */
    public async getSettings(platformUser: PlatformUser): Promise<GlobalSettings> {
        const session = await this.getSession(platformUser);
        return { ...session.settings }; // Return copy to prevent mutation
    }

    /**
     * Update user's global settings
     */
    public async updateSettings(platformUser: PlatformUser, settings: Partial<GlobalSettings>): Promise<void> {
        const session = await this.getSession(platformUser);
        session.settings = { ...session.settings, ...settings };
        
        elizaLogger.info(`⚙️ Updated settings for ${platformUser.platform}:${platformUser.platformUserId}`);
    }

    /**
     * Create a pending transaction that requires confirmation
     * EDGE CASE FIX: Only allow 1 pending transaction per user
     */
    public async createPendingTransaction(
        platformUser: PlatformUser,
        type: PendingTransaction['type'],
        data: Omit<PendingTransaction, 'id' | 'timestamp' | 'expires' | 'platformUser'>
    ): Promise<string> {
        const session = await this.getSession(platformUser);
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = Date.now();
        
        // EDGE CASE FIX: Cancel any existing pending transactions
        if (session.pendingTransactions.size > 0) {
            const existingTxIds = Array.from(session.pendingTransactions.keys());
            session.pendingTransactions.clear();
            elizaLogger.info(`🔄 Cancelled ${existingTxIds.length} existing pending transactions for user ${platformUser.platform}:${platformUser.platformUserId}`);
        }
        
        const pendingTx: PendingTransaction = {
            id: transactionId,
            type,
            timestamp: now,
            expires: now + (5 * 60 * 1000), // 5 minutes
            platformUser,
            fromToken: data.fromToken,
            toToken: data.toToken,
            amount: data.amount,
            quote: data.quote ? JSON.parse(JSON.stringify(data.quote)) : undefined, // Deep clone quote
            wrapQuote: data.wrapQuote ? JSON.parse(JSON.stringify(data.wrapQuote)) : undefined, // Deep clone wrapQuote
            chatId: data.chatId
        };

        // 🔧 DEBUG: Log transaction storage details
        console.log('💾 SessionService storing transaction:', {
            transactionId,
            type,
            hasQuote: !!pendingTx.quote,
            quoteKeys: pendingTx.quote ? Object.keys(pendingTx.quote) : 'NO QUOTE',
            quoteDataExists: !!pendingTx.quote?.data,
            quoteDataLength: pendingTx.quote?.data?.length || 0,
            quoteToExists: !!pendingTx.quote?.to
        });
        
        session.pendingTransactions.set(transactionId, pendingTx);
        
        elizaLogger.info(`⏳ Created pending ${type} transaction ${transactionId} for user ${platformUser.platform}:${platformUser.platformUserId}`);
        return transactionId;
    }

    /**
     * Get a pending transaction by ID
     * EDGE CASE FIX: Better expiry handling with user feedback
     */
    public async getPendingTransaction(platformUser: PlatformUser, transactionId: string): Promise<PendingTransaction | null> {
        const session = await this.getSession(platformUser);
        const tx = session.pendingTransactions.get(transactionId);
        
        if (!tx) {
            return null;
        }

        // Check if expired
        if (Date.now() > tx.expires) {
            session.pendingTransactions.delete(transactionId);
            elizaLogger.info(`⏰ Expired transaction ${transactionId} removed`);
            return null;
        }

        return tx;
    }

    /**
     * Get most recent pending transaction (for handling ambiguous confirmations)
     */
    public async getMostRecentPendingTransaction(platformUser: PlatformUser): Promise<PendingTransaction | null> {
        const pendingTxs = await this.getPendingTransactions(platformUser);
        if (pendingTxs.length === 0) {
            return null;
        }
        
        // Return the most recently created transaction
        return pendingTxs.reduce((latest, current) => 
            current.timestamp > latest.timestamp ? current : latest
        );
    }

    /**
     * Check if transaction is expiring soon (within 1 minute)
     */
    public isTransactionExpiringSoon(transaction: PendingTransaction): boolean {
        const now = Date.now();
        const timeUntilExpiry = transaction.expires - now;
        return timeUntilExpiry <= 60000 && timeUntilExpiry > 0; // 1 minute
    }

    /**
     * Generate expiry warning message
     */
    public getExpiryWarningMessage(transaction: PendingTransaction): string {
        const now = Date.now();
        const timeUntilExpiry = Math.max(0, transaction.expires - now);
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        
        if (minutesLeft <= 1) {
            return `⚠️ **Transaction Expiring Soon!**

Your ${transaction.type} quote expires in less than 1 minute!

**Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
**Transaction ID:** \`${transaction.id}\`

**Quick decision needed:**
• Reply "yes" or "confirm" to execute NOW
• Reply "no" or "cancel" to cancel

After expiry, you'll need to request a new quote.`;
        }
        
        return `⏳ **Pending Transaction Reminder**

You have a ${transaction.type} waiting for confirmation.

**Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
**Expires in:** ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'}
**Transaction ID:** \`${transaction.id}\`

Reply "yes" to confirm or "no" to cancel.`;
    }

    /**
     * Confirm and remove a pending transaction
     */
    public async confirmTransaction(platformUser: PlatformUser, transactionId: string): Promise<PendingTransaction | null> {
        const session = await this.getSession(platformUser);
        const tx = session.pendingTransactions.get(transactionId);
        
        if (!tx || Date.now() > tx.expires) {
            session.pendingTransactions.delete(transactionId);
            return null;
        }

        session.pendingTransactions.delete(transactionId);
        
        // 🔧 DEBUG: Log transaction retrieval details
        console.log('📤 SessionService retrieving transaction:', {
            transactionId,
            type: tx.type,
            hasQuote: !!tx.quote,
            quoteKeys: tx.quote ? Object.keys(tx.quote) : 'NO QUOTE',
            quoteDataExists: !!tx.quote?.data,
            quoteDataLength: tx.quote?.data?.length || 0,
            quoteToExists: !!tx.quote?.to,
            quoteDataValue: tx.quote?.data ? `${tx.quote.data.substring(0, 20)}...` : 'NO DATA'
        });
        
        elizaLogger.info(`✅ Confirmed transaction ${transactionId} for user ${platformUser.platform}:${platformUser.platformUserId}`);
        return tx;
    }

    /**
     * Cancel a pending transaction
     */
    public async cancelTransaction(platformUser: PlatformUser, transactionId: string): Promise<boolean> {
        const session = await this.getSession(platformUser);
        const deleted = session.pendingTransactions.delete(transactionId);
        
        if (deleted) {
            elizaLogger.info(`❌ Cancelled transaction ${transactionId} for user ${platformUser.platform}:${platformUser.platformUserId}`);
        }

        return deleted;
    }

    /**
     * Get all pending transactions for a user
     */
    public async getPendingTransactions(platformUser: PlatformUser): Promise<PendingTransaction[]> {
        const session = await this.getSession(platformUser);
        const now = Date.now();
        const validTransactions: PendingTransaction[] = [];

        // Clean up expired transactions while collecting valid ones
        for (const [id, tx] of session.pendingTransactions.entries()) {
            if (now > tx.expires) {
                session.pendingTransactions.delete(id);
            } else {
                validTransactions.push(tx);
            }
        }

        return validTransactions;
    }

    /**
     * Generate wallet creation prompt
     */
    public getWalletRequiredMessage(): string {
        return `🚨 **Wallet Required**

You need to create a wallet before making transactions!

**Quick Setup:**
• "Create wallet" - Generate new secure wallet
• "Import wallet" - Use existing private key
• "Import from mnemonic" - Use seed phrase

**Security Features:**
• AES-256 encryption
• Platform isolation
• Multi-wallet support (up to 5)
• Private key protection

**After wallet creation:**
✅ All trading features unlocked
✅ Real transactions enabled
✅ Portfolio tracking active
✅ Price alerts available

Create your wallet now to get started! 🚀`;
    }

    /**
     * Clean up expired sessions and transactions
     */
    private cleanupExpiredSessions(): void {
        const now = Date.now();
        const expiredTime = 24 * 60 * 60 * 1000; // 24 hours
        let cleaned = 0;

        for (const [userKey, session] of this.sessions.entries()) {
            // Clean expired transactions
            for (const [txId, tx] of session.pendingTransactions.entries()) {
                if (now > tx.expires) {
                    session.pendingTransactions.delete(txId);
                }
            }

            // Remove inactive sessions
            if (now - session.lastActivity > expiredTime) {
                this.sessions.delete(userKey);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            elizaLogger.info(`🧹 Cleaned up ${cleaned} expired sessions`);
        }
    }

    /**
     * Get session statistics
     */
    public getStats(): {
        totalSessions: number;
        sessionsWithWallets: number;
        totalPendingTransactions: number;
        platforms: Record<string, number>;
    } {
        const stats = {
            totalSessions: this.sessions.size,
            sessionsWithWallets: 0,
            totalPendingTransactions: 0,
            platforms: {} as Record<string, number>
        };

        for (const session of this.sessions.values()) {
            if (session.hasWallet) {
                stats.sessionsWithWallets++;
            }
            
            stats.totalPendingTransactions += session.pendingTransactions.size;
            
            const platform = session.platformUser.platform;
            stats.platforms[platform] = (stats.platforms[platform] || 0) + 1;
        }

        return stats;
    }

    /**
     * Cleanup method for graceful shutdown
     */
    private cleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Clear all sessions
        const sessionCount = this.sessions.size;
        this.sessions.clear();
        
        elizaLogger.info(`🧹 SessionService cleanup complete - cleared ${sessionCount} sessions`);
    }

    /**
     * Cleanup when shutting down
     */
    public shutdown(): void {
        this.cleanup();
    }
}

export const sessionService = SessionService.getInstance(); 