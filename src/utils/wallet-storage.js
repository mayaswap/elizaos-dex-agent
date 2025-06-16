"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletStorage = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var url_1 = require("url");
var os_1 = require("os");
var __filename = (0, url_1.fileURLToPath)(import.meta.url);
var __dirname = path_1.default.dirname(__filename);
var WalletStorage = /** @class */ (function () {
    function WalletStorage() {
        // Default storage location: ~/.natural-language-dex/wallets/
        this.storageDir = path_1.default.join(os_1.default.homedir(), '.natural-language-dex', 'wallets');
        this.storageFile = path_1.default.join(this.storageDir, 'wallet-store.json');
        // Create directory if it doesn't exist
        this.ensureStorageDir();
        // Load existing wallets
        this.walletStore = this.loadWallets();
        console.log("\uD83D\uDCBE Wallet storage initialized at: ".concat(this.storageDir));
    }
    WalletStorage.getInstance = function () {
        if (!WalletStorage.instance) {
            WalletStorage.instance = new WalletStorage();
        }
        return WalletStorage.instance;
    };
    WalletStorage.prototype.ensureStorageDir = function () {
        if (!fs_1.default.existsSync(this.storageDir)) {
            fs_1.default.mkdirSync(this.storageDir, { recursive: true });
            console.log("\uD83D\uDCC1 Created wallet storage directory: ".concat(this.storageDir));
        }
    };
    WalletStorage.prototype.loadWallets = function () {
        try {
            if (fs_1.default.existsSync(this.storageFile)) {
                var data = fs_1.default.readFileSync(this.storageFile, 'utf-8');
                var store = JSON.parse(data);
                console.log("\u2705 Loaded ".concat(Object.keys(store.wallets).length, " wallets from storage"));
                return store;
            }
        }
        catch (error) {
            console.error('Error loading wallets:', error);
        }
        // Return empty store if file doesn't exist or error occurred
        return {
            wallets: {},
            activeWalletId: null,
            maxWallets: 3,
            version: '2.0.0'
        };
    };
    WalletStorage.prototype.saveWallets = function () {
        try {
            var data = JSON.stringify(this.walletStore, null, 2);
            fs_1.default.writeFileSync(this.storageFile, data, 'utf-8');
            // Also create a backup
            var backupFile = path_1.default.join(this.storageDir, "wallet-store-backup-".concat(Date.now(), ".json"));
            fs_1.default.writeFileSync(backupFile, data, 'utf-8');
            // Keep only last 5 backups
            this.cleanupOldBackups();
            console.log("\uD83D\uDCBE Wallets saved to: ".concat(this.storageFile));
        }
        catch (error) {
            console.error('Error saving wallets:', error);
        }
    };
    WalletStorage.prototype.cleanupOldBackups = function () {
        try {
            var files = fs_1.default.readdirSync(this.storageDir);
            var backupFiles = files
                .filter(function (f) { return f.startsWith('wallet-store-backup-'); })
                .sort()
                .reverse();
            // Remove old backups, keep only 5 most recent
            for (var i = 5; i < backupFiles.length; i++) {
                fs_1.default.unlinkSync(path_1.default.join(this.storageDir, backupFiles[i]));
            }
        }
        catch (error) {
            console.error('Error cleaning up backups:', error);
        }
    };
    WalletStorage.prototype.saveWallet = function (userId, wallet, name) {
        // Check wallet limit
        if (Object.keys(this.walletStore.wallets).length >= this.walletStore.maxWallets) {
            throw new Error("Maximum ".concat(this.walletStore.maxWallets, " wallets allowed"));
        }
        var walletId = "wallet_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var walletName = name || "Wallet ".concat(Object.keys(this.walletStore.wallets).length + 1);
        var defaultSettings = {
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
            userId: userId
        };
        // Set as active wallet if it's the first one
        if (!this.walletStore.activeWalletId) {
            this.walletStore.activeWalletId = walletId;
        }
        this.saveWallets();
        // Also create a separate file for this wallet (extra safety)
        var walletFile = path_1.default.join(this.storageDir, "wallet-".concat(walletId, "-").concat(wallet.address, ".json"));
        fs_1.default.writeFileSync(walletFile, JSON.stringify(__assign(__assign({}, this.walletStore.wallets[walletId]), { warning: "KEEP THIS FILE SAFE! This contains your private key. Never share it with anyone!" }), null, 2), 'utf-8');
        console.log("\u2705 Wallet \"".concat(walletName, "\" saved with ID ").concat(walletId, ": ").concat(wallet.address));
        console.log("\uD83D\uDCCD Individual wallet file: ".concat(walletFile));
        return walletId;
    };
    // Multi-wallet management methods
    WalletStorage.prototype.getWallet = function (walletId) {
        return this.walletStore.wallets[walletId] || null;
    };
    WalletStorage.prototype.getActiveWallet = function () {
        var activeId = this.walletStore.activeWalletId;
        if (!activeId)
            return null;
        return this.getWallet(activeId);
    };
    WalletStorage.prototype.getAllWallets = function () {
        return this.walletStore.wallets;
    };
    WalletStorage.prototype.getWalletList = function () {
        return Object.values(this.walletStore.wallets).map(function (wallet) { return ({
            id: wallet.id,
            name: wallet.name,
            address: wallet.address,
            lastUsed: wallet.lastUsed
        }); }).sort(function (a, b) { return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime(); });
    };
    WalletStorage.prototype.switchWallet = function (walletId) {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }
        this.walletStore.activeWalletId = walletId;
        this.walletStore.wallets[walletId].lastUsed = new Date().toISOString();
        this.saveWallets();
        console.log("\uD83D\uDD04 Switched to wallet: ".concat(this.walletStore.wallets[walletId].name));
        return true;
    };
    WalletStorage.prototype.renameWallet = function (walletId, newName) {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }
        this.walletStore.wallets[walletId].name = newName;
        this.saveWallets();
        console.log("\u270F\uFE0F Renamed wallet ".concat(walletId, " to: ").concat(newName));
        return true;
    };
    WalletStorage.prototype.deleteWallet = function (walletId) {
        if (!this.walletStore.wallets[walletId]) {
            return false;
        }
        // Can't delete the last wallet
        if (Object.keys(this.walletStore.wallets).length === 1) {
            throw new Error("Cannot delete the last remaining wallet");
        }
        var walletName = this.walletStore.wallets[walletId].name;
        delete this.walletStore.wallets[walletId];
        // If this was the active wallet, switch to another one
        if (this.walletStore.activeWalletId === walletId) {
            var remainingWallets = Object.keys(this.walletStore.wallets);
            this.walletStore.activeWalletId = remainingWallets[0] || null;
        }
        this.saveWallets();
        console.log("\uD83D\uDDD1\uFE0F Deleted wallet: ".concat(walletName));
        return true;
    };
    WalletStorage.prototype.getStorageLocation = function () {
        return this.storageDir;
    };
    // Per-wallet settings methods
    WalletStorage.prototype.getWalletSettings = function (walletId) {
        var targetWalletId = walletId || this.walletStore.activeWalletId;
        if (!targetWalletId || !this.walletStore.wallets[targetWalletId]) {
            return null;
        }
        return this.walletStore.wallets[targetWalletId].userSettings;
    };
    WalletStorage.prototype.saveWalletSettings = function (settings, walletId) {
        var targetWalletId = walletId || this.walletStore.activeWalletId;
        if (!targetWalletId || !this.walletStore.wallets[targetWalletId]) {
            return false;
        }
        this.walletStore.wallets[targetWalletId].userSettings = __assign(__assign({}, this.walletStore.wallets[targetWalletId].userSettings), settings);
        this.saveWallets();
        console.log("\u2699\uFE0F Settings updated for wallet \"".concat(this.walletStore.wallets[targetWalletId].name, "\":"), settings);
        return true;
    };
    // Backward compatibility - get first wallet for userId
    WalletStorage.prototype.getWalletByUserId = function (userId) {
        var wallet = Object.values(this.walletStore.wallets).find(function (w) { return w.userId === userId; });
        return wallet || null;
    };
    WalletStorage.prototype.getStorageInfo = function () {
        var wallets = Object.entries(this.walletStore.wallets).map(function (_a) {
            var userId = _a[0], wallet = _a[1];
            return ({
                userId: userId,
                address: wallet.address,
                created: new Date(wallet.createdAt)
            });
        });
        return {
            location: this.storageDir,
            mainFile: this.storageFile,
            walletCount: wallets.length,
            wallets: wallets
        };
    };
    return WalletStorage;
}());
exports.WalletStorage = WalletStorage;
