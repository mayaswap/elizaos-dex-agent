import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced wallet storage interface for multi-wallet support
export interface UserSettings {
    slippagePercentage: number;
    mevProtection: boolean;
    autoSlippage: boolean;
    transactionDeadline: number; // minutes
}

export interface StoredWallet {
    id: string; // Unique wallet ID
    name: string; // User-defined wallet name
    address: string;
    privateKey: string;
    userSettings: UserSettings; // Each wallet has its own settings
    createdAt: string;
    lastUsed: string;
    userId: string; // For backward compatibility
}

interface WalletStore {
    wallets: Record<string, StoredWallet>; // walletId -> StoredWallet
    activeWalletId: string | null;
    maxWallets: number;
    version: string;
}

export class WalletStorage {
    private static instance: WalletStorage;
    private storageDir: string;
    private storageFile: string;
    private walletStore: WalletStore;

    private constructor() {
        // Default storage location: ~/.natural-language-dex/wallets/
        this.storageDir = path.join(os.homedir(), '.natural-language-dex', 'wallets');
        this.storageFile = path.join(this.storageDir, 'wallet-store.json');
        
        // Create directory if it doesn't exist
        this.ensureStorageDir();
        
        // Load existing wallets
        this.walletStore = this.loadWallets();
        
        console.log(`💾 Wallet storage initialized at: ${this.storageDir}`);
    }

    static getInstance(): WalletStorage {
        if (!WalletStorage.instance) {
            WalletStorage.instance = new WalletStorage();
        }
        return WalletStorage.instance;
    }

    private ensureStorageDir(): void {
        if (!fs.existsSync(this.storageDir)) {
            fs.mkdirSync(this.storageDir, { recursive: true });
            console.log(`📁 Created wallet storage directory: ${this.storageDir}`);
        }
    }

    private loadWallets(): WalletStore {
        try {
            if (fs.existsSync(this.storageFile)) {
                const data = fs.readFileSync(this.storageFile, 'utf-8');
                const store = JSON.parse(data) as WalletStore;
                console.log(`✅ Loaded ${Object.keys(store.wallets).length} wallets from storage`);
                return store;
            }
        } catch (error) {
            console.error('Error loading wallets:', error);
        }
        
        // Return empty store if file doesn't exist or error occurred
        return {
            wallets: {},
            activeWalletId: null,
            maxWallets: 3,
            version: '2.0.0'
        };
    }

    private saveWallets(): void {
        try {
            const data = JSON.stringify(this.walletStore, null, 2);
            fs.writeFileSync(this.storageFile, data, 'utf-8');
            
            // Also create a backup
            const backupFile = path.join(this.storageDir, `wallet-store-backup-${Date.now()}.json`);
            fs.writeFileSync(backupFile, data, 'utf-8');
            
            // Keep only last 5 backups
            this.cleanupOldBackups();
            
            console.log(`💾 Wallets saved to: ${this.storageFile}`);
        } catch (error) {
            console.error('Error saving wallets:', error);
        }
    }

    private cleanupOldBackups(): void {
        try {
            const files = fs.readdirSync(this.storageDir);
            const backupFiles = files
                .filter(f => f.startsWith('wallet-store-backup-'))
                .sort()
                .reverse();
            
            // Remove old backups, keep only 5 most recent
            for (let i = 5; i < backupFiles.length; i++) {
                fs.unlinkSync(path.join(this.storageDir, backupFiles[i]));
            }
        } catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    }

