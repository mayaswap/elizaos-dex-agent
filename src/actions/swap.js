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
var aggregator_js_1 = require("../utils/aggregator.js");
var chains_js_1 = require("../config/chains.js");
// Token metadata for proper decimal handling
var TOKEN_METADATA = {
    'PLS': { decimals: 18, symbol: 'PLS' },
    'WPLS': { decimals: 18, symbol: 'WPLS' },
    'USDC': { decimals: 6, symbol: 'USDC' },
    'USDT': { decimals: 6, symbol: 'USDT' },
    'DAI': { decimals: 18, symbol: 'DAI' },
    'HEX': { decimals: 8, symbol: 'HEX' },
    'PLSX': { decimals: 18, symbol: 'PLSX' },
    '9MM': { decimals: 18, symbol: '9MM' },
    'WETH': { decimals: 18, symbol: 'WETH' },
};
var swapAction = {
    name: "EXECUTE_SWAP",
    similes: [
        "SWAP_TOKENS",
        "TRADE_TOKENS",
        "EXCHANGE_TOKENS",
        "CONVERT_TOKENS",
        "BUY_TOKENS",
        "SELL_TOKENS"
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
                    // Valid if it's a swap command with sufficient confidence
                    return [2 /*return*/, parsed.intent === 'swap' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Execute token swaps using natural language commands via 9mm DEX aggregator",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed, aggregator, pulsechainTokens, fromTokenAddress, toTokenAddress, fromTokenMeta, toTokenMeta, amountInWei, quote, priceImpact, gasEstimate, gasValue, buyAmountFormatted, price, routeDisplay, responseText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = message.content.text;
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _a.sent();
                    if (!parsed.fromToken || !parsed.toToken || !parsed.amount) {
                        if (callback) {
                            callback({
                                text: "I need more details for the swap. Please specify the amount, source token, and destination token. For example: 'Swap 100 USDC for WPLS'"
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    aggregator = new aggregator_js_1.NineMMAggregator(369);
                    pulsechainTokens = chains_js_1.POPULAR_TOKENS.pulsechain;
                    fromTokenAddress = pulsechainTokens[parsed.fromToken];
                    toTokenAddress = pulsechainTokens[parsed.toToken];
                    if (!fromTokenAddress || !toTokenAddress) {
                        throw new Error("Token not found: ".concat(parsed.fromToken, " or ").concat(parsed.toToken));
                    }
                    fromTokenMeta = TOKEN_METADATA[parsed.fromToken] || { decimals: 18, symbol: parsed.fromToken };
                    toTokenMeta = TOKEN_METADATA[parsed.toToken] || { decimals: 18, symbol: parsed.toToken };
                    amountInWei = aggregator_js_1.NineMMAggregator.formatAmount(parsed.amount.toString(), fromTokenMeta.decimals);
                    return [4 /*yield*/, aggregator.getSwapQuote({
                            fromToken: fromTokenAddress,
                            toToken: toTokenAddress,
                            amount: amountInWei,
                            slippagePercentage: 0.5, // 0.5% default slippage
                            userAddress: "0x0000000000000000000000000000000000000000", // Placeholder
                            chainId: 369
                        })];
                case 3:
                    quote = _a.sent();
                    priceImpact = quote.estimatedPriceImpact && quote.estimatedPriceImpact !== '0'
                        ? "".concat(parseFloat(quote.estimatedPriceImpact).toFixed(2), "%")
                        : '< 0.01%';
                    gasEstimate = 'N/A';
                    try {
                        if (quote.gas) {
                            gasValue = typeof quote.gas === 'string' ? parseFloat(quote.gas) : quote.gas;
                            gasEstimate = "~".concat(Math.round(gasValue / 1000), "K");
                        }
                    }
                    catch (e) {
                        console.warn('Could not parse gas estimate:', e);
                    }
                    buyAmountFormatted = aggregator_js_1.NineMMAggregator.parseAmount(quote.buyAmount, toTokenMeta.decimals);
                    price = parseFloat(quote.price);
                    routeDisplay = quote.sources && quote.sources.length > 0
                        ? quote.sources.map(function (s) { return typeof s === 'string' ? s : s.name; }).join(' + ')
                        : 'Best Available Route';
                    responseText = "\uD83D\uDD04 **Swap Quote Ready**\n            \n**Trade:** ".concat(parsed.amount, " ").concat(parsed.fromToken, " \u2192 ").concat(parsed.toToken, "\n**You'll receive:** ~").concat(buyAmountFormatted, " ").concat(parsed.toToken, "\n**Price Impact:** ").concat(priceImpact, "\n**Gas Estimate:** ").concat(gasEstimate, " gas units\n**Price:** ").concat(price.toFixed(8), " ").concat(parsed.toToken, " per ").concat(parsed.fromToken, "\n\n*Route: ").concat(routeDisplay, "*\n*Note: This is a quote only. To execute the swap, you would need to connect a wallet and approve the transaction.*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_1 = _a.sent();
                    console.error('Swap action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to get swap quote: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
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
                content: { text: "Swap 100 USDC for WPLS" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll get you a quote for swapping 100 USDC to WPLS using the best available routes.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Trade 50 PLS for HEX" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me find the best price for trading 50 PLS to HEX across all DEX pools.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Convert 0.5 WETH to USDT" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check the conversion rate for 0.5 WETH to USDT and find the optimal route.",
                    action: "EXECUTE_SWAP"
                }
            }
        ]
    ],
};
exports.default = swapAction;
