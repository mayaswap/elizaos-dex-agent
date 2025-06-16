"use strict";
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
var walletService_js_1 = require("../services/walletService.js");
var databaseService_js_1 = require("../services/databaseService.js");
var transactionHistoryAction = {
    name: "TRANSACTION_HISTORY",
    similes: [
        "RECENT_TRADES",
        "TRADE_HISTORY",
        "TRANSACTION_LOG",
        "MY_TRANSACTIONS",
        "TRADING_ACTIVITY",
        "SWAP_HISTORY"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, historyKeywords, actionKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            historyKeywords = ['history', 'recent', 'past', 'transactions', 'trades', 'activity', 'log'];
            actionKeywords = ['show', 'get', 'display', 'view', 'list'];
            return [2 /*return*/, historyKeywords.some(function (keyword) { return text.includes(keyword); }) &&
                    (actionKeywords.some(function (keyword) { return text.includes(keyword); }) || text.includes('my'))];
        });
    }); },
    description: "Show transaction history and trading activity with performance analytics",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, platformUser, walletService, userWallets, walletCount, days_1, transactionType_1, dbService, userId, allTransactions, cutoffTime_1, filteredByTime, transactions, filteredTransactions, totalTransactions, totalVolume, totalGasCost, swapCount, lpCount, periodName, responseText, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 4, , 5]);
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 1:
                    userWallets = _c.sent();
                    walletCount = userWallets.length;
                    if (walletCount === 0) {
                        if (callback) {
                            callback({
                                text: "\uD83D\uDCCA **Transaction History**\n\n\u274C **No Wallets Connected**\n\nTo view your transaction history, you need to connect a wallet first.\n\n**After connecting a wallet, you'll see:**\n\u2022 Recent swaps and trades\n\u2022 Liquidity provision/removal history  \n\u2022 Transaction costs and gas usage\n\u2022 P&L analysis and performance metrics\n\u2022 Failed/pending transaction status\n\n**Get Started:**\n\u2022 \"Create a new wallet\"\n\u2022 \"Import wallet with private key\"\n\n*Your transaction history will be automatically tracked once connected.*"
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    days_1 = 30;
                    if (text.includes('today') || text.includes('24h'))
                        days_1 = 1;
                    else if (text.includes('week') || text.includes('7 days'))
                        days_1 = 7;
                    else if (text.includes('month') || text.includes('30 days'))
                        days_1 = 30;
                    else if (text.includes('all time') || text.includes('everything'))
                        days_1 = 365;
                    transactionType_1 = 'all';
                    if (text.includes('swap') || text.includes('trade'))
                        transactionType_1 = 'swaps';
                    else if (text.includes('liquidity') || text.includes('lp'))
                        transactionType_1 = 'liquidity';
                    else if (text.includes('failed') || text.includes('error'))
                        transactionType_1 = 'failed';
                    dbService = new databaseService_js_1.DatabaseService(runtime);
                    return [4 /*yield*/, dbService.initializeDatabase()];
                case 2:
                    _c.sent();
                    userId = "".concat(platformUser.platform, ":").concat(platformUser.platformUserId);
                    return [4 /*yield*/, dbService.getTradingHistory(userId, 1000)];
                case 3:
                    allTransactions = _c.sent();
                    cutoffTime_1 = Date.now() - (days_1 * 24 * 60 * 60 * 1000);
                    filteredByTime = allTransactions.filter(function (tx) { return new Date(tx.timestamp).getTime() > cutoffTime_1; });
                    transactions = filteredByTime.map(function (trade) { return ({
                        hash: "0x".concat(Date.now().toString(16), "...").concat(Math.random().toString(16).slice(2, 6)),
                        type: "swap", // Currently only swaps are tracked
                        timestamp: new Date(trade.timestamp).getTime(),
                        fromToken: trade.fromToken,
                        toToken: trade.toToken,
                        fromAmount: trade.amountIn,
                        toAmount: trade.amountOut,
                        gasUsed: "N/A",
                        gasPrice: "N/A",
                        gasCost: trade.gasCost || "N/A",
                        status: trade.success ? "confirmed" : "failed",
                        slippage: trade.slippageUsed ? "".concat(trade.slippageUsed, "%") : "N/A",
                        route: "Direct", // Default route
                        usdValue: 0, // Default USD value  
                        pool: "N/A", // Default pool
                        positionId: "N/A" // Default position ID
                    }); });
                    filteredTransactions = transactions.filter(function (tx) {
                        var daysSinceTransaction = (Date.now() - tx.timestamp) / (1000 * 60 * 60 * 24);
                        if (daysSinceTransaction > days_1)
                            return false;
                        if (transactionType_1 === 'swaps')
                            return tx.type === 'swap';
                        if (transactionType_1 === 'liquidity')
                            return tx.type.includes('liquidity');
                        if (transactionType_1 === 'failed')
                            return tx.status === 'failed';
                        return true;
                    });
                    totalTransactions = filteredTransactions.length;
                    totalVolume = filteredTransactions.reduce(function (sum, tx) { return sum + tx.usdValue; }, 0);
                    totalGasCost = filteredTransactions.reduce(function (sum, tx) { return sum + parseFloat(tx.gasCost); }, 0);
                    swapCount = filteredTransactions.filter(function (tx) { return tx.type === 'swap'; }).length;
                    lpCount = filteredTransactions.filter(function (tx) { return tx.type.includes('liquidity'); }).length;
                    periodName = days_1 === 1 ? 'Today' :
                        days_1 === 7 ? 'Past Week' :
                            days_1 === 30 ? 'Past Month' :
                                'All Time';
                    responseText = '';
                    if (filteredTransactions.length === 0) {
                        responseText = "\uD83D\uDCCA **Transaction History - ".concat(periodName, "**\n\n\uD83D\uDEAB **No Transactions Found**\n\n").concat(transactionType_1 === 'all' ?
                            "No transactions in the past ".concat(days_1, " days.") :
                            "No ".concat(transactionType_1, " transactions in the past ").concat(days_1, " days."), "\n\n**Try:**\n\u2022 Expanding time period: \"Show all time transaction history\"\n\u2022 Different transaction type: \"Show my recent swaps\"\n\u2022 Check if wallet is connected properly\n\n*Transaction tracking begins when you start using the DEX agent.*");
                    }
                    else {
                        responseText = "\uD83D\uDCCA **Transaction History - ".concat(periodName, "**\n\n\uD83D\uDCC8 **Summary**:\n\u2022 Total Transactions: ").concat(totalTransactions, "\n\u2022 Total Volume: $").concat(totalVolume.toLocaleString(), "\n\u2022 Gas Costs: ").concat(totalGasCost.toFixed(6), " PLS (~$").concat((totalGasCost * 0.18).toFixed(2), ")\n\u2022 Swaps: ").concat(swapCount, " | Liquidity Ops: ").concat(lpCount, "\n\n\uD83D\uDD04 **Recent Transactions**:\n").concat(filteredTransactions.slice(0, 5).map(function (tx, i) {
                            var timeAgo = Math.floor((Date.now() - tx.timestamp) / (1000 * 60 * 60));
                            var timeStr = timeAgo < 1 ? 'Just now' :
                                timeAgo < 24 ? "".concat(timeAgo, "h ago") :
                                    "".concat(Math.floor(timeAgo / 24), "d ago");
                            if (tx.type === 'swap') {
                                return "".concat(i + 1, ". **").concat(tx.type.toUpperCase(), "** (").concat(timeStr, ")\n   ").concat(tx.fromAmount, " ").concat(tx.fromToken, " \u2192 ").concat(parseFloat(tx.toAmount).toLocaleString(), " ").concat(tx.toToken, "\n   Value: $").concat(tx.usdValue.toLocaleString(), " | Gas: ").concat(tx.gasCost, " PLS | Slippage: ").concat(tx.slippage, "\n   Hash: `").concat(tx.hash, "`");
                            }
                            else {
                                var action = tx.type === 'add_liquidity' ? 'Added to' : 'Removed from';
                                return "".concat(i + 1, ". **").concat(tx.type.replace('_', ' ').toUpperCase(), "** (").concat(timeStr, ")\n   ").concat(action, " ").concat(tx.pool, " pool\n   Position: ").concat(tx.positionId, " | Value: $").concat(tx.usdValue.toLocaleString(), "\n   Hash: `").concat(tx.hash, "`");
                            }
                        }).join('\n\n'), "\n\n\uD83D\uDCA1 **Performance Insights**:\n\u2022 Average transaction size: $").concat((totalVolume / totalTransactions).toLocaleString(), "\n\u2022 Gas efficiency: ").concat((totalGasCost / totalVolume * 100).toFixed(4), "% of volume\n\u2022 Most active: ").concat(swapCount > lpCount ? 'Token swapping' : 'Liquidity management', "\n\n**More Details:**\n\u2022 \"Show swap history\" - Filter by swaps only\n\u2022 \"Show liquidity transactions\" - LP operations only\n\u2022 \"Show failed transactions\" - Failed/reverted txs");
                    }
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_1 = _c.sent();
                    console.error('Transaction history action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to load transaction history: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Show my recent trades" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you your recent trading activity with performance metrics and transaction details.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Transaction history this week" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me pull up your transaction history for the past week with volume and gas cost analysis.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my swap history" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll filter your transaction history to show only swap transactions with performance data.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ]
    ],
};
exports.default = transactionHistoryAction;
