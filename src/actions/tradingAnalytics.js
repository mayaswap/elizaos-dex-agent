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
var tradingAnalyticsAction = {
    name: "TRADING_ANALYTICS",
    similes: [
        "TRADING_HISTORY",
        "TRADE_STATS",
        "PERFORMANCE_METRICS",
        "TRADING_REPORT",
        "MY_TRADES",
        "TRADE_ANALYTICS"
    ],
    description: "View comprehensive trading history, performance metrics, and analytics",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, keywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            keywords = [
                'trading history', 'trade history', 'my trades', 'trading stats',
                'performance', 'analytics', 'trading report', 'trade stats',
                'show trades', 'recent trades', 'trading metrics'
            ];
            return [2 /*return*/, keywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, platformUser, dbService, responseText, trades, successfulTrades, failedTrades, successRate, trades, metrics, period, trades, report, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    text = message.content.text.toLowerCase();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    dbService = new databaseService_js_1.DatabaseService(runtime);
                    return [4 /*yield*/, dbService.initializeDatabase()];
                case 1:
                    _a.sent();
                    responseText = '';
                    if (!(text.includes('recent') || text.includes('history') || text.includes('show trades'))) return [3 /*break*/, 3];
                    return [4 /*yield*/, dbService.getTradingHistory("".concat(platformUser.platform, ":").concat(platformUser.platformUserId), 20)];
                case 2:
                    trades = _a.sent();
                    if (trades.length === 0) {
                        responseText = "\uD83D\uDCCA **Trading History**\n\nNo trades found for your account on ".concat(platformUser.platform.toUpperCase(), ".\n\n**Start Trading:**\n\u2022 \"swap 100 USDC for HEX\" - Execute your first trade\n\u2022 \"price HEX\" - Check current prices\n\u2022 \"create price alert\" - Set up alerts\n\nYour trades will be automatically tracked and analyzed!");
                    }
                    else {
                        successfulTrades = trades.filter(function (t) { return t.success; }).length;
                        failedTrades = trades.length - successfulTrades;
                        successRate = ((successfulTrades / trades.length) * 100).toFixed(1);
                        responseText = "\uD83D\uDCCA **Trading History & Analytics**\n\n**\uD83D\uDCC8 Overview:**\n\u2022 **Total Trades:** ".concat(trades.length, "\n\u2022 **Successful:** ").concat(successfulTrades, " (").concat(successRate, "%)\n\u2022 **Failed:** ").concat(failedTrades, "\n\u2022 **Platform:** ").concat(platformUser.platform.toUpperCase(), "\n\n**\uD83D\uDD04 Recent Trades:**\n").concat(trades.slice(0, 10).map(function (trade, i) {
                            var status = trade.success ? '✅' : '❌';
                            var timeAgo = new Date(trade.timestamp).toLocaleDateString();
                            return "".concat(i + 1, ". ").concat(status, " ").concat(trade.fromToken, " \u2192 ").concat(trade.toToken, "\n   \uD83D\uDCCA In: ").concat(parseFloat(trade.amountIn).toFixed(4), " | Out: ").concat(parseFloat(trade.amountOut).toFixed(4), "\n   \u26FD Gas: ").concat(trade.gasCost || 'N/A', " | \uD83D\uDCC5 ").concat(timeAgo, "\n   ").concat(trade.dexUsed ? "\uD83D\uDD17 DEX: ".concat(trade.dexUsed) : '');
                        }).join('\n\n'), "\n\n**\uD83D\uDCA1 Trading Insights:**\n\u2022 **Best Performing Tokens:** ").concat(getMostTradedTokens(trades).join(', '), "\n\u2022 **Average Slippage:** ").concat(getAverageSlippage(trades).toFixed(2), "%\n\u2022 **Gas Efficiency:** ").concat(trades.filter(function (t) { return t.gasCost; }).length, "/").concat(trades.length, " trades tracked\n\n**\uD83D\uDCF1 Actions:**\n\u2022 \"trading stats\" - Detailed performance metrics\n\u2022 \"set price alert for HEX\" - Monitor your tokens\n\u2022 \"show portfolio\" - Current holdings");
                    }
                    return [3 /*break*/, 7];
                case 3:
                    if (!(text.includes('stats') || text.includes('performance') || text.includes('metrics'))) return [3 /*break*/, 5];
                    return [4 /*yield*/, dbService.getTradingHistory("".concat(platformUser.platform, ":").concat(platformUser.platformUserId), 100)];
                case 4:
                    trades = _a.sent();
                    if (trades.length === 0) {
                        responseText = "\uD83D\uDCC8 **Performance Metrics**\n\nNo trading data available yet.\n\n**Get Started:**\n\u2022 Execute some trades to build your performance history\n\u2022 Analytics will automatically track your success rate\n\u2022 Compare your performance across different tokens\n\nStart trading to see your metrics!";
                    }
                    else {
                        metrics = calculatePerformanceMetrics(trades);
                        responseText = "\uD83D\uDCC8 **Detailed Performance Metrics**\n\n**\uD83C\uDFAF Overall Performance:**\n\u2022 **Total Trades:** ".concat(metrics.totalTrades, "\n\u2022 **Success Rate:** ").concat(metrics.successRate.toFixed(1), "%\n\u2022 **Total Volume:** $").concat(metrics.totalVolumeUSD.toFixed(2), "\n\u2022 **Average Trade Size:** $").concat(metrics.averageTradeSize.toFixed(2), "\n\n**\u26FD Gas Efficiency:**\n\u2022 **Total Gas Costs:** $").concat(metrics.totalGasCosts.toFixed(2), "\n\u2022 **Average Gas per Trade:** $").concat(metrics.averageGas.toFixed(2), "\n\u2022 **Gas/Volume Ratio:** ").concat((metrics.totalGasCosts / metrics.totalVolumeUSD * 100).toFixed(2), "%\n\n**\uD83D\uDD04 Trading Patterns:**\n\u2022 **Most Active Day:** ").concat(metrics.mostActiveDay, "\n\u2022 **Favorite Token Pair:** ").concat(metrics.favoriteTokenPair, "\n\u2022 **Average Slippage:** ").concat(metrics.averageSlippage.toFixed(2), "%\n\n**\uD83C\uDFC6 Best Trades:**\n").concat(metrics.bestTrades.map(function (trade, i) {
                            return "".concat(i + 1, ". ").concat(trade.fromToken, " \u2192 ").concat(trade.toToken, " (").concat(new Date(trade.timestamp).toLocaleDateString(), ")");
                        }).join('\n'), "\n\n**\u26A0\uFE0F Areas for Improvement:**\n\u2022 ").concat(metrics.improvements.join('\n• '), "\n\n**\uD83D\uDCA1 Recommendations:**\n\u2022 ").concat(metrics.recommendations.join('\n• '), "\n\n**\uD83D\uDCCA Want More Details?**\n\u2022 \"recent trades\" - View latest transactions\n\u2022 \"trading report monthly\" - Period-specific analysis\n\u2022 \"gas optimization tips\" - Reduce trading costs");
                    }
                    return [3 /*break*/, 7];
                case 5:
                    if (!text.includes('report')) return [3 /*break*/, 7];
                    period = text.includes('weekly') ? 'weekly' :
                        text.includes('monthly') ? 'monthly' : 'all-time';
                    return [4 /*yield*/, dbService.getTradingHistory("".concat(platformUser.platform, ":").concat(platformUser.platformUserId), period === 'weekly' ? 50 : period === 'monthly' ? 200 : 500)];
                case 6:
                    trades = _a.sent();
                    report = generateTradingReport(trades, period);
                    responseText = "\uD83D\uDCCB **".concat(period.toUpperCase(), " Trading Report**\n\n**\uD83D\uDCCA Executive Summary:**\n\u2022 **Period:** ").concat(report.period, "\n\u2022 **Total Trades:** ").concat(report.totalTrades, "\n\u2022 **Success Rate:** ").concat(report.successRate, "%\n\u2022 **Net Performance:** ").concat(report.netPerformance, "\n\n**\uD83D\uDCB0 Financial Summary:**\n\u2022 **Total Volume:** $").concat(report.totalVolume.toFixed(2), "\n\u2022 **Gas Costs:** $").concat(report.totalGasCosts.toFixed(2), "\n\u2022 **Efficiency Ratio:** ").concat(report.efficiencyRatio.toFixed(2), "%\n\n**\uD83C\uDFAF Top Insights:**\n").concat(report.insights.map(function (insight) { return "\u2022 ".concat(insight); }).join('\n'), "\n\n**\uD83D\uDCC8 Performance Trends:**\n").concat(report.trends.map(function (trend) { return "\u2022 ".concat(trend); }).join('\n'), "\n\n**\uD83D\uDD2E Recommendations:**\n").concat(report.recommendations.map(function (rec) { return "\u2022 ".concat(rec); }).join('\n'), "\n\n**\uD83D\uDCF1 Export Options:**\n\u2022 \"detailed trading history\" - Full transaction list\n\u2022 \"portfolio analysis\" - Current holdings breakdown\n\u2022 \"set trading goals\" - Performance targets");
                    _a.label = 7;
                case 7:
                    if (callback) {
                        callback({ text: responseText });
                    }
                    return [2 /*return*/, true];
                case 8:
                    error_1 = _a.sent();
                    console.error('Trading analytics error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C **Analytics Error**\n\nFailed to retrieve trading analytics: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error', "\n\n**Try Again:**\n\u2022 \"recent trades\" - View transaction history\n\u2022 \"trading stats\" - Performance metrics\n\u2022 \"my trades\" - Trading overview\n\nIf the issue persists, please check your database connection.")
                        });
                    }
                    return [2 /*return*/, false];
                case 9: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "show my trading history" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here's your complete trading history with performance analytics and insights." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "trading performance stats" }
            },
            {
                name: "{{user2}}",
                content: { text: "Your trading performance metrics including success rate, gas efficiency, and recommendations." }
            }
        ]
    ]
};
// Helper functions for analytics
function getMostTradedTokens(trades) {
    var tokenCounts = {};
    trades.forEach(function (trade) {
        tokenCounts[trade.fromToken] = (tokenCounts[trade.fromToken] || 0) + 1;
        tokenCounts[trade.toToken] = (tokenCounts[trade.toToken] || 0) + 1;
    });
    return Object.entries(tokenCounts)
        .sort(function (_a, _b) {
        var a = _a[1];
        var b = _b[1];
        return b - a;
    })
        .slice(0, 3)
        .map(function (_a) {
        var token = _a[0];
        return token;
    });
}
function getAverageSlippage(trades) {
    var slippages = trades.filter(function (t) { return t.slippageUsed; }).map(function (t) { return t.slippageUsed; });
    return slippages.length > 0 ? slippages.reduce(function (a, b) { return a + b; }, 0) / slippages.length : 0;
}
function calculatePerformanceMetrics(trades) {
    var _a, _b;
    var successful = trades.filter(function (t) { return t.success; });
    var totalGas = trades.filter(function (t) { return t.gasCost; }).reduce(function (sum, t) { return sum + parseFloat(t.gasCost); }, 0);
    // Calculate most active day
    var dayFrequency = {};
    trades.forEach(function (trade) {
        var day = new Date(trade.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });
    var mostActiveDay = ((_a = Object.entries(dayFrequency)
        .sort(function (_a, _b) {
        var a = _a[1];
        var b = _b[1];
        return b - a;
    })[0]) === null || _a === void 0 ? void 0 : _a[0]) || 'No data';
    // Calculate favorite token pair
    var pairFrequency = {};
    trades.forEach(function (trade) {
        var pair = "".concat(trade.fromToken, "/").concat(trade.toToken);
        pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
    });
    var favoriteTokenPair = ((_b = Object.entries(pairFrequency)
        .sort(function (_a, _b) {
        var a = _a[1];
        var b = _b[1];
        return b - a;
    })[0]) === null || _b === void 0 ? void 0 : _b[0]) || 'No data';
    // Calculate total volume (simplified - would need price data for accuracy)
    var totalVolumeUSD = trades.reduce(function (sum, trade) {
        // Estimate based on token amounts - would need real price data
        var estimatedValue = parseFloat(trade.amountIn) * 10; // Placeholder multiplier
        return sum + estimatedValue;
    }, 0);
    var averageTradeSize = totalVolumeUSD / trades.length;
    return {
        totalTrades: trades.length,
        successRate: trades.length > 0 ? (successful.length / trades.length) * 100 : 0,
        totalVolumeUSD: totalVolumeUSD,
        averageTradeSize: averageTradeSize,
        totalGasCosts: totalGas,
        averageGas: trades.length > 0 ? totalGas / trades.length : 0,
        mostActiveDay: mostActiveDay,
        favoriteTokenPair: favoriteTokenPair,
        averageSlippage: getAverageSlippage(trades),
        bestTrades: trades.filter(function (t) { return t.success; }).slice(0, 3),
        improvements: [
            "Consider setting lower slippage tolerance",
            "Monitor gas prices for optimal timing"
        ],
        recommendations: [
            "Set up price alerts for better entry points",
            "Review failed trades for patterns"
        ]
    };
}
function generateTradingReport(trades, period) {
    var successful = trades.filter(function (t) { return t.success; });
    var successRate = trades.length > 0 ? (successful.length / trades.length) * 100 : 0;
    // Calculate net performance
    var netPerformance = successRate >= 50 ? "Positive" : "Needs Improvement";
    // Calculate total volume (simplified estimation)
    var totalVolume = trades.reduce(function (sum, trade) {
        var estimatedValue = parseFloat(trade.amountIn) * 10; // Placeholder multiplier
        return sum + estimatedValue;
    }, 0);
    var totalGasCosts = trades.reduce(function (sum, t) { return sum + parseFloat(t.gasCost || '0'); }, 0);
    // Calculate efficiency ratio (successful trades value vs gas costs)
    var efficiencyRatio = totalVolume > 0 ? ((totalVolume - totalGasCosts) / totalVolume * 100) : 0;
    // Generate dynamic insights based on data
    var insights = [];
    if (successRate > 70)
        insights.push("Excellent success rate - maintain current strategy");
    if (successRate < 50)
        insights.push("Success rate below 50% - consider reviewing trade sizes");
    if (totalGasCosts > totalVolume * 0.05)
        insights.push("High gas costs relative to volume");
    if (trades.length > 50)
        insights.push("High trading activity detected");
    // Generate dynamic trends
    var trends = [];
    if (trades.length > 0) {
        var recentTrades = trades.slice(0, Math.min(10, trades.length));
        var recentSuccessRate = (recentTrades.filter(function (t) { return t.success; }).length / recentTrades.length) * 100;
        if (recentSuccessRate > successRate)
            trends.push("Success rate improving recently");
        else if (recentSuccessRate < successRate)
            trends.push("Success rate declining recently");
    }
    trends.push("Average of ".concat((trades.length / 30).toFixed(1), " trades per day"));
    // Generate dynamic recommendations
    var recommendations = [];
    if (successRate < 60)
        recommendations.push("Focus on fewer, higher-quality trades");
    if (totalGasCosts > totalVolume * 0.1)
        recommendations.push("Consider trading during low gas periods");
    recommendations.push("Use price alerts to time entries better");
    return {
        period: period,
        totalTrades: trades.length,
        successRate: successRate.toFixed(1),
        netPerformance: netPerformance,
        totalVolume: totalVolume,
        totalGasCosts: totalGasCosts,
        efficiencyRatio: efficiencyRatio,
        insights: insights.length > 0 ? insights : ["Building trading history..."],
        trends: trends,
        recommendations: recommendations
    };
}
exports.default = tradingAnalyticsAction;
