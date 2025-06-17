import { elizaLogger, IAgentRuntime, Memory } from '@elizaos/core';
import { createDatabaseAdapter, ElizaOSDatabaseAdapter } from './databaseAdapter.js';
import { IExtendedRuntime, IExtendedMemory } from '../types/extended.js';
import crypto from 'crypto';
import { ethers } from 'ethers';

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
    private db: ElizaOSDatabaseAdapter;
    private encryptionKey: string;
    private operationLocks: Map<string, Promise<any>> = new Map(); // Prevent concurrent operations

    constructor(runtime: IAgentRuntime) {
        this.runtime = runtime;
        
        // Create unified adapter
        this.db = createDatabaseAdapter(runtime);
        
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
     * Parse boolean field to handle different database types
     * PostgreSQL: true/false, 't'/'f', 1/0, '1'/'0', 'TRUE'/'FALSE'
     * SQLite: 1/0
     */
    private parseBooleanField(value: string | number | boolean | null | undefined): boolean {
        // Debug logging to understand what we're getting
        elizaLogger.info(`🔍 Parsing boolean field: value="${value}", type="${typeof value}"`);
        
        if (value === null || value === undefined) {
            return false;
        }
        
        if (typeof value === 'boolean') {
            return value;
        }
        
        if (typeof value === 'string') {
            const lowerValue = value.toLowerCase().trim();
            const result = lowerValue === 't' || lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes';
            elizaLogger.info(`🔍 String boolean conversion: "${value}" -> ${result}`);
            return result;
        }
        
        if (typeof value === 'number') {
            const result = value === 1;
            elizaLogger.info(`🔍 Number boolean conversion: ${value} -> ${result}`);
            return result;
        }
        
        elizaLogger.warn(`⚠️ Unknown boolean value type: ${typeof value}, value: ${value}`);
        return false;
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

        const isFirstWallet = existingWallets.length === 0;
        
        elizaLogger.info(`📊 Creating wallet: existingWallets.length = ${existingWallets.length}, isFirstWallet = ${isFirstWallet}`);

        // If this is not the first wallet, deactivate all existing wallets first
        if (!isFirstWallet) {
            elizaLogger.info(`🔄 Deactivating existing wallets for user ${userPlatformId}`);
            await this.db.update(`
                UPDATE wallets 
                SET isActive = 0 
                WHERE userplatformid = $1
            `, [userPlatformId]);
        }

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
            isActive: true // Always make new wallet active
        };

        // Store in database with isActive=true
        await this.storeWallet(newWallet);
        
        elizaLogger.info(`🎯 Created wallet "${walletName}" with isActive=true for ${platformUser.platform} user ${platformUser.platformUserId}`);

        elizaLogger.info(`✅ Created wallet "${walletName}" for ${platformUser.platform} user ${platformUser.platformUserId}`);
        
        return newWallet;
    }

    /**
     * Get all wallets for a platform user
     */
    async getUserWallets(platformUser: PlatformUser): Promise<MultiPlatformWallet[]> {
        const userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
        
        try {
            // Query wallets from database
            const result = await this.db.query(`
                SELECT * FROM wallets 
                WHERE userplatformid = $1 
                ORDER BY createdat ASC
            `, [userPlatformId]);
            const wallets = result.rows;

            return wallets.map(wallet => {
                elizaLogger.info(`🔍 Raw wallet from DB: id=${wallet.id}, keys=${Object.keys(wallet).join(',')}`);
                elizaLogger.info(`🔍 encryptedPrivateKey value: "${wallet.encryptedPrivateKey || wallet.encryptedprivatekey}" (type: ${typeof (wallet.encryptedPrivateKey || wallet.encryptedprivatekey)})`);
                
                let settings;
                try {
                    settings = JSON.parse(wallet.settings as string);
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
                    id: wallet.id as string,
                    name: wallet.name as string,
                    address: wallet.address as string,
                    encryptedPrivateKey: (wallet.encryptedPrivateKey || wallet.encryptedprivatekey) as string,
                    userPlatformId: (wallet.userPlatformId || wallet.userplatformid) as string,
                    platform: wallet.platform as string,
                    platformUserId: (wallet.platformUserId || wallet.platformuserid) as string,
                    platformUsername: (wallet.platformUsername || wallet.platformusername) as string | undefined,
                    settings,
                    createdAt: new Date((wallet.createdAt || wallet.createdat) as string | number | Date),
                    lastUsed: new Date((wallet.lastUsed || wallet.lastused) as string | number | Date),
                    isActive: this.parseBooleanField((wallet.isActive || wallet.isactive) as string | number | boolean)
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
        
        // NUCLEAR FIX: If no wallet shows as active but we have wallets, make the first one active
        const activeWallet = wallets.find(wallet => wallet.isActive);
        if (!activeWallet && wallets.length > 0) {
            elizaLogger.warn(`🚨 No active wallet found for user ${platformUser.platformUserId}, but ${wallets.length} wallets exist. Forcing first wallet as active.`);
            
            // Force the first wallet to be active in database
            await this.db.update(`
                UPDATE wallets 
                SET isActive = 1 
                WHERE id = $1
            `, [wallets[0].id]);
            
            // Mark it as active in the returned object too
            wallets[0].isActive = true;
            elizaLogger.info(`🎯 Force-activated wallet ${wallets[0].id} for user ${platformUser.platformUserId}`);
            return wallets[0];
        }
        
        return activeWallet || null;
    }

    /**
     * Switch active wallet with database transaction for data consistency and race condition protection
     */
    async switchWallet(platformUser: PlatformUser, walletId: string): Promise<boolean> {
        const userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
        
        // Prevent concurrent wallet operations for the same user
        const lockKey = `switchWallet_${userPlatformId}`;
        if (this.operationLocks.has(lockKey)) {
            elizaLogger.warn(`Wallet switch already in progress for user ${userPlatformId}`);
            return false;
        }

        const operationPromise = (async (): Promise<boolean> => {
            try {
                elizaLogger.info(`🔄 Starting wallet switch to ${walletId} for user ${userPlatformId}`);
                
                const success = await this.db.transaction(async () => {
                    // First verify the wallet exists and belongs to the user
                    const walletExists = await this.db.queryOne(`
                        SELECT id FROM wallets 
                        WHERE id = $1 AND userplatformid = $2
                    `, [walletId, userPlatformId]);

                    elizaLogger.info(`📋 Wallet exists check: ${walletExists ? 'YES' : 'NO'}`);

                    if (!walletExists) {
                        throw new Error(`Wallet ${walletId} not found for user ${userPlatformId}`);
                    }

                    // Deactivate all wallets for this user
                    const deactivatedCount = await this.db.update(`
                        UPDATE wallets 
                        SET isActive = 0 
                        WHERE userplatformid = $1
                    `, [userPlatformId]);

                    elizaLogger.info(`🔄 Deactivated ${deactivatedCount} wallets for user ${userPlatformId}`);

                    // Activate the selected wallet
                    const changes = await this.db.update(`
                        UPDATE wallets 
                        SET isActive = 1, lastUsed = $1 
                        WHERE id = $2 AND userplatformid = $3
                    `, [new Date().toISOString(), walletId, userPlatformId]);

                    elizaLogger.info(`✅ Activated wallet ${walletId}: ${changes} rows changed`);

                    if (changes === 0) {
                        throw new Error(`Failed to activate wallet ${walletId}`);
                    }

                    // Verify the change
                    const verifyWallet = await this.db.queryOne(`
                        SELECT id, isActive FROM wallets 
                        WHERE id = $1 AND userplatformid = $2
                    `, [walletId, userPlatformId]);

                    elizaLogger.info(`🔍 Verification - wallet ${walletId} isActive: ${verifyWallet?.isActive} (type: ${typeof verifyWallet?.isActive})`);

                    return true;
                });
                
                if (success) {
                    elizaLogger.info(`🎯 Successfully switched to wallet ${walletId} for ${platformUser.platform} user ${platformUser.platformUserId}`);
                }
                return success;
            } catch (error) {
                elizaLogger.error("❌ Error switching wallet:", error);
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
            elizaLogger.error("❌ No wallet found for getWalletPrivateKey");
            return null;
        }

        elizaLogger.info(`🔍 Wallet data: id=${wallet.id}, address=${wallet.address}, hasEncryptedKey=${!!wallet.encryptedPrivateKey}, keyLength=${wallet.encryptedPrivateKey?.length || 0}`);

        if (!wallet.encryptedPrivateKey) {
            elizaLogger.error("❌ Wallet found but encryptedPrivateKey is missing or null");
            return null;
        }

        try {
            return this.decrypt(wallet.encryptedPrivateKey);
        } catch (error) {
            elizaLogger.error("Error decrypting wallet private key:", error);
            elizaLogger.error("Encrypted key value:", wallet.encryptedPrivateKey);
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

        try {
            const changes = await this.db.update(`
                UPDATE wallets 
                SET settings = $1 
                WHERE id = $2 AND userplatformid = $3
            `, [
                JSON.stringify(updatedSettings),
                walletId,
                wallet.userPlatformId
            ]);

            return changes > 0;
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

        try {
            const changes = await this.db.update(`
                DELETE FROM wallets 
                WHERE id = $1 AND userplatformid = $2
            `, [walletId, targetWallet.userPlatformId]);

            // If the deleted wallet was active, activate another one
            if (targetWallet.isActive && wallets.length > 1) {
                const nextWallet = wallets.find(w => w.id !== walletId);
                if (nextWallet) {
                    await this.switchWallet(platformUser, nextWallet.id);
                }
            }

            elizaLogger.info(`🗑️ Deleted wallet ${walletId} for ${platformUser.platform} user ${platformUser.platformUserId}`);
            return changes > 0;
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
            const wallet = ethers.Wallet.fromMnemonic(mnemonic);
            return await this.createWallet(platformUser, name, wallet.privateKey);
        } catch (error) {
            throw new Error("Invalid mnemonic phrase");
        }
    }

    /**
     * Store wallet in database
     */
    private async storeWallet(wallet: MultiPlatformWallet): Promise<void> {
        try {
            await this.db.insert(`
                INSERT INTO wallets (
                    id, name, address, encryptedprivatekey, userplatformid,
                    platform, platformuserid, platformusername, settings,
                    createdat, lastused, isactive
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
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
            ]);
        } catch (error) {
            elizaLogger.error("Error storing wallet:", error);
            throw error;
        }
    }

    /**
     * Initialize database schema for wallets
     */
    async initializeDatabase(): Promise<void> {
        try {
            await this.db.execute(`
                CREATE TABLE IF NOT EXISTS wallets (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    address TEXT NOT NULL,
                    encryptedprivatekey TEXT NOT NULL,
                    userplatformid TEXT NOT NULL,
                    platform TEXT NOT NULL,
                    platformuserid TEXT NOT NULL,
                    platformusername TEXT,
                    settings TEXT NOT NULL,
                    createdat TEXT NOT NULL,
                    lastused TEXT NOT NULL,
                    isactive BOOLEAN NOT NULL DEFAULT FALSE
                );

                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userplatformid);
                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);
                CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(userplatformid, isactive);
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
        
        // Use the nuclear fix from getActiveWallet to ensure we have an active wallet
        const activeWallet = await this.getActiveWallet(platformUser);
        
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
export function createPlatformUser(runtime: IExtendedRuntime, message: IExtendedMemory): PlatformUser {
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