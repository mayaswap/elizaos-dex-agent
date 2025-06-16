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
var chains_js_1 = require("../config/chains.js");
var addLiquidityAction = {
    name: "ADD_LIQUIDITY",
    similes: [
        "PROVIDE_LIQUIDITY",
        "ADD_TO_POOL",
        "SUPPLY_LIQUIDITY",
        "BECOME_LP",
        "ADD_LP",
        "CREATE_POSITION"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    if (!text) {
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _c.sent();
                    return [2 /*return*/, parsed.intent === 'addLiquidity' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Add liquidity to 9mm V3 pools using natural language commands",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed, poolDiscovery, positionManager, pulsechainTokens, token0Address, token1Address, pools, filteredPools, selectedPool, feeTierMap, feeTier, tvl, dayData, avgDailyFees, estimatedAPY, rangeStrategy, rangeWidth, responseText, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    if (!text) {
                        if (callback) {
                            callback({
                                text: "❌ No message text provided"
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _c.sent();
                    if (!parsed.fromToken || !parsed.toToken) {
                        if (callback) {
                            callback({
                                text: "I need to know which token pair you want to provide liquidity for. Please specify both tokens. For example: 'Add liquidity to PLS/USDC pool with 1000 USDC'"
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 4, , 5]);
                    poolDiscovery = new _9mm_v3_pool_discovery_js_1.NineMmPoolDiscoveryService();
                    positionManager = new _9mm_v3_position_manager_js_1.NineMmV3PositionManager();
                    pulsechainTokens = chains_js_1.POPULAR_TOKENS.pulsechain;
                    token0Address = pulsechainTokens[parsed.fromToken];
                    token1Address = pulsechainTokens[parsed.toToken];
                    if (!token0Address || !token1Address) {
                        throw new Error("Token not found: ".concat(parsed.fromToken, " or ").concat(parsed.toToken));
                    }
                    return [4 /*yield*/, poolDiscovery.getAllAvailablePools({
                            sortBy: 'totalValueLockedUSD',
                            sortDirection: 'desc'
                        })];
                case 3:
                    pools = _c.sent();
                    filteredPools = pools.filter(function (pool) {
                        return (pool.token0.symbol === parsed.fromToken && pool.token1.symbol === parsed.toToken) ||
                            (pool.token0.symbol === parsed.toToken && pool.token1.symbol === parsed.fromToken);
                    });
                    selectedPool = filteredPools[0];
                    if (!selectedPool) {
                        if (callback) {
                            callback({
                                text: "\u274C No liquidity pools found for ".concat(parsed.fromToken, "/").concat(parsed.toToken, " pair.\n\n\uD83D\uDCA1 **Suggested Actions:**\n\u2022 Check if both tokens exist on 9mm DEX\n\u2022 Try creating a new pool if you have sufficient liquidity\n\u2022 Consider other token pairs with better liquidity\n\n\uD83D\uDD17 **Create Pool**: Visit [9mm.pro](https://9mm.pro) \u2192 Pools \u2192 Create")
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    feeTierMap = {
                        '2500': '0.25%',
                        '10000': '1%',
                        '20000': '2%'
                    };
                    feeTier = feeTierMap[selectedPool.feeTier] || "".concat(parseInt(selectedPool.feeTier) / 10000, "%");
                    tvl = parseFloat(selectedPool.totalValueLockedUSD).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD'
                    });
                    dayData = selectedPool.poolDayData || [];
                    avgDailyFees = dayData.length > 0
                        ? dayData.reduce(function (sum, day) { return sum + parseFloat(day.feesUSD); }, 0) / dayData.length
                        : 0;
                    estimatedAPY = selectedPool.totalValueLockedUSD !== '0'
                        ? (avgDailyFees * 365 / parseFloat(selectedPool.totalValueLockedUSD)) * 100
                        : 0;
                    rangeStrategy = parsed.rangeType || 'moderate';
                    rangeWidth = '';
                    switch (rangeStrategy) {
                        case 'full':
                            rangeWidth = 'Full Range (Infinite)';
                            break;
                        case 'concentrated':
                            rangeWidth = '±5% (Aggressive - Higher returns, more management)';
                            break;
                        default:
                            rangeWidth = '±10% (Moderate - Balanced returns and risk)';
                    }
                    responseText = "\uD83C\uDFCA\u200D\u2642\uFE0F **Liquidity Pool Information**\n\n\uD83D\uDCB0 **Pool: ".concat(parsed.fromToken, "/").concat(parsed.toToken, "**\n\u2022 Fee Tier: ").concat(feeTier, "\n\u2022 TVL: ").concat(tvl, "\n\u2022 Pool Address: `").concat(selectedPool.id, "`\n\n\uD83D\uDCCA **Performance Metrics:**\n\u2022 24h Volume: $").concat(parseFloat(selectedPool.volumeUSD).toLocaleString(), "\n\u2022 24h Fees: $").concat(parseFloat(selectedPool.feesUSD || '0').toLocaleString(), "\n\u2022 Estimated APY: ").concat(estimatedAPY.toFixed(2), "%\n\n\uD83D\uDCB1 **Current Price:**\n\u2022 Current Price: ").concat(parseFloat(selectedPool.token0Price).toFixed(6), " ").concat(parsed.toToken, " per ").concat(parsed.fromToken, "\n\n\uD83D\uDCB0 **Position Details:**\n").concat(parsed.amount ? "\u2022 Amount: ".concat(parsed.amount, " ").concat(parsed.fromToken) : '• Amount: Not specified', "\n\u2022 Price Range: ").concat(rangeWidth, "\n\n\u26A1 **Next Steps:**\n1. Connect your wallet\n2. Approve token spending\n3. Add liquidity with selected parameters\n4. Monitor position performance\n\n*Note: V3 positions require active management. Out-of-range positions don't earn fees.*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_1 = _c.sent();
                    console.error('Add liquidity action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to prepare liquidity addition: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
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
                content: { text: "Add liquidity to PLS/USDC pool with 1000 USDC" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll help you add liquidity to the PLS/USDC pool. Let me find the best pool options for you.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "I want to provide liquidity for HEX and DAI" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll search for HEX/DAI liquidity pools and show you the best options with current APY rates.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Create a concentrated position in WPLS/USDT 1% pool" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll set up a concentrated liquidity position in the WPLS/USDT 1% fee tier pool for maximum capital efficiency.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ]
    ],
};
exports.default = addLiquidityAction;
