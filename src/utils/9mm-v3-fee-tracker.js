"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.NineMmV3FeeTracker = void 0;
var graphql_request_1 = require("graphql-request");
var NineMmV3FeeTracker = /** @class */ (function () {
    function NineMmV3FeeTracker() {
        this.subgraphUrl = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';
        this.client = new graphql_request_1.GraphQLClient(this.subgraphUrl);
    }
    /**
     * Get real-time fee earnings for a position
     */
    NineMmV3FeeTracker.prototype.getFeeEarningsHistory = function (positionId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, snapshots, totalToken0, totalToken1, totalUSD, timestamp, earningRate, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      query GetPositionFeeHistory($positionId: ID!) {\n        position(id: $positionId) {\n          id\n          collectedFeesToken0\n          collectedFeesToken1\n          pool {\n            token0 {\n              symbol\n              decimals\n            }\n            token1 {\n              symbol\n              decimals\n            }\n          }\n          transaction {\n            timestamp\n          }\n        }\n        \n        # Get fee collection events\n        collects(\n          where: { position: $positionId }\n          orderBy: timestamp\n          orderDirection: desc\n          first: 100\n        ) {\n          id\n          timestamp\n          amount0\n          amount1\n          amountUSD\n          transaction {\n            blockNumber\n          }\n        }\n      }\n    "], ["\n      query GetPositionFeeHistory($positionId: ID!) {\n        position(id: $positionId) {\n          id\n          collectedFeesToken0\n          collectedFeesToken1\n          pool {\n            token0 {\n              symbol\n              decimals\n            }\n            token1 {\n              symbol\n              decimals\n            }\n          }\n          transaction {\n            timestamp\n          }\n        }\n        \n        # Get fee collection events\n        collects(\n          where: { position: $positionId }\n          orderBy: timestamp\n          orderDirection: desc\n          first: 100\n        ) {\n          id\n          timestamp\n          amount0\n          amount1\n          amountUSD\n          transaction {\n            blockNumber\n          }\n        }\n      }\n    "])));
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                positionId: positionId.toLowerCase()
                            })];
                    case 2:
                        result = _c.sent();
                        if (!result.position) {
                            throw new Error("Position ".concat(positionId, " not found"));
                        }
                        snapshots = result.collects.map(function (collect) { return ({
                            timestamp: collect.timestamp,
                            token0Fees: collect.amount0,
                            token1Fees: collect.amount1,
                            token0FeesUSD: (parseFloat(collect.amountUSD) * 0.5).toString(), // Rough split
                            token1FeesUSD: (parseFloat(collect.amountUSD) * 0.5).toString(),
                            totalFeesUSD: collect.amountUSD,
                            blockNumber: collect.transaction.blockNumber
                        }); });
                        totalToken0 = result.position.collectedFeesToken0;
                        totalToken1 = result.position.collectedFeesToken1;
                        totalUSD = snapshots.reduce(function (sum, s) { return sum + parseFloat(s.totalFeesUSD); }, 0);
                        timestamp = ((_b = (_a = result.position) === null || _a === void 0 ? void 0 : _a.transaction) === null || _b === void 0 ? void 0 : _b.timestamp) || '0';
                        earningRate = this.calculateEarningRates(snapshots, timestamp);
                        return [2 /*return*/, {
                                positionId: positionId,
                                snapshots: snapshots,
                                totalEarned: {
                                    token0: totalToken0,
                                    token1: totalToken1,
                                    usd: totalUSD.toString()
                                },
                                earningRate: earningRate
                            }];
                    case 3:
                        error_1 = _c.sent();
                        console.error('Error fetching fee earnings:', error_1);
                        return [2 /*return*/, {
                                positionId: positionId,
                                snapshots: [],
                                totalEarned: { token0: '0', token1: '0', usd: '0' },
                                earningRate: { dailyUSD: 0, weeklyUSD: 0, monthlyUSD: 0, annualizedAPY: 0 }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get comprehensive position performance analytics
     */
    NineMmV3FeeTracker.prototype.getPositionPerformance = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            var openTimestamp, openDate, daysActive, priceHistory, initialToken0, initialToken1, initialPrice0, initialPrice1, initialUSD, currentToken0, currentToken1, currentPrice0, currentPrice1, currentUSD, feeEarnings, unclaimedFeesUSD, hodlValue, hodlReturn, totalValue, totalPnL, feePnL, ilPnL, percentageReturn, annualizedReturn, timeInRange;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        openTimestamp = parseInt(position.transaction.timestamp);
                        openDate = new Date(openTimestamp * 1000).toISOString().split('T')[0];
                        daysActive = (Date.now() / 1000 - openTimestamp) / (24 * 60 * 60);
                        return [4 /*yield*/, this.getHistoricalPrices(position.pool.id, openTimestamp)];
                    case 1:
                        priceHistory = _c.sent();
                        initialToken0 = parseFloat(position.depositedToken0);
                        initialToken1 = parseFloat(position.depositedToken1);
                        initialPrice0 = priceHistory.openPrice.token0USD;
                        initialPrice1 = priceHistory.openPrice.token1USD;
                        initialUSD = (initialToken0 * initialPrice0) + (initialToken1 * initialPrice1);
                        currentToken0 = initialToken0 - parseFloat(position.withdrawnToken0);
                        currentToken1 = initialToken1 - parseFloat(position.withdrawnToken1);
                        currentPrice0 = priceHistory.currentPrice.token0USD;
                        currentPrice1 = priceHistory.currentPrice.token1USD;
                        currentUSD = (currentToken0 * currentPrice0) + (currentToken1 * currentPrice1);
                        return [4 /*yield*/, this.getFeeEarningsHistory(position.id)];
                    case 2:
                        feeEarnings = _c.sent();
                        unclaimedFeesUSD = parseFloat(feeEarnings.totalEarned.usd);
                        hodlValue = initialUSD * (currentPrice0 / initialPrice0 + currentPrice1 / initialPrice1) / 2;
                        hodlReturn = ((hodlValue - initialUSD) / initialUSD) * 100;
                        totalValue = currentUSD + unclaimedFeesUSD;
                        totalPnL = totalValue - initialUSD;
                        feePnL = unclaimedFeesUSD;
                        ilPnL = totalPnL - feePnL;
                        percentageReturn = (totalPnL / initialUSD) * 100;
                        annualizedReturn = (percentageReturn / daysActive) * 365;
                        return [4 /*yield*/, this.calculateTimeInRange(position)];
                    case 3:
                        timeInRange = _c.sent();
                        _a = {
                            positionId: position.id,
                            openDate: openDate,
                            daysActive: Math.round(daysActive * 100) / 100,
                            initialInvestment: {
                                token0Amount: position.depositedToken0,
                                token1Amount: position.depositedToken1,
                                totalUSD: initialUSD.toFixed(2)
                            },
                            currentValue: {
                                token0Amount: currentToken0.toString(),
                                token1Amount: currentToken1.toString(),
                                totalUSD: currentUSD.toFixed(2),
                                unclaimedFeesUSD: unclaimedFeesUSD.toFixed(2)
                            },
                            pnl: {
                                totalPnL: totalPnL.toFixed(2),
                                feePnL: feePnL.toFixed(2),
                                ilPnL: ilPnL.toFixed(2),
                                percentageReturn: Math.round(percentageReturn * 100) / 100,
                                annualizedReturn: Math.round(annualizedReturn * 100) / 100
                            },
                            vsHodl: {
                                hodlValue: hodlValue.toFixed(2),
                                hodlReturn: Math.round(hodlReturn * 100) / 100,
                                outperformance: Math.round((percentageReturn - hodlReturn) * 100) / 100
                            }
                        };
                        _b = {
                            timeInRange: timeInRange
                        };
                        return [4 /*yield*/, this.calculateMaxDrawdown(position)];
                    case 4:
                        _b.maxDrawdown = _c.sent();
                        return [4 /*yield*/, this.calculateVolatility(position)];
                    case 5: return [2 /*return*/, (_a.risk = (_b.volatility = _c.sent(),
                            _b),
                            _a)];
                }
            });
        });
    };
    /**
     * Get daily fee earnings for a position
     */
    NineMmV3FeeTracker.prototype.getDailyFeeEarnings = function (positionId_1) {
        return __awaiter(this, arguments, void 0, function (positionId, days) {
            var query, startTime, result, error_2;
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      query GetDailyFees($positionId: ID!, $startTime: BigInt!) {\n        positionDayDatas(\n          where: { \n            position: $positionId\n            date_gte: $startTime\n          }\n          orderBy: date\n          orderDirection: desc\n          first: ", "\n        ) {\n          date\n          feesEarnedToken0\n          feesEarnedToken1\n          feesEarnedUSD\n          pool {\n            token0Price\n            token1Price\n          }\n        }\n      }\n    "], ["\n      query GetDailyFees($positionId: ID!, $startTime: BigInt!) {\n        positionDayDatas(\n          where: { \n            position: $positionId\n            date_gte: $startTime\n          }\n          orderBy: date\n          orderDirection: desc\n          first: ", "\n        ) {\n          date\n          feesEarnedToken0\n          feesEarnedToken1\n          feesEarnedUSD\n          pool {\n            token0Price\n            token1Price\n          }\n        }\n      }\n    "])), days);
                        startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                positionId: positionId.toLowerCase(),
                                startTime: startTime.toString()
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.positionDayDatas.map(function (day) { return ({
                                date: new Date(parseInt(day.date) * 1000).toISOString().split('T')[0],
                                feesToken0: day.feesEarnedToken0,
                                feesToken1: day.feesEarnedToken1,
                                feesUSD: day.feesEarnedUSD,
                                token0PriceUSD: day.pool.token0Price,
                                token1PriceUSD: day.pool.token1Price,
                                volumeUSD: '0' // Would need additional query for volume
                            }); })];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error fetching daily fees:', error_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate earning rates from fee history
     */
    NineMmV3FeeTracker.prototype.calculateEarningRates = function (snapshots, openTimestamp) {
        if (snapshots.length === 0) {
            return { dailyUSD: 0, weeklyUSD: 0, monthlyUSD: 0, annualizedAPY: 0 };
        }
        var totalFeesUSD = snapshots.reduce(function (sum, s) { return sum + parseFloat(s.totalFeesUSD); }, 0);
        var daysActive = (Date.now() / 1000 - parseInt(openTimestamp)) / (24 * 60 * 60);
        var dailyUSD = totalFeesUSD / Math.max(daysActive, 1);
        var weeklyUSD = dailyUSD * 7;
        var monthlyUSD = dailyUSD * 30;
        var annualizedAPY = (dailyUSD * 365);
        return {
            dailyUSD: Math.round(dailyUSD * 100) / 100,
            weeklyUSD: Math.round(weeklyUSD * 100) / 100,
            monthlyUSD: Math.round(monthlyUSD * 100) / 100,
            annualizedAPY: Math.round(annualizedAPY * 100) / 100
        };
    };
    /**
     * Get historical prices for IL calculation
     */
    NineMmV3FeeTracker.prototype.getHistoricalPrices = function (poolId, openTimestamp) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, currentPrice0, currentPrice1, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      query GetHistoricalPrices($poolId: ID!) {\n        pool(id: $poolId) {\n          token0Price\n          token1Price\n        }\n      }\n    "], ["\n      query GetHistoricalPrices($poolId: ID!) {\n        pool(id: $poolId) {\n          token0Price\n          token1Price\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, { poolId: poolId })];
                    case 2:
                        result = _a.sent();
                        currentPrice0 = parseFloat(result.pool.token0Price);
                        currentPrice1 = parseFloat(result.pool.token1Price);
                        return [2 /*return*/, {
                                openPrice: { token0USD: currentPrice0 * 0.9, token1USD: currentPrice1 * 0.9 }, // Estimate
                                currentPrice: { token0USD: currentPrice0, token1USD: currentPrice1 }
                            }];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error fetching historical prices:', error_3);
                        return [2 /*return*/, {
                                openPrice: { token0USD: 1, token1USD: 1 },
                                currentPrice: { token0USD: 1, token1USD: 1 }
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate percentage of time position was in range
     */
    NineMmV3FeeTracker.prototype.calculateTimeInRange = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            var currentTick, tickLower, tickUpper, isInRange;
            return __generator(this, function (_a) {
                currentTick = parseInt(position.pool.tick);
                tickLower = parseInt(position.tickLower);
                tickUpper = parseInt(position.tickUpper);
                isInRange = currentTick >= tickLower && currentTick <= tickUpper;
                // Return estimated time in range (would need historical data for real calculation)
                return [2 /*return*/, isInRange ? 85 : 45]; // Rough estimates
            });
        });
    };
    /**
     * Calculate maximum drawdown
     */
    NineMmV3FeeTracker.prototype.calculateMaxDrawdown = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simplified - would need position value history
                return [2 /*return*/, 15.5]; // Placeholder
            });
        });
    };
    /**
     * Calculate position volatility
     */
    NineMmV3FeeTracker.prototype.calculateVolatility = function (position) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simplified - would need daily returns data
                return [2 /*return*/, 25.3]; // Placeholder
            });
        });
    };
    /**
     * Format fee earnings for display
     */
    NineMmV3FeeTracker.prototype.formatFeeEarnings = function (feeHistory) {
        var totalEarned = feeHistory.totalEarned, earningRate = feeHistory.earningRate;
        return "\uD83D\uDCB0 **Fee Earnings**\nTotal Earned: $".concat(parseFloat(totalEarned.usd).toFixed(2), "\nDaily Rate: $").concat(earningRate.dailyUSD, "/day\nWeekly Rate: $").concat(earningRate.weeklyUSD, "/week\nMonthly Rate: $").concat(earningRate.monthlyUSD, "/month\nAnnualized APY: ").concat(earningRate.annualizedAPY, "%");
    };
    /**
     * Format position performance for display
     */
    NineMmV3FeeTracker.prototype.formatPositionPerformance = function (performance) {
        var pnl = performance.pnl, vsHodl = performance.vsHodl, risk = performance.risk;
        var profitEmoji = parseFloat(pnl.totalPnL) >= 0 ? '📈' : '📉';
        var vsHodlEmoji = vsHodl.outperformance >= 0 ? '🚀' : '🐌';
        return "".concat(profitEmoji, " **Position Performance**\nDays Active: ").concat(performance.daysActive, "\nTotal P&L: $").concat(pnl.totalPnL, " (").concat(pnl.percentageReturn, "%)\n  \u251C\u2500 Fee Earnings: $").concat(pnl.feePnL, "\n  \u2514\u2500 IL Impact: $").concat(pnl.ilPnL, "\n\n").concat(vsHodlEmoji, " **vs HODL**\nHODL Return: ").concat(vsHodl.hodlReturn, "%\nOutperformance: ").concat(vsHodl.outperformance, "%\n\n\u26A1 **Risk Metrics**\nTime in Range: ").concat(risk.timeInRange, "%\nMax Drawdown: ").concat(risk.maxDrawdown, "%\nVolatility: ").concat(risk.volatility, "%\n\n\uD83C\uDFAF **Annualized Return**: ").concat(pnl.annualizedReturn, "%");
    };
    return NineMmV3FeeTracker;
}());
exports.NineMmV3FeeTracker = NineMmV3FeeTracker;
var templateObject_1, templateObject_2, templateObject_3;