    saveWallet(userId: string, wallet: { address: string; privateKey: string }, name?: string): string {
        // Check wallet limit
        if (Object.keys(this.walletStore.wallets).length >= this.walletStore.maxWallets) {
            throw new Error(`Maximum ${this.walletStore.maxWallets} wallets allowed`);
        }

        const walletId = `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const walletName = name || `Wallet ${Object.keys(this.walletStore.wallets).length + 1}`;
        
        const defaultSettings: UserSettings = {
            slippagePercentage: 0.5,
            mevProtection: true,
            autoSlippage: false,
            transactionDeadline: 20
        };

        this.walletStore.wallets[walletId] = {
            id: walletId,
            name: walletName,
            address: wallet.address,
            privateKey: wallet.privateKey,
            userSettings: defaultSettings,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
            userId
        };

        // Set as active wallet if it's the first one
        if (!this.walletStore.activeWalletId) {
            this.walletStore.activeWalletId = walletId;
        }
        
        this.saveWallets();
        
        // Also create a separate file for this wallet (extra safety)
        const walletFile = path.join(this.storageDir, `wallet-${walletId}-${wallet.address}.json`);
        fs.writeFileSync(walletFile, JSON.stringify({
            ...this.walletStore.wallets[walletId],
            warning: "KEEP THIS FILE SAFE! This contains your private key. Never share it with anyone!"
        }, null, 2), 'utf-8');
        
        console.log(`✅ Wallet "${walletName}" saved with ID ${walletId}: ${wallet.address}`);
        console.log(`📍 Individual wallet file: ${walletFile}`);
        
        return walletId;
    }

    // Multi-wallet management methods
    getWallet(walletId: string): StoredWallet | null {
        return this.walletStore.wallets[walletId] || null;
    }

    getActiveWallet(): StoredWallet | null {
        if (!this.walletStore.activeWalletId) return null;
        return this.getWallet(this.walletStore.activeWalletId);
    }

    getAllWallets(): Record<string, StoredWallet> {
        return this.walletStore.wallets;
    }

    getWalletList(): Array<{ id: string; name: string; address: string; lastUsed: string }> {
        return Object.values(this.walletStore.wallets).map(wallet => ({
            id: wallet.id,
            name: wallet.name,
            address: wallet.address,
            lastUsed: wallet.lastUsed
        })).sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
    }

    switchWallet(walletId: string): boolean {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }
        
        this.walletStore.activeWalletId = walletId;
        this.walletStore.wallets[walletId].lastUsed = new Date().toISOString();
        this.saveWallets();
        
        console.log(`🔄 Switched to wallet: ${this.walletStore.wallets[walletId].name}`);
        return true;
    }

    renameWallet(walletId: string, newName: string): boolean {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }
        
        this.walletStore.wallets[walletId].name = newName;
        this.saveWallets();
        
        console.log(`✏️ Renamed wallet ${walletId} to: ${newName}`);
        return true;
    }

    deleteWallet(walletId: string): boolean {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }

        // Can't delete the last wallet
        if (Object.keys(this.walletStore.wallets).length === 1) {
            throw new Error("Cannot delete the last remaining wallet");
        }

        const walletName = this.walletStore.wallets[walletId].name;
        delete this.walletStore.wallets[walletId];

        // If this was the active wallet, switch to another one
        if (this.walletStore.activeWalletId === walletId) {
            const remainingWallets = Object.keys(this.walletStore.wallets);
            this.walletStore.activeWalletId = remainingWallets[0] || null;
        }

        this.saveWallets();
        console.log(`🗑️ Deleted wallet: ${walletName}`);
        return true;
    }

    getStorageLocation(): string {
        return this.storageDir;
    }

    // Per-wallet settings methods
    getWalletSettings(walletId?: string): UserSettings | null {
        const targetWalletId = walletId || this.walletStore.activeWalletId;
        if (!targetWalletId || !this.walletStore.wallets[targetWalletId]) {
            return null;
        }
        return this.walletStore.wallets[targetWalletId].userSettings;
    }

    saveWalletSettings(settings: Partial<UserSettings>, walletId?: string): boolean {
        const targetWalletId = walletId || this.walletStore.activeWalletId;
        if (!targetWalletId || !this.walletStore.wallets[targetWalletId]) {
            return false;
        }

        this.walletStore.wallets[targetWalletId].userSettings = {
            ...this.walletStore.wallets[targetWalletId].userSettings,
            ...settings
        };
        
        this.saveWallets();
        console.log(`⚙️ Settings updated for wallet "${this.walletStore.wallets[targetWalletId].name}":`, settings);
        return true;
    }

    // Backward compatibility - get first wallet for userId
    getWalletByUserId(userId: string): StoredWallet | null {
        const wallet = Object.values(this.walletStore.wallets).find(w => w.userId === userId);
        return wallet || null;
    }

    getStorageInfo(): {
        location: string;
        mainFile: string;
        walletCount: number;
        wallets: Array<{ userId: string; address: string; created: Date }>;
    } {
        const wallets = Object.entries(this.walletStore.wallets).map(([userId, wallet]) => ({
            userId,
            address: wallet.address,
            created: new Date(wallet.createdAt)
        }));

        return {
            location: this.storageDir,
            mainFile: this.storageFile,
            walletCount: wallets.length,
            wallets
        };
    }
} 