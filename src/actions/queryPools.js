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
var smartParser_js_1 = require("../utils/smartParser.js");
var _9mm_v3_pool_discovery_js_1 = require("../utils/9mm-v3-pool-discovery.js");
var _9mm_v3_position_manager_js_1 = require("../utils/9mm-v3-position-manager.js");
var _9mm_v3_fee_tracker_js_1 = require("../utils/9mm-v3-fee-tracker.js");
var chains_js_1 = require("../config/chains.js");
var queryPoolsAction = {
    name: "QUERY_POOLS",
    similes: [
        "SHOW_POOLS",
        "LIST_POOLS",
        "FIND_POOLS",
        "SEARCH_POOLS",
        "POOL_INFO",
        "SHOW_POSITIONS",
        "MY_POSITIONS",
        "LP_POSITIONS"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = message.content.text;
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _a.sent();
                    return [2 /*return*/, parsed.intent === 'poolQuery' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Query 9mm V3 liquidity pools and positions using natural language",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed, poolDiscovery, positionManager, feeTracker, pulsechainTokens, token0Address, token1Address, pools, poolsInfo, responseText_1, responseText_2, allPools, topPoolsInfo, totalPools, responseText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = message.content.text;
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    poolDiscovery = new _9mm_v3_pool_discovery_js_1.NineMmPoolDiscoveryService();
                    positionManager = new _9mm_v3_position_manager_js_1.NineMmV3PositionManager();
                    feeTracker = new _9mm_v3_fee_tracker_js_1.NineMmV3FeeTracker();
                    if (!(parsed.fromToken && parsed.toToken)) return [3 /*break*/, 4];
                    pulsechainTokens = chains_js_1.POPULAR_TOKENS.pulsechain;
                    token0Address = pulsechainTokens[parsed.fromToken];
                    token1Address = pulsechainTokens[parsed.toToken];
                    if (!token0Address || !token1Address) {
                        throw new Error("Token not found: ".concat(parsed.fromToken, " or ").concat(parsed.toToken));
                    }
                    return [4 /*yield*/, poolDiscovery.findPools(token0Address, token1Address)];
                case 3:
                    pools = _a.sent();
                    if (pools.length === 0) {
                        if (callback) {
                            callback({
                                text: "\u274C No ".concat(parsed.fromToken, "/").concat(parsed.toToken, " pools found on 9mm V3.")
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    poolsInfo = pools.map(function (pool, index) {
                        var feeTierMap = {
                            '2500': '0.25%',
                            '10000': '1%',
                            '20000': '2%'
                        };
                        var feeTier = feeTierMap[pool.feeTier] || "".concat(parseInt(pool.feeTier) / 10000, "%");
                        var tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                        var volume24h = parseFloat(pool.volumeUSD).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                        // Calculate APY from recent fees
                        var dayData = pool.poolDayData || [];
                        var recentFees = dayData.slice(0, 7).reduce(function (sum, day) { return sum + parseFloat(day.feesUSD); }, 0);
                        var avgDailyFees = recentFees / Math.max(dayData.length, 1);
                        var estimatedAPY = (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;
                        return "".concat(index + 1, ". **").concat(parsed.fromToken, "/").concat(parsed.toToken, " - ").concat(feeTier, " Pool**\n   \u2022 TVL: ").concat(tvl, "\n   \u2022 24h Volume: ").concat(volume24h, "\n   \u2022 Estimated APY: ").concat(estimatedAPY.toFixed(2), "%\n   \u2022 Current Price: ").concat(parseFloat(pool.token0Price).toFixed(6), " ").concat(parsed.toToken, " per ").concat(parsed.fromToken);
                    }).join('\n\n');
                    responseText_1 = "\uD83C\uDFCA **".concat(parsed.fromToken, "/").concat(parsed.toToken, " Liquidity Pools on 9mm V3**\n\n").concat(poolsInfo, "\n\n\uD83D\uDCA1 **Tips:**\n\u2022 Higher TVL pools typically have less slippage\n\u2022 Fee tier affects your earning potential (higher fees = higher returns but less volume)\n\u2022 Consider APY vs IL risk when choosing pools\n\u2022 Use \"Add liquidity to [pool]\" to provide liquidity");
                    if (callback) {
                        callback({
                            text: responseText_1
                        });
                    }
                    return [2 /*return*/, true];
                case 4:
                    // Check if querying user positions
                    if (text.toLowerCase().includes('my') || text.toLowerCase().includes('position')) {
                        responseText_2 = "\uD83D\uDCCA **Liquidity Position Management**\n\nTo view your positions, I would need access to your wallet address.\n\n**What I can show you:**\n\u2022 All your active V3 positions\n\u2022 Position performance and fee earnings\n\u2022 In-range vs out-of-range status\n\u2022 P&L analysis vs HODL strategy\n\u2022 Real-time APY calculations\n\n**Example queries:**\n\u2022 \"Show my liquidity positions\"\n\u2022 \"How are my LP positions performing?\"\n\u2022 \"Show my PLS/USDC positions\"\n\u2022 \"Which of my positions are out of range?\"\n\n*Note: Connect your wallet to see actual positions.*";
                        if (callback) {
                            callback({
                                text: responseText_2
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, poolDiscovery.getAllAvailablePools({
                            minimumTVL: 10000,
                            sortBy: 'totalValueLockedUSD',
                            sortDirection: 'desc'
                        })];
                case 5:
                    allPools = _a.sent();
                    if (allPools.length === 0) {
                        if (callback) {
                            callback({
                                text: "❌ No pools found with TVL > $10,000. The DEX might be experiencing low liquidity."
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    topPoolsInfo = allPools.slice(0, 5).map(function (pool, index) {
                        var feeTierMap = {
                            '2500': '0.25%',
                            '10000': '1%',
                            '20000': '2%'
                        };
                        var feeTier = feeTierMap[pool.feeTier] || "".concat(parseInt(pool.feeTier) / 10000, "%");
                        var tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                        var volume24h = parseFloat(pool.volumeUSD).toLocaleString('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        });
                        // Calculate APY
                        var dayData = pool.poolDayData || [];
                        var recentFees = dayData.slice(0, 7).reduce(function (sum, day) { return sum + parseFloat(day.feesUSD); }, 0);
                        var avgDailyFees = recentFees / Math.max(dayData.length, 1);
                        var estimatedAPY = (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;
                        var recommendation = estimatedAPY > 50 ? '🔥 High Yield' :
                            estimatedAPY > 20 ? '✅ Good Returns' :
                                '💡 Stable Pool';
                        return "".concat(index + 1, ". **").concat(pool.token0.symbol, "/").concat(pool.token1.symbol, " - ").concat(feeTier, "** ").concat(recommendation, "\n   \u2022 TVL: ").concat(tvl, "\n   \u2022 24h Volume: ").concat(volume24h, "\n   \u2022 APY: ").concat(estimatedAPY.toFixed(2), "%");
                    }).join('\n\n');
                    totalPools = allPools.length;
                    responseText = "\uD83C\uDFCA **Top Liquidity Pools on 9mm V3**\n\n".concat(topPoolsInfo, "\n\n\uD83D\uDCCA **Pool Statistics:**\n\u2022 Total Pools Available: ").concat(totalPools, "\n\u2022 Pools with TVL > $10K: ").concat(totalPools, "\n\u2022 Average APY: ").concat((allPools.slice(0, 5).reduce(function (sum, pool) {
                        var dayData = pool.poolDayData || [];
                        var recentFees = dayData.slice(0, 7).reduce(function (s, d) { return s + parseFloat(d.feesUSD); }, 0);
                        var avgDailyFees = recentFees / Math.max(dayData.length, 1);
                        return sum + (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;
                    }, 0) / Math.min(allPools.length, 5)).toFixed(2), "%\n\n\uD83D\uDCA1 **Quick Actions:**\n\u2022 \"Show WPLS/USDC pools\" - Find specific pairs\n\u2022 \"Add liquidity to [token]/[token]\" - Provide liquidity\n\u2022 \"Show my positions\" - View your LP positions\n\n*Data refreshed from 9mm V3 subgraph*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 6:
                    error_1 = _a.sent();
                    console.error('Query pools action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to query pools: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Show me the best liquidity pools" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll find the top liquidity pools on 9mm V3 sorted by TVL and APY for you.",
                    action: "QUERY_POOLS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "What pools are available for WPLS and USDC?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me search for all WPLS/USDC liquidity pools and show you their current stats and yields.",
                    action: "QUERY_POOLS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my liquidity positions" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll retrieve all your active liquidity positions with their current performance metrics.",
                    action: "QUERY_POOLS"
                }
            }
        ]
    ],
};
exports.default = queryPoolsAction;
