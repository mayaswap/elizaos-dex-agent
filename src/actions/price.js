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
    'WBTC': { decimals: 18, symbol: 'WBTC' },
    'INC': { decimals: 18, symbol: 'INC' },
    'LOAN': { decimals: 18, symbol: 'LOAN' },
    'HEDRON': { decimals: 9, symbol: 'HEDRON' },
    'ICSA': { decimals: 18, symbol: 'ICSA' },
};
var priceAction = {
    name: "GET_PRICE",
    similes: [
        "CHECK_PRICE",
        "PRICE_LOOKUP",
        "MARKET_PRICE",
        "TOKEN_PRICE",
        "QUOTE_PRICE"
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
                    // Valid if it's a price command with sufficient confidence
                    return [2 /*return*/, parsed.intent === 'price' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Get current token prices using natural language commands via 9mm DEX aggregator",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed, aggregator, pulsechainTokens, tokenAddress, tokenMetadata, priceData, tokenPriceUSD, formattedPrice, additionalInfo, responseText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    text = message.content.text;
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _a.sent();
                    if (!parsed.fromToken) {
                        if (callback) {
                            callback({
                                text: "I need to know which token price you want to check. For example: 'What's the price of HEX?' or 'HEX price'"
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    aggregator = new aggregator_js_1.NineMMAggregator(369);
                    pulsechainTokens = chains_js_1.POPULAR_TOKENS.pulsechain;
                    tokenAddress = pulsechainTokens[parsed.fromToken];
                    tokenMetadata = TOKEN_METADATA[parsed.fromToken];
                    if (!tokenAddress) {
                        throw new Error("Token not found: ".concat(parsed.fromToken));
                    }
                    // For native PLS, use WPLS address for price queries since APIs work better with ERC-20 tokens
                    if (parsed.fromToken === 'PLS' && tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
                        tokenAddress = pulsechainTokens.WPLS; // Use WPLS for price data
                    }
                    // Use dedicated price API for direct USD prices
                    console.log("\uD83D\uDCCA Fetching price for ".concat(parsed.fromToken, " at address: ").concat(tokenAddress));
                    return [4 /*yield*/, aggregator.getTokenPrice(tokenAddress)];
                case 3:
                    priceData = _a.sent();
                    console.log("\uD83D\uDCB0 Raw price data:", priceData);
                    tokenPriceUSD = priceData.priceUSD;
                    formattedPrice = void 0;
                    if (tokenPriceUSD === 0) {
                        formattedPrice = '0';
                    }
                    else if (tokenPriceUSD < 0.00000001) {
                        // For extremely small values, use exponential notation
                        formattedPrice = tokenPriceUSD.toExponential(4);
                    }
                    else if (tokenPriceUSD < 0.00001) {
                        // For very small values, show more decimal places
                        formattedPrice = tokenPriceUSD.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
                    }
                    else if (tokenPriceUSD < 0.0001) {
                        // For small values, show 8 decimals
                        formattedPrice = tokenPriceUSD.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
                    }
                    else if (tokenPriceUSD < 0.01) {
                        // For medium-small values
                        formattedPrice = tokenPriceUSD.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
                    }
                    else if (tokenPriceUSD < 1) {
                        // For sub-dollar values
                        formattedPrice = tokenPriceUSD.toFixed(4);
                    }
                    else if (tokenPriceUSD < 100) {
                        // For normal prices
                        formattedPrice = tokenPriceUSD.toFixed(4);
                    }
                    else {
                        // For large values
                        formattedPrice = tokenPriceUSD.toFixed(2);
                    }
                    additionalInfo = '';
                    if (parsed.fromToken === 'PLS') {
                        additionalInfo = '\n**Note:** PLS is the native token of PulseChain';
                    }
                    else if (parsed.fromToken === 'HEX') {
                        additionalInfo = '\n**Note:** HEX is a certificate of deposit on blockchain';
                    }
                    responseText = "\uD83D\uDCCA **".concat(parsed.fromToken, " Price**\n\n**Current Price:** $").concat(formattedPrice, " USD\n**Token:** ").concat((tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.symbol) || parsed.fromToken, "\n**Decimals:** ").concat((tokenMetadata === null || tokenMetadata === void 0 ? void 0 : tokenMetadata.decimals) || 18, "\n**Address:** `").concat(tokenAddress, "`").concat(additionalInfo, "\n\n*Price sourced from 9mm price API on PulseChain*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 4:
                    error_1 = _a.sent();
                    console.error('Price action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to get price: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
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
                content: { text: "What's the price of HEX?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me check the current HEX price across all DEX pools.",
                    action: "GET_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "PLS price" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll fetch the current PLS price for you.",
                    action: "GET_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "How much is PLSX worth?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me get the latest PLSX market price.",
                    action: "GET_PRICE"
                }
            }
        ]
    ],
};
exports.default = priceAction;
