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
exports.NineMmPoolDiscoveryService = void 0;
var graphql_request_1 = require("graphql-request");
var graphql_request_2 = require("graphql-request");
// 9mm V3 Subgraph URL
var SUBGRAPH_URL = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';
var NineMmPoolDiscoveryService = /** @class */ (function () {
    function NineMmPoolDiscoveryService() {
        this.client = new graphql_request_2.GraphQLClient(SUBGRAPH_URL);
    }
    /**
     * Find all pools for a specific token pair
     */
    NineMmPoolDiscoveryService.prototype.findPools = function (token0Address, token1Address) {
        return __awaiter(this, void 0, void 0, function () {
            var token0, token1, query, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token0 = token0Address.toLowerCase();
                        token1 = token1Address.toLowerCase();
                        query = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      query FindPools($token0: String!, $token1: String!) {\n        pools(\n          where: {\n            or: [\n              { token0: $token0, token1: $token1 },\n              { token0: $token1, token1: $token0 }\n            ]\n          }\n          orderBy: volumeUSD\n          orderDirection: desc\n        ) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n        }\n      }\n    "], ["\n      query FindPools($token0: String!, $token1: String!) {\n        pools(\n          where: {\n            or: [\n              { token0: $token0, token1: $token1 },\n              { token0: $token1, token1: $token0 }\n            ]\n          }\n          orderBy: volumeUSD\n          orderDirection: desc\n        ) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                token0: token0,
                                token1: token1
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.pools];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Error fetching pools:', error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all pools with optional filtering and sorting
     */
    NineMmPoolDiscoveryService.prototype.getAllAvailablePools = function (criteria) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      query GetAllPools($orderBy: String!, $orderDirection: String!, $minTVL: BigDecimal) {\n        pools(\n          first: 100,\n          orderBy: $orderBy,\n          orderDirection: $orderDirection,\n          where: { totalValueLockedUSD_gte: $minTVL }\n        ) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n          poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n            date\n            volumeUSD\n            feesUSD\n            tvlUSD\n          }\n        }\n      }\n    "], ["\n      query GetAllPools($orderBy: String!, $orderDirection: String!, $minTVL: BigDecimal) {\n        pools(\n          first: 100,\n          orderBy: $orderBy,\n          orderDirection: $orderDirection,\n          where: { totalValueLockedUSD_gte: $minTVL }\n        ) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n          poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n            date\n            volumeUSD\n            feesUSD\n            tvlUSD\n          }\n        }\n      }\n    "])));
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                orderBy: criteria.sortBy,
                                orderDirection: criteria.sortDirection,
                                minTVL: ((_a = criteria.minimumTVL) === null || _a === void 0 ? void 0 : _a.toString()) || '0'
                            })];
                    case 2:
                        result = _b.sent();
                        // Filter by preferred fee tier if specified
                        if (criteria.preferredFeeTier) {
                            return [2 /*return*/, result.pools.filter(function (pool) { return pool.feeTier === criteria.preferredFeeTier; })];
                        }
                        return [2 /*return*/, result.pools];
                    case 3:
                        error_2 = _b.sent();
                        console.error('Error fetching all pools:', error_2);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get detailed information about a specific pool
     */
    NineMmPoolDiscoveryService.prototype.getPoolDetails = function (poolAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var query, result, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        query = (0, graphql_request_1.gql)(templateObject_3 || (templateObject_3 = __makeTemplateObject(["\n      query GetPoolDetails($poolId: ID!) {\n        pool(id: $poolId) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n          sqrtPrice\n          tick\n          observationIndex\n          feeProtocol\n          untrackedVolumeUSD\n          collectedFeesToken0\n          collectedFeesToken1\n          collectedFeesUSD\n        }\n      }\n    "], ["\n      query GetPoolDetails($poolId: ID!) {\n        pool(id: $poolId) {\n          id\n          token0 {\n            id\n            symbol\n            name\n            decimals\n          }\n          token1 {\n            id\n            symbol\n            name\n            decimals\n          }\n          feeTier\n          liquidity\n          totalValueLockedUSD\n          volumeUSD\n          feesUSD\n          txCount\n          token0Price\n          token1Price\n          sqrtPrice\n          tick\n          observationIndex\n          feeProtocol\n          untrackedVolumeUSD\n          collectedFeesToken0\n          collectedFeesToken1\n          collectedFeesUSD\n        }\n      }\n    "])));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.client.request(query, {
                                poolId: poolAddress.toLowerCase()
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.pool];
                    case 3:
                        error_3 = _a.sent();
                        console.error('Error fetching pool details:', error_3);
                        return [2 /*return*/, null];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Format fee tier for display
     */
    NineMmPoolDiscoveryService.prototype.formatFeeTier = function (feeTier) {
        var tierMap = {
            '2500': '0.25%',
            '10000': '1%',
            '20000': '2%'
        };
        return tierMap[feeTier] || "".concat(parseInt(feeTier) / 10000, "%");
    };
    /**
     * Calculate estimated APY based on recent fees and TVL
     */
    NineMmPoolDiscoveryService.prototype.calculateEstimatedAPY = function (pool) {
        var tvl = parseFloat(pool.totalValueLockedUSD);
        if (tvl === 0)
            return 0;
        // Use recent poolDayData if available for more accurate APY
        if (pool.poolDayData && pool.poolDayData.length > 0) {
            // Calculate average daily fees from recent data (last 7 days)
            var recentDays = pool.poolDayData.slice(0, Math.min(7, pool.poolDayData.length));
            var totalRecentFees = recentDays.reduce(function (sum, day) { return sum + parseFloat(day.feesUSD); }, 0);
            var avgDailyFees = totalRecentFees / recentDays.length;
            // Estimate annual fees based on recent daily average
            var annualFees = avgDailyFees * 365;
            var apy = (annualFees / tvl) * 100;
            return Math.round(apy * 100) / 100; // Round to 2 decimal places
        }
        // Fallback: If no recent data, return 0 or use a conservative estimate
        // Don't use total historical fees as it's misleading
        return 0;
    };
    /**
     * Get recommendation based on pool metrics
     */
    NineMmPoolDiscoveryService.prototype.getPoolRecommendation = function (pool) {
        var tvl = parseFloat(pool.totalValueLockedUSD);
        var volume = parseFloat(pool.volumeUSD);
        var txCount = parseInt(pool.txCount);
        if (tvl > 1000000 && volume > 500000) {
            return 'Most Liquid & Active';
        }
        else if (volume > 100000) {
            return 'High Volume';
        }
        else if (tvl > 500000) {
            return 'Stable TVL';
        }
        else if (txCount > 1000) {
            return 'Active Trading';
        }
        else {
            return 'Emerging Pool';
        }
    };
    /**
     * Format pool for display in chat
     */
    NineMmPoolDiscoveryService.prototype.formatPoolForDisplay = function (pool, index) {
        var feeTier = this.formatFeeTier(pool.feeTier);
        var tvl = this.formatUSD(pool.totalValueLockedUSD);
        // Show recent volume (24h) if available, otherwise show total with warning
        var volumeDisplay;
        if (pool.poolDayData && pool.poolDayData.length > 0 && pool.poolDayData[0]) {
            var recentVolume = pool.poolDayData[0].volumeUSD; // Most recent day
            volumeDisplay = "".concat(this.formatUSD(recentVolume), " (24h)");
        }
        else {
            volumeDisplay = "".concat(this.formatUSD(pool.volumeUSD), " (total)");
        }
        var apy = this.calculateEstimatedAPY(pool);
        var recommendation = this.getPoolRecommendation(pool);
        return "".concat(index, ". **").concat(feeTier, " Fee Tier** - Vol: ").concat(volumeDisplay, " | TVL: ").concat(tvl, " | APY: ~").concat(apy, "% | ").concat(recommendation);
    };
    /**
     * Format USD amounts
     */
    NineMmPoolDiscoveryService.prototype.formatUSD = function (amount) {
        var value = parseFloat(amount);
        if (value >= 1000000) {
            return "$".concat((value / 1000000).toFixed(1), "M");
        }
        else if (value >= 1000) {
            return "$".concat((value / 1000).toFixed(1), "K");
        }
        else {
            return "$".concat(value.toFixed(2));
        }
    };
    return NineMmPoolDiscoveryService;
}());
exports.NineMmPoolDiscoveryService = NineMmPoolDiscoveryService;
var templateObject_1, templateObject_2, templateObject_3;
