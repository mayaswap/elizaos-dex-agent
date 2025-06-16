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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
exports.createPlatformUser = createPlatformUser;
var ethers_1 = require("ethers");
var crypto_1 = require("crypto");
var core_1 = require("@elizaos/core");
var databaseAdapter_js_1 = require("./databaseAdapter.js");
var WalletService = /** @class */ (function () {
    function WalletService(runtime) {
        this.operationLocks = new Map(); // Prevent concurrent operations
        this.runtime = runtime;
        // Create unified adapter
        this.db = (0, databaseAdapter_js_1.createDatabaseAdapter)(runtime);
        // Ensure we have a proper 32-byte (64-character hex) encryption key
        this.encryptionKey = this.initializeEncryptionKey();
        core_1.elizaLogger.info("💼 WalletService initialized with database backend");
    }
    WalletService.prototype.initializeEncryptionKey = function () {
        var envKey = process.env.WALLET_ENCRYPTION_KEY;
        if (envKey) {
            // If environment key exists, validate it's proper hex format
            if (/^[0-9a-fA-F]{64}$/.test(envKey)) {
                core_1.elizaLogger.info("🔐 Using encryption key from environment");
                return envKey;
            }
            else {
                // Convert any string to a proper 32-byte hex key using SHA-256
                var hash = crypto_1.default.createHash('sha256').update(envKey).digest('hex');
                core_1.elizaLogger.info("🔐 Generated encryption key from environment string");
                return hash;
            }
        }
        // Generate a new random key
        var newKey = this.generateEncryptionKey();
        core_1.elizaLogger.info("🔐 Generated new random encryption key");
        return newKey;
    };
    WalletService.prototype.generateEncryptionKey = function () {
        return crypto_1.default.randomBytes(32).toString('hex');
    };
    WalletService.prototype.encrypt = function (data) {
        var iv = crypto_1.default.randomBytes(16);
        var cipher = crypto_1.default.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
        var encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return iv.toString('hex') + ':' + encrypted;
    };
    WalletService.prototype.decrypt = function (encryptedData) {
        var parts = encryptedData.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        var iv = Buffer.from(parts[0], 'hex');
        var encrypted = parts[1];
        var decipher = crypto_1.default.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey, 'hex'), iv);
        var decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    };
    WalletService.prototype.createUserPlatformId = function (platform, platformUserId) {
        return "".concat(platform, ":").concat(platformUserId);
    };
    /**
     * Create a new wallet for a platform user
     */
    WalletService.prototype.createWallet = function (platformUser, name, importPrivateKey) {
        return __awaiter(this, void 0, void 0, function () {
            var userPlatformId, existingWallets, wallet, walletName, encryptedPrivateKey, defaultSettings, newWallet;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
                        return [4 /*yield*/, this.getUserWallets(platformUser)];
                    case 1:
                        existingWallets = _a.sent();
                        if (existingWallets.length >= 5) {
                            throw new Error("Maximum 5 wallets allowed per user. Current: ".concat(existingWallets.length));
                        }
                        wallet = importPrivateKey
                            ? new ethers_1.ethers.Wallet(importPrivateKey)
                            : ethers_1.ethers.Wallet.createRandom();
                        walletName = name || "Wallet ".concat(existingWallets.length + 1);
                        encryptedPrivateKey = this.encrypt(wallet.privateKey);
                        defaultSettings = {
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
                        newWallet = {
                            id: "wallet_".concat(Date.now(), "_").concat(crypto_1.default.randomBytes(4).toString('hex')),
                            name: walletName,
                            address: wallet.address,
                            encryptedPrivateKey: encryptedPrivateKey,
                            userPlatformId: userPlatformId,
                            platform: platformUser.platform,
                            platformUserId: platformUser.platformUserId,
                            platformUsername: platformUser.platformUsername,
                            settings: defaultSettings,
                            createdAt: new Date(),
                            lastUsed: new Date(),
                            isActive: existingWallets.length === 0 // First wallet is active by default
                        };
                        // Store in database
                        return [4 /*yield*/, this.storeWallet(newWallet)];
                    case 2:
                        // Store in database
                        _a.sent();
                        core_1.elizaLogger.info("\u2705 Created wallet \"".concat(walletName, "\" for ").concat(platformUser.platform, " user ").concat(platformUser.platformUserId));
                        return [2 /*return*/, newWallet];
                }
            });
        });
    };
    /**
     * Get all wallets for a platform user
     */
    WalletService.prototype.getUserWallets = function (platformUser) {
        return __awaiter(this, void 0, void 0, function () {
            var userPlatformId, result, wallets, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("\n                SELECT * FROM wallets \n                WHERE userPlatformId = $1 \n                ORDER BY createdAt ASC\n            ", [userPlatformId])];
                    case 2:
                        result = _a.sent();
                        wallets = result.rows;
                        return [2 /*return*/, wallets.map(function (wallet) {
                                var settings;
                                try {
                                    settings = JSON.parse(wallet.settings);
                                }
                                catch (error) {
                                    core_1.elizaLogger.error("Failed to parse wallet settings for wallet ".concat(wallet.id, ":"), error);
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
                                return __assign(__assign({}, wallet), { settings: settings, createdAt: new Date(wallet.createdAt), lastUsed: new Date(wallet.lastUsed), isActive: Boolean(wallet.isActive) });
                            })];
                    case 3:
                        error_1 = _a.sent();
                        core_1.elizaLogger.error("Error retrieving user wallets:", error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the active wallet for a platform user
     */
    WalletService.prototype.getActiveWallet = function (platformUser) {
        return __awaiter(this, void 0, void 0, function () {
            var wallets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserWallets(platformUser)];
                    case 1:
                        wallets = _a.sent();
                        return [2 /*return*/, wallets.find(function (wallet) { return wallet.isActive; }) || wallets[0] || null];
                }
            });
        });
    };
    /**
     * Switch active wallet with database transaction for data consistency and race condition protection
     */
    WalletService.prototype.switchWallet = function (platformUser, walletId) {
        return __awaiter(this, void 0, void 0, function () {
            var userPlatformId, lockKey, operationPromise, result;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        userPlatformId = this.createUserPlatformId(platformUser.platform, platformUser.platformUserId);
                        lockKey = "switchWallet_".concat(userPlatformId);
                        if (this.operationLocks.has(lockKey)) {
                            core_1.elizaLogger.warn("Wallet switch already in progress for user ".concat(userPlatformId));
                            return [2 /*return*/, false];
                        }
                        operationPromise = (function () { return __awaiter(_this, void 0, void 0, function () {
                            var success, error_2;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, this.db.transaction(function () { return __awaiter(_this, void 0, void 0, function () {
                                                var walletExists, changes;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0: return [4 /*yield*/, this.db.queryOne("\n                        SELECT id FROM wallets \n                        WHERE id = $1 AND userPlatformId = $2\n                    ", [walletId, userPlatformId])];
                                                        case 1:
                                                            walletExists = _a.sent();
                                                            if (!walletExists) {
                                                                throw new Error("Wallet ".concat(walletId, " not found for user ").concat(userPlatformId));
                                                            }
                                                            // Deactivate all wallets for this user
                                                            return [4 /*yield*/, this.db.update("\n                        UPDATE wallets \n                        SET isActive = 0 \n                        WHERE userPlatformId = $1\n                    ", [userPlatformId])];
                                                        case 2:
                                                            // Deactivate all wallets for this user
                                                            _a.sent();
                                                            return [4 /*yield*/, this.db.update("\n                        UPDATE wallets \n                        SET isActive = 1, lastUsed = $1 \n                        WHERE id = $2 AND userPlatformId = $3\n                    ", [new Date().toISOString(), walletId, userPlatformId])];
                                                        case 3:
                                                            changes = _a.sent();
                                                            if (changes === 0) {
                                                                throw new Error("Failed to activate wallet ".concat(walletId));
                                                            }
                                                            return [2 /*return*/, true];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        success = _a.sent();
                                        if (success) {
                                            core_1.elizaLogger.info("\uD83D\uDD04 Switched to wallet ".concat(walletId, " for ").concat(platformUser.platform, " user ").concat(platformUser.platformUserId));
                                        }
                                        return [2 /*return*/, success];
                                    case 2:
                                        error_2 = _a.sent();
                                        core_1.elizaLogger.error("Error switching wallet:", error_2);
                                        return [2 /*return*/, false];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); })();
                        // Set the lock
                        this.operationLocks.set(lockKey, operationPromise);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, , 3, 4]);
                        return [4 /*yield*/, operationPromise];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result];
                    case 3:
                        // Always cleanup the lock
                        this.operationLocks.delete(lockKey);
                        return [7 /*endfinally*/];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get decrypted private key for a wallet
     */
    WalletService.prototype.getWalletPrivateKey = function (platformUser, walletId) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!walletId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.getWalletById(platformUser, walletId)];
                    case 1:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.getActiveWallet(platformUser)];
                    case 3:
                        _a = _b.sent();
                        _b.label = 4;
                    case 4:
                        wallet = _a;
                        if (!wallet) {
                            return [2 /*return*/, null];
                        }
                        try {
                            return [2 /*return*/, this.decrypt(wallet.encryptedPrivateKey)];
                        }
                        catch (error) {
                            core_1.elizaLogger.error("Error decrypting wallet private key:", error);
                            return [2 /*return*/, null];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get wallet by ID (with ownership verification)
     */
    WalletService.prototype.getWalletById = function (platformUser, walletId) {
        return __awaiter(this, void 0, void 0, function () {
            var wallets;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserWallets(platformUser)];
                    case 1:
                        wallets = _a.sent();
                        return [2 /*return*/, wallets.find(function (wallet) { return wallet.id === walletId; }) || null];
                }
            });
        });
    };
    /**
     * Update wallet settings
     */
    WalletService.prototype.updateWalletSettings = function (platformUser, walletId, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, updatedSettings, changes, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getWalletById(platformUser, walletId)];
                    case 1:
                        wallet = _a.sent();
                        if (!wallet) {
                            return [2 /*return*/, false];
                        }
                        updatedSettings = __assign(__assign({}, wallet.settings), settings);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.db.update("\n                UPDATE wallets \n                SET settings = $1 \n                WHERE id = $2 AND userPlatformId = $3\n            ", [
                                JSON.stringify(updatedSettings),
                                walletId,
                                wallet.userPlatformId
                            ])];
                    case 3:
                        changes = _a.sent();
                        return [2 /*return*/, changes > 0];
                    case 4:
                        error_3 = _a.sent();
                        core_1.elizaLogger.error("Error updating wallet settings:", error_3);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete a wallet (with safety checks)
     */
    WalletService.prototype.deleteWallet = function (platformUser, walletId) {
        return __awaiter(this, void 0, void 0, function () {
            var wallets, targetWallet, changes, nextWallet, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserWallets(platformUser)];
                    case 1:
                        wallets = _a.sent();
                        targetWallet = wallets.find(function (w) { return w.id === walletId; });
                        if (!targetWallet) {
                            return [2 /*return*/, false];
                        }
                        // Prevent deletion of the last wallet
                        if (wallets.length === 1) {
                            throw new Error("Cannot delete the last remaining wallet");
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 7]);
                        return [4 /*yield*/, this.db.update("\n                DELETE FROM wallets \n                WHERE id = $1 AND userPlatformId = $2\n            ", [walletId, targetWallet.userPlatformId])];
                    case 3:
                        changes = _a.sent();
                        if (!(targetWallet.isActive && wallets.length > 1)) return [3 /*break*/, 5];
                        nextWallet = wallets.find(function (w) { return w.id !== walletId; });
                        if (!nextWallet) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.switchWallet(platformUser, nextWallet.id)];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        core_1.elizaLogger.info("\uD83D\uDDD1\uFE0F Deleted wallet ".concat(walletId, " for ").concat(platformUser.platform, " user ").concat(platformUser.platformUserId));
                        return [2 /*return*/, changes > 0];
                    case 6:
                        error_4 = _a.sent();
                        core_1.elizaLogger.error("Error deleting wallet:", error_4);
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Import wallet from mnemonic phrase
     */
    WalletService.prototype.importWalletFromMnemonic = function (platformUser, mnemonic, name) {
        return __awaiter(this, void 0, void 0, function () {
            var wallet, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        wallet = ethers_1.ethers.Wallet.fromPhrase(mnemonic);
                        return [4 /*yield*/, this.createWallet(platformUser, name, wallet.privateKey)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_5 = _a.sent();
                        throw new Error("Invalid mnemonic phrase");
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Store wallet in database
     */
    WalletService.prototype.storeWallet = function (wallet) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db.insert("\n                INSERT INTO wallets (\n                    id, name, address, encryptedPrivateKey, userPlatformId,\n                    platform, platformUserId, platformUsername, settings,\n                    createdAt, lastUsed, isActive\n                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)\n            ", [
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
                            ])];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        core_1.elizaLogger.error("Error storing wallet:", error_6);
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Initialize database schema for wallets
     */
    WalletService.prototype.initializeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.db.execute("\n                CREATE TABLE IF NOT EXISTS wallets (\n                    id TEXT PRIMARY KEY,\n                    name TEXT NOT NULL,\n                    address TEXT NOT NULL,\n                    encryptedPrivateKey TEXT NOT NULL,\n                    userPlatformId TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    platformUserId TEXT NOT NULL,\n                    platformUsername TEXT,\n                    settings TEXT NOT NULL,\n                    createdAt TEXT NOT NULL,\n                    lastUsed TEXT NOT NULL,\n                    isActive INTEGER NOT NULL DEFAULT 0\n                );\n\n                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);\n                CREATE INDEX IF NOT EXISTS idx_wallets_active ON wallets(userPlatformId, isActive);\n            ")];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("✅ Wallet database schema initialized");
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        core_1.elizaLogger.error("Error initializing wallet database schema:", error_7);
                        throw error_7;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get user summary across all platforms
     */
    WalletService.prototype.getUserSummary = function (platformUser) {
        return __awaiter(this, void 0, void 0, function () {
            var wallets, activeWallet, platforms, createdAt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserWallets(platformUser)];
                    case 1:
                        wallets = _a.sent();
                        activeWallet = wallets.find(function (w) { return w.isActive; });
                        platforms = __spreadArray([], new Set(wallets.map(function (w) { return w.platform; })), true);
                        createdAt = wallets.length > 0 ? new Date(Math.min.apply(Math, wallets.map(function (w) { return w.createdAt.getTime(); }))) : new Date();
                        return [2 /*return*/, {
                                totalWallets: wallets.length,
                                activeWallet: activeWallet,
                                platforms: platforms,
                                createdAt: createdAt
                            }];
                }
            });
        });
    };
    return WalletService;
}());
exports.WalletService = WalletService;
// Utility function to create platform user from runtime message
function createPlatformUser(runtime, message) {
    var _a, _b, _c, _d;
    // Extract platform information from message context
    var platform = message.platform || 'web';
    // CRITICAL: Generate unique user ID if missing to prevent wallet collisions
    var platformUserId = message.userId || ((_a = message.user) === null || _a === void 0 ? void 0 : _a.id);
    if (!platformUserId) {
        // Generate unique ID based on message properties and timestamp
        var messageId = message.id || message.messageId || Date.now();
        var chatId = message.chatId || message.channelId || 'unknown';
        platformUserId = "anonymous_".concat(platform, "_").concat(chatId, "_").concat(messageId, "_").concat(Math.random().toString(36).substr(2, 9));
        core_1.elizaLogger.warn("\u26A0\uFE0F Generated anonymous user ID: ".concat(platformUserId, " - Consider implementing proper user authentication"));
    }
    var platformUsername = ((_b = message.user) === null || _b === void 0 ? void 0 : _b.username) || message.username;
    var displayName = ((_c = message.user) === null || _c === void 0 ? void 0 : _c.displayName) || ((_d = message.user) === null || _d === void 0 ? void 0 : _d.name);
    return {
        platform: platform,
        platformUserId: platformUserId,
        platformUsername: platformUsername,
        displayName: displayName
    };
}
