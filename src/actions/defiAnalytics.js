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
var graphql_request_1 = require("graphql-request");
var _9mm_v3_pool_discovery_js_1 = require("../utils/9mm-v3-pool-discovery.js");
var defiAnalyticsAction = {
    name: "DEFI_ANALYTICS",
    similes: [
        "MARKET_ANALYTICS",
        "DEFI_DASHBOARD",
        "MARKET_OVERVIEW",
        "TOP_TOKENS",
        "YIELD_OPPORTUNITIES",
        "TRENDING_POOLS"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            return [2 /*return*/, text.includes('defi') || text.includes('analytics') || text.includes('stats') || text.includes('overview')];
        });
    }); },
    description: "Get comprehensive DeFi analytics and market overview for 9mm DEX",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, poolDiscovery_1, pools, responseText, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    poolDiscovery_1 = new _9mm_v3_pool_discovery_js_1.NineMmPoolDiscoveryService();
                    return [4 /*yield*/, poolDiscovery_1.getAllAvailablePools({
                            sortBy: 'totalValueLockedUSD',
                            sortDirection: 'desc'
                        })];
                case 1:
                    pools = _c.sent();
                    responseText = '';
                    if (text.includes('detailed') || text.includes('full')) {
                        // Full detailed analytics
                        responseText = "\uD83D\uDCCA **Complete 9mm DEX Analytics Dashboard**\n\n\uD83C\uDFC6 **Market Overview:**\n\u2022 Total Pools: ".concat(pools.length, "\n\u2022 Top Pools Available: ").concat(Math.min(5, pools.length), "\n\n\uD83D\uDCB0 **Top Performing Pools:**\n").concat(pools.slice(0, 5).map(function (pool, i) {
                            var apy = poolDiscovery_1.calculateEstimatedAPY(pool);
                            return "".concat(i + 1, ". **").concat(pool.token0.symbol, "/").concat(pool.token1.symbol, "** (").concat(poolDiscovery_1.formatFeeTier(pool.feeTier), ")\n   \u2022 TVL: $").concat(parseFloat(pool.totalValueLockedUSD).toLocaleString(), "\n   \u2022 24h Volume: $").concat(parseFloat(pool.volumeUSD).toLocaleString(), "\n   \u2022 Est. APY: ").concat(apy.toFixed(2), "%");
                        }).join('\n\n'), "\n\n\uD83D\uDCC8 **Data Source**: Real-time from 9mm V3 Subgraph\n\n**Detailed Analytics:**\n\u2022 \"Show trending tokens\" - Top performing tokens\n\u2022 \"Best yield opportunities\" - Highest APY pools\n\u2022 \"Show trending pools\" - Most active liquidity pools");
                    }
                    else {
                        responseText = "\uD83D\uDCCA **DeFi Analytics Hub**\n\nWhat would you like to explore?\n\n**\uD83D\uDCC8 Market Overview**:\n\u2022 \"Show market overview\" - Global DeFi metrics\n\u2022 \"DeFi dashboard\" - Complete market snapshot\n\n**\uD83D\uDE80 Trending**:\n\u2022 \"Show trending tokens\" - Top performers\n\u2022 \"Trending pools\" - Hottest liquidity pairs\n\u2022 \"Market analytics\" - Price movements & volume\n\n**\uD83D\uDCB0 Yield Farming**:\n\u2022 \"Best yield opportunities\" - Highest APY pools\n\u2022 \"Show staking rewards\" - Passive income options\n\u2022 \"Yield strategy\" - Optimized farming plans\n\n**\u26D3\uFE0F Cross-Chain**:\n\u2022 \"Compare chains\" - TVL & volume across networks\n\u2022 \"Chain analytics\" - Individual network metrics\n\n*Data sourced from: 9mm V3 Subgraph (PulseChain only)*";
                    }
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 2:
                    error_1 = _c.sent();
                    console.error('DeFi analytics action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to load DeFi analytics: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Show market analytics" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you comprehensive DeFi market analytics including TVL, volume, and trending opportunities across all chains.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Best yield opportunities" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me find the highest APY yield farming opportunities with risk assessments across all supported networks.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Trending tokens" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you the top performing tokens with price movements, volume, and momentum indicators.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ]
    ],
};
// Function to fetch real analytics data from 9mm subgraph
function getAnalyticsData(client, analyticsType) {
    return __awaiter(this, void 0, void 0, function () {
        var poolsQuery, result, pools, totalTvl, totalVolume24h, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    poolsQuery = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n            query GetTopPools {\n                pools(\n                    first: 20\n                    orderBy: totalValueLockedUSD\n                    orderDirection: desc\n                    where: { totalValueLockedUSD_gt: \"1000\" }\n                ) {\n                    id\n                    token0 {\n                        symbol\n                        id\n                    }\n                    token1 {\n                        symbol  \n                        id\n                    }\n                    feeTier\n                    totalValueLockedUSD\n                    volumeUSD\n                    token0Price\n                    token1Price\n                    poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n                        volumeUSD\n                        tvlUSD\n                        feesUSD\n                        date\n                    }\n                }\n            }\n        "], ["\n            query GetTopPools {\n                pools(\n                    first: 20\n                    orderBy: totalValueLockedUSD\n                    orderDirection: desc\n                    where: { totalValueLockedUSD_gt: \"1000\" }\n                ) {\n                    id\n                    token0 {\n                        symbol\n                        id\n                    }\n                    token1 {\n                        symbol  \n                        id\n                    }\n                    feeTier\n                    totalValueLockedUSD\n                    volumeUSD\n                    token0Price\n                    token1Price\n                    poolDayData(first: 7, orderBy: date, orderDirection: desc) {\n                        volumeUSD\n                        tvlUSD\n                        feesUSD\n                        date\n                    }\n                }\n            }\n        "])));
                    return [4 /*yield*/, client.request(poolsQuery)];
                case 1:
                    result = _a.sent();
                    if (!result.pools || result.pools.length === 0) {
                        return [2 /*return*/, null]; // Will trigger error message
                    }
                    pools = result.pools;
                    totalTvl = pools.reduce(function (sum, pool) {
                        return sum + parseFloat(pool.totalValueLockedUSD);
                    }, 0);
                    totalVolume24h = pools.reduce(function (sum, pool) {
                        var latestDay = pool.poolDayData[0];
                        return sum + (latestDay ? parseFloat(latestDay.volumeUSD) : 0);
                    }, 0);
                    // Format data for different analytics types
                    return [2 /*return*/, {
                            overview: {
                                totalTvl: totalTvl,
                                totalVolume24h: totalVolume24h,
                                totalPools: pools.length,
                                topPools: pools.slice(0, 5).map(function (pool) { return ({
                                    pair: "".concat(pool.token0.symbol, "/").concat(pool.token1.symbol),
                                    tvl: parseFloat(pool.totalValueLockedUSD),
                                    volume24h: pool.poolDayData[0] ? parseFloat(pool.poolDayData[0].volumeUSD) : 0,
                                    feeTier: pool.feeTier
                                }); })
                            },
                            trending: {
                                tokens: [], // Would need token-specific queries
                                pools: pools.slice(0, 10).map(function (pool) {
                                    var latestDay = pool.poolDayData[0];
                                    var tvl = parseFloat(pool.totalValueLockedUSD);
                                    var volume24h = latestDay ? parseFloat(latestDay.volumeUSD) : 0;
                                    var fees24h = latestDay ? parseFloat(latestDay.feesUSD) : 0;
                                    // Estimate APY based on fees vs TVL
                                    var apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;
                                    return {
                                        pair: "".concat(pool.token0.symbol, "/").concat(pool.token1.symbol),
                                        apy: apy,
                                        tvl: tvl,
                                        volume24h: volume24h,
                                        chain: "PulseChain"
                                    };
                                })
                            },
                            yield: {
                                opportunities: pools.slice(0, 10).map(function (pool) {
                                    var latestDay = pool.poolDayData[0];
                                    var tvl = parseFloat(pool.totalValueLockedUSD);
                                    var volume24h = latestDay ? parseFloat(latestDay.volumeUSD) : 0;
                                    var fees24h = latestDay ? parseFloat(latestDay.feesUSD) : 0;
                                    // Estimate APY and risk level
                                    var apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;
                                    var risk = apy > 100 ? "High" : apy > 25 ? "Medium" : "Low";
                                    return {
                                        protocol: "9mm V3",
                                        pair: "".concat(pool.token0.symbol, "/").concat(pool.token1.symbol),
                                        apy: apy,
                                        risk: risk,
                                        chain: "PulseChain",
                                        minDeposit: 100
                                    };
                                }).filter(function (opp) { return opp.apy > 0; }) // Only show pools with positive APY
                            }
                        }];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error fetching analytics data:', error_2);
                    return [2 /*return*/, null]; // Will trigger error message
                case 3: return [2 /*return*/];
            }
        });
    });
}
exports.default = defiAnalyticsAction;
var templateObject_1;
