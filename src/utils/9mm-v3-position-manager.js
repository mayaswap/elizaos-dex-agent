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
exports.NineMmV3PositionManager = void 0;
var graphql_request_1 = require("graphql-request");
var ethers_1 = require("ethers");
var _9mm_v3_fee_tracker_js_1 = require("./9mm-v3-fee-tracker.js");
var NineMmV3PositionManager = /** @class */ (function () {
    function NineMmV3PositionManager() {
        this.subgraphUrl = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';
        // 9mm V3 contract addresses on PulseChain
        this.nftPositionManager = '0x01CEF6B55a31B8fE39F951bc67b41D5DA6F96B1D'; // Example address
        this.factory = '0x0e410Fa377115581470D00248f4401E6C8B02171'; // Example address
        this.client = new graphql_request_1.GraphQLClient(this.subgraphUrl);
        this.feeTracker = new _9mm_v3_fee_tracker_js_1.NineMmV3FeeTracker();
    }
    /**
     * Get all positions for a specific user
     */
    NineMmV3PositionManager.prototype.getUserPositions = function (userAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      query GetUserPositions($owner: String!) {\n        positions(\n          where: { \n            owner: $owner, \n            liquidity_gt: 0 \n          }\n          orderBy: liquidity\n          orderDirection: desc\n        ) {\n          id\n          owner\n          pool {\n            id\n            token0 {\n              id\n              symbol\n              decimals\n            }\n            token1 {\n              id\n              symbol\n              decimals\n            }\n            feeTier\n            sqrtPrice\n            tick\n          }\n          liquidity\n          tickLower\n          tickUpper\n          depositedToken0\n          depositedToken1\n          withdrawnToken0\n          withdrawnToken1\n          collectedFeesToken0\n          collectedFeesToken1\n          transaction {\n            timestamp\n          }\n        }\n      }\n    "], ["\n      query GetUserPositions($owner: String!) {\n        positions(\n          where: { \n            owner: $owner, \n            liquidity_gt: 0 \n          }\n          orderBy: liquidity\n          orderDirection: desc\n        ) {\n          id\n          owner\n          pool {\n            id\n            token0 {\n              id\n              symbol\n              decimals\n            }\n            token1 {\n              id\n              symbol\n              decimals\n            }\n            feeTier\n            sqrtPrice\n            tick\n          }\n          liquidity\n          tickLower\n          tickUpper\n          depositedToken0\n          depositedToken1\n          withdrawnToken0\n          withdrawnToken1\n          collectedFeesToken0\n          collectedFeesToken1\n          transaction {\n            timestamp\n          }\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                owner: userAddress.toLowerCase()
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.positions];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error fetching user positions:', error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get detailed information about a specific position
     */
    NineMmV3PositionManager.prototype.getPositionDetails = function (positionId) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      query GetPositionDetails($id: ID!) {\n        position(id: $id) {\n          id\n          owner\n          pool {\n            id\n            token0 {\n              id\n              symbol\n              decimals\n            }\n            token1 {\n              id\n              symbol\n              decimals\n            }\n            feeTier\n            sqrtPrice\n            tick\n            token0Price\n            token1Price\n          }\n          liquidity\n          tickLower\n          tickUpper\n          depositedToken0\n          depositedToken1\n          withdrawnToken0\n          withdrawnToken1\n          collectedFeesToken0\n          collectedFeesToken1\n          transaction {\n            timestamp\n          }\n        }\n      }\n    "], ["\n      query GetPositionDetails($id: ID!) {\n        position(id: $id) {\n          id\n          owner\n          pool {\n            id\n            token0 {\n              id\n              symbol\n              decimals\n            }\n            token1 {\n              id\n              symbol\n              decimals\n            }\n            feeTier\n            sqrtPrice\n            tick\n            token0Price\n            token1Price\n          }\n          liquidity\n          tickLower\n          tickUpper\n          depositedToken0\n          depositedToken1\n          withdrawnToken0\n          withdrawnToken1\n          collectedFeesToken0\n          collectedFeesToken1\n          transaction {\n            timestamp\n          }\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                id: positionId.toLowerCase()
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.position];
                    case 3:
                        error_2 = _a.sent();
                        console.error('Error fetching position details:', error_2);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert price to tick for V3
     * Formula: tick = log(price) / log(1.0001)
     */
    NineMmV3PositionManager.prototype.priceToTick = function (price) {
        return Math.floor(Math.log(price) / Math.log(1.0001));
    };
    /**
     * Convert tick to price for V3
     * Formula: price = 1.0001^tick
     */
    NineMmV3PositionManager.prototype.tickToPrice = function (tick) {
        return Math.pow(1.0001, tick);
    };
    /**
     * Calculate tick range from price range
     */
    NineMmV3PositionManager.prototype.calculateTickRange = function (priceLower, priceUpper, tickSpacing) {
        var tickLower = Math.floor(this.priceToTick(priceLower) / tickSpacing) * tickSpacing;
        var tickUpper = Math.ceil(this.priceToTick(priceUpper) / tickSpacing) * tickSpacing;
        return { tickLower: tickLower, tickUpper: tickUpper };
    };
    /**
     * Get tick spacing for fee tier
     */
    NineMmV3PositionManager.prototype.getTickSpacing = function (feeTier) {
        var tickSpacingMap = {
            '2500': 50, // 0.25%
            '10000': 200, // 1%
            '20000': 200 // 2%
        };
        return tickSpacingMap[feeTier] || 60;
    };
    /**
     * Suggest optimal price ranges based on strategy
     */
    NineMmV3PositionManager.prototype.suggestOptimalRange = function (poolAddress, currentPrice, strategy, feeTier) {
        return __awaiter(this, void 0, void 0, function () {
            var ranges, multiplier, tickSpacing, priceLower, priceUpper, tickRange;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        ranges = {
                            conservative: { lower: 0.8, upper: 1.2 }, // ±20%
                            moderate: { lower: 0.9, upper: 1.1 }, // ±10%
                            aggressive: { lower: 0.95, upper: 1.05 } // ±5%
                        };
                        multiplier = ranges[strategy];
                        tickSpacing = this.getTickSpacing(feeTier);
                        priceLower = currentPrice * multiplier.lower;
                        priceUpper = currentPrice * multiplier.upper;
                        tickRange = this.calculateTickRange(priceLower, priceUpper, tickSpacing);
                        _a = {
                            lower: this.tickToPrice(tickRange.tickLower),
                            upper: this.tickToPrice(tickRange.tickUpper),
                            currentPrice: currentPrice
                        };
                        return [4 /*yield*/, this.estimateAPYForRange(poolAddress, tickRange)];
                    case 1: return [2 /*return*/, (_a.estimatedAPY = _b.sent(),
                            _a.inRange = true,
                            _a)];
                }
            });
        });
    };
    /**
     * Estimate APY for a specific tick range
     */
    NineMmV3PositionManager.prototype.estimateAPYForRange = function (poolAddress, tickRange) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, recentDays, avgDailyFees, rangeWidth, fullRangeWidth, concentrationFactor, tvl, baseAPY, concentratedAPY, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      query GetPoolFeeData($poolId: ID!) {\n        pool(id: $poolId) {\n          totalValueLockedUSD\n          feesUSD\n          poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n            date\n            feesUSD\n            tvlUSD\n            volumeUSD\n          }\n        }\n      }\n    "], ["\n      query GetPoolFeeData($poolId: ID!) {\n        pool(id: $poolId) {\n          totalValueLockedUSD\n          feesUSD\n          poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n            date\n            feesUSD\n            tvlUSD\n            volumeUSD\n          }\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                poolId: poolAddress.toLowerCase()
                            })];
                    case 2:
                        result = _a.sent();
                        if (!result.pool || !result.pool.poolDayData || result.pool.poolDayData.length === 0) {
                            return [2 /*return*/, 0];
                        }
                        recentDays = result.pool.poolDayData;
                        avgDailyFees = recentDays.reduce(function (sum, day) {
                            return sum + parseFloat(day.feesUSD);
                        }, 0) / recentDays.length;
                        rangeWidth = tickRange.tickUpper - tickRange.tickLower;
                        fullRangeWidth = 887272;
                        concentrationFactor = fullRangeWidth / rangeWidth;
                        tvl = parseFloat(result.pool.totalValueLockedUSD);
                        baseAPY = (avgDailyFees * 365 / tvl) * 100;
                        concentratedAPY = baseAPY * Math.sqrt(concentrationFactor);
                        return [2 /*return*/, Math.round(concentratedAPY * 100) / 100];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error estimating APY:', error_3);
                        return [2 /*return*/, 0];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if position is in range
     */
    NineMmV3PositionManager.prototype.isPositionInRange = function (position) {
        var currentTick = parseInt(position.pool.tick);
        var tickLower = parseInt(position.tickLower);
        var tickUpper = parseInt(position.tickUpper);
        return currentTick >= tickLower && currentTick <= tickUpper;
    };
    /**
     * Calculate unclaimed fees for a position
     */
    NineMmV3PositionManager.prototype.calculateUnclaimedFees = function (position) {
        // This is a simplified calculation
        // In reality, would need to call the contract to get exact unclaimed fees
        var deposited0 = parseFloat(position.depositedToken0);
        var deposited1 = parseFloat(position.depositedToken1);
        var withdrawn0 = parseFloat(position.withdrawnToken0);
        var withdrawn1 = parseFloat(position.withdrawnToken1);
        var collected0 = parseFloat(position.collectedFeesToken0);
        var collected1 = parseFloat(position.collectedFeesToken1);
        // Rough estimate of fees earned (would need contract call for exact)
        var estimatedFees0 = Math.max(0, (deposited0 - withdrawn0) * 0.01); // 1% estimate
        var estimatedFees1 = Math.max(0, (deposited1 - withdrawn1) * 0.01);
        return {
            fees0: estimatedFees0.toString(),
            fees1: estimatedFees1.toString()
        };
    };
    /**
     * Format position for display
     */
    NineMmV3PositionManager.prototype.formatPositionForDisplay = function (position, index) {
        var token0 = position.pool.token0.symbol;
        var token1 = position.pool.token1.symbol;
        var feeTier = this.formatFeeTier(position.pool.feeTier);
        var inRange = this.isPositionInRange(position);
        var rangeStatus = inRange ? '🟢 In Range' : '🔴 Out of Range';
        var unclaimedFees = this.calculateUnclaimedFees(position);
        var liquidity = ethers_1.ethers.formatUnits(position.liquidity, 18);
        var value0 = ethers_1.ethers.formatUnits(position.depositedToken0, position.pool.token0.decimals);
        var value1 = ethers_1.ethers.formatUnits(position.depositedToken1, position.pool.token1.decimals);
        return "".concat(index, ". **").concat(token0, "/").concat(token1, " ").concat(feeTier, "** - ").concat(rangeStatus, "\n   Position ID: #").concat(position.id.slice(0, 8), "...\n   Value: ").concat(parseFloat(value0).toFixed(4), " ").concat(token0, " + ").concat(parseFloat(value1).toFixed(4), " ").concat(token1, "\n   Unclaimed Fees: ~").concat(parseFloat(unclaimedFees.fees0).toFixed(4), " ").concat(token0, " + ~").concat(parseFloat(unclaimedFees.fees1).toFixed(4), " ").concat(token1);
    };
    /**
     * Get detailed position analytics with fee tracking
     */
    NineMmV3PositionManager.prototype.getPositionAnalytics = function (positionId) {
        return __awaiter(this, void 0, void 0, function () {
            var position, _a, feeEarnings, performance;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getPositionDetails(positionId)];
                    case 1:
                        position = _b.sent();
                        if (!position) {
                            return [2 /*return*/, { position: null, feeEarnings: null, performance: null }];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.feeTracker.getFeeEarningsHistory(positionId),
                                this.feeTracker.getPositionPerformance(position)
                            ])];
                    case 2:
                        _a = _b.sent(), feeEarnings = _a[0], performance = _a[1];
                        return [2 /*return*/, { position: position, feeEarnings: feeEarnings, performance: performance }];
                }
            });
        });
    };
    /**
     * Get daily fee earnings for a position
     */
    NineMmV3PositionManager.prototype.getDailyFeeEarnings = function (positionId_1) {
        return __awaiter(this, arguments, void 0, function (positionId, days) {
            if (days === void 0) { days = 30; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.feeTracker.getDailyFeeEarnings(positionId, days)];
            });
        });
    };
    /**
     * Format position with detailed analytics
     */
    NineMmV3PositionManager.prototype.formatPositionWithAnalytics = function (position, index) {
        return __awaiter(this, void 0, void 0, function () {
            var token0, token1, feeTier, inRange, rangeStatus, _a, feeEarnings, performance, dailyEarnings, totalReturn, timeInRange;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        token0 = position.pool.token0.symbol;
                        token1 = position.pool.token1.symbol;
                        feeTier = this.formatFeeTier(position.pool.feeTier);
                        inRange = this.isPositionInRange(position);
                        rangeStatus = inRange ? '🟢 In Range' : '🔴 Out of Range';
                        return [4 /*yield*/, Promise.all([
                                this.feeTracker.getFeeEarningsHistory(position.id),
                                this.feeTracker.getPositionPerformance(position)
                            ])];
                    case 1:
                        _a = _b.sent(), feeEarnings = _a[0], performance = _a[1];
                        dailyEarnings = feeEarnings.earningRate.dailyUSD;
                        totalReturn = performance.pnl.percentageReturn;
                        timeInRange = performance.risk.timeInRange;
                        return [2 /*return*/, "".concat(index, ". **").concat(token0, "/").concat(token1, " ").concat(feeTier, "** - ").concat(rangeStatus, "\n   Position ID: #").concat(position.id.slice(0, 8), "...\n   \n   \uD83D\uDCB0 **Earnings**: $").concat(feeEarnings.totalEarned.usd, " total | $").concat(dailyEarnings, "/day\n   \uD83D\uDCC8 **Performance**: ").concat(totalReturn, "% total return | ").concat(performance.pnl.annualizedReturn, "% APY\n   \u26A1 **Range**: ").concat(timeInRange, "% in-range | ").concat(performance.daysActive, " days active\n   \n   \uD83C\uDFAF **vs HODL**: ").concat(performance.vsHodl.outperformance, "% outperformance")];
                }
            });
        });
    };
    /**
     * Get position summary with key metrics
     */
    NineMmV3PositionManager.prototype.getPositionSummary = function (userAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var positions, totalValueUSD, totalFeesEarned, totalAPY, inRangeCount, _i, positions_1, position, feeEarnings, performance_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getUserPositions(userAddress)];
                    case 1:
                        positions = _a.sent();
                        if (positions.length === 0) {
                            return [2 /*return*/, {
                                    totalPositions: 0,
                                    totalValueUSD: 0,
                                    totalFeesEarned: 0,
                                    avgAPY: 0,
                                    inRangePositions: 0
                                }];
                        }
                        totalValueUSD = 0;
                        totalFeesEarned = 0;
                        totalAPY = 0;
                        inRangeCount = 0;
                        _i = 0, positions_1 = positions;
                        _a.label = 2;
                    case 2:
                        if (!(_i < positions_1.length)) return [3 /*break*/, 6];
                        position = positions_1[_i];
                        return [4 /*yield*/, this.feeTracker.getFeeEarningsHistory(position.id)];
                    case 3:
                        feeEarnings = _a.sent();
                        return [4 /*yield*/, this.feeTracker.getPositionPerformance(position)];
                    case 4:
                        performance_1 = _a.sent();
                        totalValueUSD += parseFloat(performance_1.currentValue.totalUSD);
                        totalFeesEarned += parseFloat(feeEarnings.totalEarned.usd);
                        totalAPY += performance_1.pnl.annualizedReturn;
                        if (this.isPositionInRange(position)) {
                            inRangeCount++;
                        }
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, {
                            totalPositions: positions.length,
                            totalValueUSD: Math.round(totalValueUSD * 100) / 100,
                            totalFeesEarned: Math.round(totalFeesEarned * 100) / 100,
                            avgAPY: Math.round((totalAPY / positions.length) * 100) / 100,
                            inRangePositions: inRangeCount
                        }];
                }
            });
        });
    };
    /**
     * Format fee tier for display
     */
    NineMmV3PositionManager.prototype.formatFeeTier = function (feeTier) {
        var tierMap = {
            '2500': '0.25%',
            '10000': '1%',
            '20000': '2%'
        };
        return tierMap[feeTier] || "".concat(parseInt(feeTier) / 10000, "%");
    };
    return NineMmV3PositionManager;
}());
exports.NineMmV3PositionManager = NineMmV3PositionManager;
var templateObject_1, templateObject_2, templateObject_3;
