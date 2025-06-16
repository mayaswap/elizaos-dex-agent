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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
var core_1 = require("@elizaos/core");
var databaseAdapter_js_1 = require("./databaseAdapter.js");
var DatabaseService = /** @class */ (function () {
    function DatabaseService(runtime) {
        this.runtime = runtime;
        // Create unified adapter
        this.db = (0, databaseAdapter_js_1.createDatabaseAdapter)(runtime);
        core_1.elizaLogger.info("📊 DatabaseService initialized with unified adapter");
    }
    /**
     * Initialize all database schemas
     */
    DatabaseService.prototype.initializeDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        // Create tables with proper PostgreSQL/SQLite compatibility
                        return [4 /*yield*/, this.db.execute("\n                -- Wallets table\n                CREATE TABLE IF NOT EXISTS wallets (\n                    id TEXT PRIMARY KEY,\n                    name TEXT NOT NULL,\n                    address TEXT NOT NULL,\n                    encryptedPrivateKey TEXT NOT NULL,\n                    userPlatformId TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    platformUserId TEXT NOT NULL,\n                    platformUsername TEXT,\n                    settings TEXT NOT NULL,\n                    createdAt TEXT NOT NULL,\n                    lastUsed TEXT NOT NULL,\n                    isActive INTEGER NOT NULL DEFAULT 0\n                );\n\n                -- Trading history table\n                CREATE TABLE IF NOT EXISTS trading_history (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    walletId TEXT NOT NULL,\n                    transactionHash TEXT,\n                    fromToken TEXT NOT NULL,\n                    toToken TEXT NOT NULL,\n                    amountIn TEXT NOT NULL,\n                    amountOut TEXT NOT NULL,\n                    priceImpact REAL,\n                    slippageUsed REAL,\n                    gasUsed TEXT,\n                    gasCost TEXT,\n                    success INTEGER NOT NULL,\n                    timestamp TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    dexUsed TEXT,\n                    notes TEXT\n                );\n\n                -- Price alerts table\n                CREATE TABLE IF NOT EXISTS price_alerts (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    tokenSymbol TEXT NOT NULL,\n                    targetPrice REAL NOT NULL,\n                    isAbove INTEGER NOT NULL,\n                    isActive INTEGER DEFAULT 1,\n                    triggeredAt TEXT,\n                    createdAt TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    alertMessage TEXT\n                );\n\n                -- Portfolio snapshots table\n                CREATE TABLE IF NOT EXISTS portfolio_snapshots (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    walletId TEXT NOT NULL,\n                    tokenBalances TEXT NOT NULL,\n                    tokenPricesUSD TEXT NOT NULL,\n                    totalValueUSD REAL NOT NULL,\n                    timestamp TEXT NOT NULL,\n                    chain TEXT NOT NULL DEFAULT 'pulsechain'\n                );\n\n                -- User preferences table\n                CREATE TABLE IF NOT EXISTS user_preferences (\n                    userPlatformId TEXT PRIMARY KEY,\n                    preferredTokens TEXT NOT NULL,\n                    riskTolerance TEXT DEFAULT 'moderate',\n                    tradingStyle TEXT DEFAULT 'mixed',\n                    educationProgress TEXT NOT NULL,\n                    notificationSettings TEXT NOT NULL,\n                    tradingHours TEXT NOT NULL,\n                    language TEXT DEFAULT 'en',\n                    autoSlippageMax REAL DEFAULT 5.0,\n                    defaultGasSpeed TEXT DEFAULT 'standard',\n                    lastActiveAt TEXT NOT NULL\n                );\n\n                -- Token watchlists table\n                CREATE TABLE IF NOT EXISTS token_watchlists (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    name TEXT NOT NULL,\n                    tokenSymbols TEXT NOT NULL,\n                    description TEXT,\n                    createdAt TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    isDefault INTEGER DEFAULT 0\n                );\n\n                -- Education progress table\n                CREATE TABLE IF NOT EXISTS education_progress (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    topicId TEXT NOT NULL,\n                    topicName TEXT NOT NULL,\n                    completed INTEGER DEFAULT 0,\n                    score INTEGER,\n                    timeSpent INTEGER,\n                    completedAt TEXT,\n                    platform TEXT NOT NULL,\n                    attempts INTEGER DEFAULT 0\n                );\n\n                -- Performance metrics table\n                CREATE TABLE IF NOT EXISTS performance_metrics (\n                    id TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    walletId TEXT NOT NULL,\n                    period TEXT NOT NULL,\n                    totalTrades INTEGER DEFAULT 0,\n                    successfulTrades INTEGER DEFAULT 0,\n                    totalVolume TEXT DEFAULT '0',\n                    totalFees TEXT DEFAULT '0',\n                    totalProfit TEXT DEFAULT '0',\n                    averageSlippage REAL DEFAULT 0,\n                    averageGasCost TEXT DEFAULT '0',\n                    bestTrade TEXT,\n                    worstTrade TEXT,\n                    favoriteTokens TEXT NOT NULL,\n                    calculatedAt TEXT NOT NULL\n                );\n\n                -- User sessions table\n                CREATE TABLE IF NOT EXISTS user_sessions (\n                    sessionId TEXT PRIMARY KEY,\n                    userPlatformId TEXT NOT NULL,\n                    platform TEXT NOT NULL,\n                    ipAddress TEXT,\n                    userAgent TEXT,\n                    createdAt TEXT NOT NULL,\n                    lastActiveAt TEXT NOT NULL,\n                    isActive INTEGER DEFAULT 1,\n                    activityCount INTEGER DEFAULT 0\n                );\n\n                -- Token registry table\n                CREATE TABLE IF NOT EXISTS token_registry (\n                    id TEXT PRIMARY KEY,\n                    symbol TEXT NOT NULL,\n                    name TEXT NOT NULL,\n                    address TEXT NOT NULL,\n                    decimals INTEGER DEFAULT 18,\n                    variations TEXT NOT NULL,\n                    chain TEXT NOT NULL DEFAULT 'pulsechain',\n                    isActive INTEGER DEFAULT 1,\n                    addedAt TEXT NOT NULL,\n                    updatedAt TEXT NOT NULL\n                );\n            ")];
                    case 1:
                        // Create tables with proper PostgreSQL/SQLite compatibility
                        _a.sent();
                        // Create indexes for performance
                        return [4 /*yield*/, this.db.execute("\n                CREATE INDEX IF NOT EXISTS idx_wallets_userPlatformId ON wallets(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_wallets_platform ON wallets(platform);\n                CREATE INDEX IF NOT EXISTS idx_trading_history_user ON trading_history(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_trading_history_wallet ON trading_history(walletId);\n                CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(isActive, tokenSymbol);\n                CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio_snapshots(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_watchlists_user ON token_watchlists(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_education_user ON education_progress(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_performance_user ON performance_metrics(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(userPlatformId);\n                CREATE INDEX IF NOT EXISTS idx_token_registry_symbol ON token_registry(symbol);\n            ")];
                    case 2:
                        // Create indexes for performance
                        _a.sent();
                        core_1.elizaLogger.info("✅ Complete database schema initialized with all tables and indexes");
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        core_1.elizaLogger.error("Error initializing database schema:", error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Trading History Methods
    DatabaseService.prototype.recordTrade = function (trade) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = "trade_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        return [4 /*yield*/, this.db.insert("\n            INSERT INTO trading_history (\n                id, userPlatformId, walletId, transactionHash, fromToken, toToken,\n                amountIn, amountOut, priceImpact, slippageUsed, gasUsed, gasCost,\n                success, timestamp, platform, dexUsed, notes\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)\n        ", [
                                id, trade.userPlatformId, trade.walletId, trade.transactionHash || null,
                                trade.fromToken, trade.toToken, trade.amountIn, trade.amountOut,
                                trade.priceImpact || null, trade.slippageUsed || null,
                                trade.gasUsed || null, trade.gasCost || null,
                                trade.success ? 1 : 0, trade.timestamp, trade.platform,
                                trade.dexUsed || null, trade.notes || null
                            ])];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("\uD83D\uDCCA Recorded trade: ".concat(trade.fromToken, " \u2192 ").concat(trade.toToken));
                        return [2 /*return*/, id];
                }
            });
        });
    };
    DatabaseService.prototype.getTradingHistory = function (userPlatformId_1) {
        return __awaiter(this, arguments, void 0, function (userPlatformId, limit) {
            var result;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("\n            SELECT * FROM trading_history \n            WHERE userPlatformId = $1 \n            ORDER BY timestamp DESC \n            LIMIT $2\n        ", [userPlatformId, limit])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (trade) { return (__assign(__assign({}, trade), { success: Boolean(trade.success) })); })];
                }
            });
        });
    };
    // Price Alerts Methods
    DatabaseService.prototype.createPriceAlert = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = "alert_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        return [4 /*yield*/, this.db.insert("\n            INSERT INTO price_alerts (\n                id, userPlatformId, tokenSymbol, targetPrice, isAbove,\n                isActive, createdAt, platform, alertMessage\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\n        ", [
                                id, alert.userPlatformId, alert.tokenSymbol, alert.targetPrice,
                                alert.isAbove ? 1 : 0, alert.isActive ? 1 : 0,
                                alert.createdAt, alert.platform, alert.alertMessage || null
                            ])];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("\uD83D\uDD14 Created price alert: ".concat(alert.tokenSymbol, " ").concat(alert.isAbove ? 'above' : 'below', " $").concat(alert.targetPrice));
                        return [2 /*return*/, id];
                }
            });
        });
    };
    DatabaseService.prototype.getActivePriceAlerts = function (userPlatformId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = userPlatformId
                            ? "SELECT * FROM price_alerts WHERE userPlatformId = $1 AND isActive = 1"
                            : "SELECT * FROM price_alerts WHERE isActive = 1";
                        params = userPlatformId ? [userPlatformId] : [];
                        return [4 /*yield*/, this.db.query(query, params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (alert) { return (__assign(__assign({}, alert), { isAbove: Boolean(alert.isAbove), isActive: Boolean(alert.isActive) })); })];
                }
            });
        });
    };
    // Portfolio Methods
    DatabaseService.prototype.savePortfolioSnapshot = function (snapshot) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = "portfolio_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        return [4 /*yield*/, this.db.insert("\n            INSERT INTO portfolio_snapshots (\n                id, userPlatformId, walletId, tokenBalances, tokenPricesUSD,\n                totalValueUSD, timestamp, chain\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n        ", [
                                id, snapshot.userPlatformId, snapshot.walletId,
                                JSON.stringify(snapshot.tokenBalances),
                                JSON.stringify(snapshot.tokenPricesUSD),
                                snapshot.totalValueUSD, snapshot.timestamp, snapshot.chain
                            ])];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("\uD83D\uDCC8 Saved portfolio snapshot for wallet ".concat(snapshot.walletId));
                        return [2 /*return*/, id];
                }
            });
        });
    };
    // Watchlist Methods
    DatabaseService.prototype.createWatchlist = function (watchlist) {
        return __awaiter(this, void 0, void 0, function () {
            var id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = "watchlist_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        return [4 /*yield*/, this.db.insert("\n            INSERT INTO token_watchlists (\n                id, userPlatformId, name, tokenSymbols, description,\n                createdAt, platform, isDefault\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n        ", [
                                id, watchlist.userPlatformId, watchlist.name,
                                JSON.stringify(watchlist.tokenSymbols),
                                watchlist.description || null,
                                watchlist.createdAt, watchlist.platform,
                                watchlist.isDefault ? 1 : 0
                            ])];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("\uD83D\uDCCB Created watchlist: ".concat(watchlist.name));
                        return [2 /*return*/, id];
                }
            });
        });
    };
    DatabaseService.prototype.getUserWatchlists = function (userPlatformId) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("\n            SELECT * FROM token_watchlists \n            WHERE userPlatformId = $1 \n            ORDER BY isDefault DESC, createdAt ASC\n        ", [userPlatformId])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (w) {
                                try {
                                    return __assign(__assign({}, w), { tokenSymbols: JSON.parse(w.tokenSymbols), isDefault: Boolean(w.isDefault) });
                                }
                                catch (error) {
                                    core_1.elizaLogger.error("Failed to parse watchlist tokens for watchlist ".concat(w.id, ":"), error);
                                    // Return with empty token list as fallback
                                    return __assign(__assign({}, w), { tokenSymbols: [], isDefault: Boolean(w.isDefault) });
                                }
                            })];
                }
            });
        });
    };
    // Token Registry Methods
    DatabaseService.prototype.addToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        id = "token_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                        now = new Date().toISOString();
                        return [4 /*yield*/, this.db.insert("\n            INSERT INTO token_registry (\n                id, symbol, name, address, decimals, variations,\n                chain, isActive, addedAt, updatedAt\n            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)\n        ", [
                                id, token.symbol, token.name, token.address,
                                token.decimals || 18, JSON.stringify(token.variations),
                                token.chain || 'pulsechain', 1, now, now
                            ])];
                    case 1:
                        _a.sent();
                        core_1.elizaLogger.info("\uD83E\uDE99 Added token to registry: ".concat(token.symbol, " (").concat(token.name, ")"));
                        return [2 /*return*/, id];
                }
            });
        });
    };
    DatabaseService.prototype.getToken = function (symbol) {
        return __awaiter(this, void 0, void 0, function () {
            var result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.queryOne("\n            SELECT * FROM token_registry \n            WHERE symbol = $1 AND isActive = 1\n        ", [symbol])];
                    case 1:
                        result = _a.sent();
                        if (!result)
                            return [2 /*return*/, null];
                        return [2 /*return*/, __assign(__assign({}, result), { variations: JSON.parse(result.variations), isActive: Boolean(result.isActive) })];
                }
            });
        });
    };
    DatabaseService.prototype.getAllTokens = function () {
        return __awaiter(this, arguments, void 0, function (chain) {
            var result;
            if (chain === void 0) { chain = 'pulsechain'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.db.query("\n            SELECT * FROM token_registry \n            WHERE chain = $1 AND isActive = 1\n            ORDER BY symbol ASC\n        ", [chain])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (token) { return (__assign(__assign({}, token), { variations: JSON.parse(token.variations), isActive: Boolean(token.isActive) })); })];
                }
            });
        });
    };
    DatabaseService.prototype.searchTokens = function (query) {
        return __awaiter(this, void 0, void 0, function () {
            var searchPattern, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        searchPattern = "%".concat(query.toLowerCase(), "%");
                        return [4 /*yield*/, this.db.query("\n            SELECT * FROM token_registry \n            WHERE (LOWER(symbol) LIKE $1 OR LOWER(name) LIKE $2 OR LOWER(variations) LIKE $3)\n            AND isActive = 1\n            ORDER BY \n                CASE \n                    WHEN LOWER(symbol) = $4 THEN 1\n                    WHEN LOWER(symbol) LIKE $5 THEN 2\n                    ELSE 3\n                END,\n                symbol ASC\n            LIMIT 10\n        ", [
                                searchPattern, searchPattern, searchPattern,
                                query.toLowerCase(),
                                "".concat(query.toLowerCase(), "%")
                            ])];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows.map(function (token) { return (__assign(__assign({}, token), { variations: JSON.parse(token.variations), isActive: Boolean(token.isActive) })); })];
                }
            });
        });
    };
    DatabaseService.prototype.importTokensFromJson = function (tokensData) {
        return __awaiter(this, void 0, void 0, function () {
            var imported, _i, tokensData_1, token, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        imported = 0;
                        _i = 0, tokensData_1 = tokensData;
                        _a.label = 1;
                    case 1:
                        if (!(_i < tokensData_1.length)) return [3 /*break*/, 6];
                        token = tokensData_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.addToken({
                                symbol: token.symbol,
                                name: token.name,
                                address: token.address,
                                decimals: token.decimals,
                                variations: token.variations || [token.symbol.toLowerCase()],
                                chain: token.chain || 'pulsechain'
                            })];
                    case 3:
                        _a.sent();
                        imported++;
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        core_1.elizaLogger.error("Failed to import token ".concat(token.symbol, ":"), error_2);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        core_1.elizaLogger.info("\u2705 Imported ".concat(imported, " tokens into registry"));
                        return [2 /*return*/, imported];
                }
            });
        });
    };
    return DatabaseService;
}());
exports.DatabaseService = DatabaseService;
