import { ethers } from 'ethers';
import crypto from 'crypto';
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

// Platform-specific user identification
export interface PlatformUser {
    platform: 'telegram' | 'discord' | 'web' | 'api';
    platformUserId: string;
    platformUsername?: string;
    displayName?: string;
}

// Enhanced wallet interface for multi-platform support
export interface MultiPlatformWallet {
    id: string;
    name: string;
    address: string;
    encryptedPrivateKey: string;
    userPlatformId: string; // Combined platform:userId
    platform: string;
    platformUserId: string;
    platformUsername?: string;
    settings: WalletSettings;
    createdAt: Date;
    lastUsed: Date;
    isActive: boolean;
}

export interface WalletSettings {
    slippagePercentage: number;
    mevProtection: boolean;
    autoSlippage: boolean;
    transactionDeadline: number;
    preferredGasPrice?: 'slow' | 'standard' | 'fast';
    notifications: {
        priceAlerts: boolean;
        transactionUpdates: boolean;
        portfolioChanges: boolean;
    };
}

export class WalletService {
    private runtime: IAgentRuntime;
    private encryptionKey: string;
    private operationLocks: Map<string, Promise<any>> = new Map(); // Prevent concurrent operations

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        // Ensure we have a proper 32-byte (64-character hex) encryption key
        this.encryptionKey = this.initializeEncryptionKey();
        elizaLogger.info("💼 WalletService initialized with database backend");
    }

    private initializeEncryptionKey(): string {
        const envKey = process.env.WALLET_ENCRYPTION_KEY;
        
        if (envKey) {
            // If environment key exists, validate it's proper hex format
            if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
                elizaLogger.info("🔐 Using encryption key from environment");
                return envKey;
            } else {
                // Convert any string to a proper 32-byte hex key using SHA-256
                const hash = crypto.createHash('sha256').update(envKey).digest('hex');
                elizaLogger.info("🔐 Generated encryption key from environment string");
                return hash;
            }
        }
        
        // Generate a new random key
        const newKey = this.generateEncryptionKey();
        elizaLogger.info("🔐 Generated new random encryption key");
        return newKey;
    }

    private generateEncryptionKey(): string {
        return crypto.randomBytes(32).toString('hex');
    }

    private encrypt(data: string): string {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    }

    private decrypt(encryptedData: string): string {
        const parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        const iv = Buffer.from(parts[0]!, 'hex');
        const encrypted = parts[1]!;
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    private createUserPlatformId(platform: string, platformUserId: string): string {
        return `${platform}:${platformUserId}`;
    }

    /**
     * Create a new wallet for a platform user
     */
    async createWallet(
        platformUser: PlatformUser,
        name?: string,
        importPrivateKey?: string
    ): Promise<MultiPlatformWallet> {
        const userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
        
        // Check wallet limit (max 5 per user)
        const existingWallets = await this.getUserWallets(platformUser);
        if (existingWallets.length >= 5) {
            throw new Error(`Maximum 5 wallets allowed per user. Current: ${existingWallets.length}`);
        }

        // Generate or import wallet
        const wallet = importPrivateKey 
            ? new ethers.Wallet(importPrivateKey)
            : ethers.Wallet.createRandom();

        const walletName = name || `Wallet ${existingWallets.length + 1}`;
        const encryptedPrivateKey = this.encrypt(wallet.privateKey);

        const defaultSettings: WalletSettings = {
            slippagePercentage: 0.5,
            mevProtection: true,
            autoSlippage: false,
            transactionDeadline: 20,
            preferredGasPrice: 'standard',
            notifications: {
                priceAlerts: true,
                transactionUpdates: true,
                portfolioChanges: false
            }
        };

        const newWallet: MultiPlatformWallet = {
            id: `wallet_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
            name: walletName,
            address: wallet.address,
            encryptedPrivateKey,
            userPlatformId,
            platform: platformUser.platform,
            platformUserId: platformUser.platformUserId,
            platformUsername: platformUser.platformUsername,
            settings: defaultSettings,
            createdAt: new Date(),
            lastUsed: new Date(),
            isActive: existingWallets.length === 0 // First wallet is active by default
        };

        // Store in database
        await this.storeWallet(newWallet);

        elizaLogger.info(`✅ Created wallet "${walletName}" for ${platformUser.platform} user ${platformUser.platformUserId}`);
        
        return newWallet;
    }

    /**
     * Get all wallets for a platform user
     */
    async getUserWallets(platformUser: PlatformUser): Promise<MultiPlatformWallet[]> {
        const userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
        
        if (!this.runtime.databaseAdapter) {
            elizaLogger.warn("No database adapter available, falling back to empty wallet list");
            return [];
        }

        try {
            // Query wallets from database
            const wallets = await this.runtime.databaseAdapter.db.prepare(`
                SELECT * FROM wallets 
                WHERE userPlatformId = ? 
                ORDER BY createdAt ASC
            `).all(userPlatformId) as any[];

            return wallets.map(wallet => {
                let settings;
                try {
                    settings = JSON.parse(wallet.settings);
                } catch (error) {
                    elizaLogger.error(`Failed to parse wallet settings for wallet ${wallet.id}:`, error);
                    // Fallback to default settings
                    settings = {
                        slippagePercentage: 0.5,
                        mevProtection: true,
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
                
                return {
                    ...wallet,
                    settings,
                    createdAt: new Date(wallet.createdAt),
                    lastUsed: new Date(wallet.lastUsed),
                    isActive: Boolean(wallet.isActive)
                };
            });
        } catch (error) {
            elizaLogger.error("Error retrieving user wallets:", error);
            return [];
        }
    }

    /**
     * Get the active wallet for a platform user
     */
    async getActiveWallet(platformUser: PlatformUser): Promise<MultiPlatformWallet | null> {
        const wallets = await this.getUserWallets(platformUser);
        return wallets.find(wallet => wallet.isActive) || wallets[0] || null;
    }

    /**
     * Switch active wallet with database transaction for data consistency and race condition protection
     */
    async switchWallet(platformUser: PlatformUser, walletId: string): Promise<boolean> {
        const userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
        
        if (!this.runtime.databaseAdapter) {
            elizaLogger.warn("No database adapter available");
            return false;
        }

        // Prevent concurrent wallet operations for the same user
        const lockKey = `switchWallet_${userPlatformId}`;
        if (this.operationLocks.has(lockKey)) {
            elizaLogger.warn(`Wallet switch already in progress for user ${userPlatformId}`);
            return false;
        }

        const transaction = this.runtime.databaseAdapter.db.transaction(() => {
            try {
                // First verify the wallet exists and belongs to the user
                const walletExists = this.runtime.databaseAdapter!.db.prepare(`
                    SELECT id FROM wallets 
                    WHERE id = ? AND userPlatformId = ?
                `).get(walletId, userPlatformId);

                if (!walletExists) {
                    throw new Error(`Wallet ${walletId} not found for user ${userPlatformId}`);
                }

                // Deactivate all wallets for this user
                this.runtime.databaseAdapter!.db.prepare(`
                    UPDATE wallets 
                    SET isActive = 0 
                    WHERE userPlatformId = ?
                `).run(userPlatformId);

                // Activate the selected wallet
                const result = this.runtime.databaseAdapter!.db.prepare(`
                    UPDATE wallets 
                    SET isActive = 1, lastUsed = ? 
                    WHERE id = ? AND userPlatformId = ?
                `).run(new Date().toISOString(), walletId, userPlatformId);

                if (result.changes === 0) {
                    throw new Error(`Failed to activate wallet ${walletId}`);
                }

                return true;
            } catch (error) {
                elizaLogger.error("Transaction error in switchWallet:", error);
                throw error;
            }
        });

        const operationPromise = (async (): Promise<boolean> => {
            try {
                const success = transaction();
                if (success) {
                    elizaLogger.info(`🔄 Switched to wallet ${walletId} for ${platformUser.platform} user ${platformUser.platformUserId}`);
                }
                return success;
            } catch (error) {
                elizaLogger.error("Error switching wallet:", error);
                return false;
            }
        })();

        // Set the lock
        this.operationLocks.set(lockKey, operationPromise);

        try {
            const result = await operationPromise;
            return result;
        } finally {
            // Always cleanup the lock
            this.operationLocks.delete(lockKey);
        }
    }

    /**
     * Get decrypted private key for a wallet
     */
    async getWalletPrivateKey(platformUser: PlatformUser, walletId?: string): Promise<string | null> {
        const wallet = walletId 
            ? await this.getWalletById(platformUser, walletId)
            : await this.getActiveWallet(platformUser);

        if (!wallet) {
            return null;
        }

        try {
            return this.decrypt(wallet.encryptedPrivateKey);
        } catch (error) {
            elizaLogger.error("Error decrypting wallet private key:", error);
            return null;
        }
    }

    /**
     * Get wallet by ID (with ownership verification)
     */
    async getWalletById(platformUser: PlatformUser, walletId: string): Promise<MultiPlatformWallet | null> {
        const wallets = await this.getUserWallets(platformUser);
        return wallets.find(wallet => wallet.id === walletId) || null;
    }

    /**
     * Update wallet settings
     */
    async updateWalletSettings(
        platformUser: PlatformUser, 
        walletId: string, 
        settings: Partial<WalletSettings>
    ): Promise<boolean> {
        const wallet = await this.getWalletById(platformUser, walletId);
        if (!wallet) {
            return false;
        }

        const updatedSettings = { ...wallet.settings, ...settings };

        if (!this.runtime.databaseAdapter) {
            return false;
        }

        try {
            const result = await this.runtime.databaseAdapter.db.prepare(`
                UPDATE wallets 
                SET settings = ? 
                WHERE id = ? AND userPlatformId = ?
            `).run(
                JSON.stringify(updatedSettings),
                walletId,
                wallet.userPlatformId
            );

            return result.changes > 0;
        } catch (error) {
            elizaLogger.error("Error updating wallet settings:", error);
            return false;
        }
    }

    /**
     * Delete a wallet (with safety checks)
     */
    async deleteWallet(platformUser: PlatformUser, walletId: string): Promise<boolean> {
        const wallets = await this.getUserWallets(platformUser);
        const targetWallet = wallets.find(w => w.id === walletId);
        
        if (!targetWallet) {
            return false;
        }

        // Prevent deletion of the last wallet
        if (wallets.length === 1) {
            throw new Error("Cannot delete the last remaining wallet");
        }

        if (!this.runtime.databaseAdapter) {
            return false;
        }

        try {
            const result = await this.runtime.databaseAdapter.db.prepare(`
                DELETE FROM wallets 
                WHERE id = ? AND userPlatformId = ?
            `).run(walletId, targetWallet.userPlatformId);

            // If the deleted wallet was active, activate another one
            if (targetWallet.isActive && wallets.length > 1) {
                const nextWallet = wallets.find(w => w.id !== walletId);
                if (nextWallet) {
                    await this.switchWallet(platformUser, nextWallet.id);
                }
            }

            elizaLogger.info(`🗑️ Deleted wallet ${walletId} for ${platformUser.platform} user ${platformUser.platformUserId}`);
            return result.changes > 0;
        } catch (error) {
            elizaLogger.error("Error deleting wallet:", error);
            return false;
        }
    }

    /**
     * Import wallet from mnemonic phrase
     */
    async importWalletFromMnemonic(
        platformUser: PlatformUser,
        mnemonic: string,
        name?: string
    ): Promise<MultiPlatformWallet> {
        try {
            const wallet = ethers.Wallet.fromPhrase(mnemonic);
            return await this.createWallet(platformUser, name, wallet.privateKey);
        } catch (error) {
            throw new Error("Invalid mnemonic phrase");
        }
    }

    /**
     * Store wallet in database
     */
    private async storeWallet(wallet: MultiPlatformWallet): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            throw new Error("Database adapter not available");
        }

        try {
            await this.runtime.databaseAdapter.db.prepare(`
                INSERT INTO wallets (
                    id, name, address, encryptedPrivateKey, userPlatformId,
                    platform, platformUserId, platformUsername, settings,
                    createdAt, lastUsed, isActive
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                wallet.id,
                wallet.name,
                wallet.address,
                wallet.encryptedPrivateKey,
                wallet.userPlatformId,
                wallet.platform,
                wallet.platformUserId,
                wallet.platformUsername || null,
                JSON.stringify(wallet.settings),
                wallet.createdAt.toISOString(),
                wallet.lastUsed.toISOString(),
                wallet.isActive ? 1 : 0
            );
        } catch (error) {
            elizaLogger.error("Error storing wallet:", error);
            throw error;
        }
    }

    /**
     * Initialize database schema for wallets
     */
    async initializeDatabase(): Promise<void> {
        if (!this.runtime.databaseAdapter) {
            elizaLogger.warn("No database adapter available, skipping wallet schema initialization");
            return;
        }

        try {
            await this.runtime.databaseAdapter.db.exec(`
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

                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userPlatformId);
                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);
                CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(userPlatformId, isActive);
            `);

            elizaLogger.info("✅ Wallet database schema initialized");
        } catch (error) {
            elizaLogger.error("Error initializing wallet database schema:", error);
            throw error;
        }
    }

    /**
     * Get user summary across all platforms
     */
    async getUserSummary(platformUser: PlatformUser): Promise<{
        totalWallets: number;
        activeWallet?: MultiPlatformWallet;
        platforms: string[];
        createdAt: Date;
    }> {
        const wallets = await this.getUserWallets(platformUser);
        const activeWallet = wallets.find(w => w.isActive);
        const platforms = [...new Set(wallets.map(w => w.platform))];
        const createdAt = wallets.length > 0 ? new Date(Math.min(...wallets.map(w => w.createdAt.getTime()))) : new Date();

        return {
            totalWallets: wallets.length,
            activeWallet,
            platforms,
            createdAt
        };
    }
}

// Utility function to create platform user from runtime message
export function createPlatformUser(runtime: IAgentRuntime, message: any): PlatformUser {
    // Extract platform information from message context
    const platform = message.platform || 'web';
    
    // CRITICAL: Generate unique user ID if missing to prevent wallet collisions
    let platformUserId = message.userId || message.user?.id;
    
    if (!platformUserId) {
        // Generate unique ID based on message properties and timestamp
        const messageId = message.id || message.messageId || Date.now();
        const chatId = message.chatId || message.channelId || 'unknown';
        platformUserId = `anonymous_${platform}_${chatId}_${messageId}_${Math.random().toString(36).substr(2, 9)}`;
        elizaLogger.warn(`⚠️ Generated anonymous user ID: ${platformUserId} - Consider implementing proper user authentication`);
    }
    
    const platformUsername = message.user?.username || message.username;
    const displayName = message.user?.displayName || message.user?.name;

    return {
        platform: platform as 'telegram' | 'discord' | 'web' | 'api',
        platformUserId,
        platformUsername,
        displayName
    };
} 