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
exports.NineMMAggregator = void 0;
var chains_js_1 = require("../config/chains.js");
/**
 * 9mm Aggregator API Client
 * Handles interaction with the 9mm DEX aggregator (0x API v1 fork)
 */
var NineMMAggregator = /** @class */ (function () {
    function NineMMAggregator(chainId) {
        var chainConfig = Object.values(chains_js_1.CHAIN_CONFIGS).find(function (c) { return c.chainId === chainId; });
        if (!(chainConfig === null || chainConfig === void 0 ? void 0 : chainConfig.aggregatorBaseUrl)) {
            throw new Error("Aggregator not available for chain ".concat(chainId));
        }
        this.baseUrl = chainConfig.aggregatorBaseUrl;
        this.priceApiBaseUrl = 'https://price-api.9mm.pro'; // Dedicated price API
    }
    /**
     * Get swap quote from 9mm aggregator
     */
    NineMMAggregator.prototype.getSwapQuote = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, response, quoteData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        params = new URLSearchParams({
                            sellToken: request.fromToken,
                            buyToken: request.toToken,
                            sellAmount: request.amount,
                            slippagePercentage: request.slippagePercentage.toString(),
                            takerAddress: request.userAddress,
                        });
                        url = "".concat(this.baseUrl, "/swap/v1/quote?").concat(params.toString());
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Aggregator API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        quoteData = _a.sent();
                        return [2 /*return*/, this.transformQuoteResponse(quoteData)];
                    case 3:
                        error_1 = _a.sent();
                        throw new Error("Failed to get swap quote: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get individual token price in USD from dedicated price API
     */
    NineMMAggregator.prototype.getTokenPrice = function (tokenAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var normalizedAddress, url, response, priceData, priceValue, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        normalizedAddress = tokenAddress.toLowerCase();
                        url = "".concat(this.priceApiBaseUrl, "/api/price/pulsechain/?address=").concat(normalizedAddress);
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Price API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        priceData = _a.sent();
                        console.log("\uD83D\uDCB1 Price API response for ".concat(normalizedAddress, ":"), priceData);
                        priceValue = priceData.price ? parseFloat(priceData.price) : 0;
                        return [2 /*return*/, {
                                price: priceData.price || '0',
                                priceUSD: priceValue,
                            }];
                    case 3:
                        error_2 = _a.sent();
                        throw new Error("Failed to get token price: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get price information only (no transaction data)
     */
    NineMMAggregator.prototype.getPrice = function (fromToken, toToken, amount) {
        return __awaiter(this, void 0, void 0, function () {
            var params, url, response, priceData, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        params = new URLSearchParams({
                            sellToken: fromToken,
                            buyToken: toToken,
                            sellAmount: amount,
                        });
                        url = "".concat(this.baseUrl, "/swap/v1/price?").concat(params.toString());
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Price API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        priceData = _a.sent();
                        return [2 /*return*/, {
                                price: priceData.price,
                                buyAmount: priceData.buyAmount,
                                estimatedPriceImpact: priceData.estimatedPriceImpact,
                            }];
                    case 3:
                        error_3 = _a.sent();
                        throw new Error("Failed to get price: ".concat(error_3 instanceof Error ? error_3.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get available liquidity sources
     */
    NineMMAggregator.prototype.getSources = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, response, sourcesData, records, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        url = "".concat(this.baseUrl, "/swap/v1/sources");
                        return [4 /*yield*/, fetch(url, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw new Error("Sources API error: ".concat(response.status));
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        sourcesData = _a.sent();
                        records = sourcesData.records || [];
                        return [2 /*return*/, records.map(function (name) { return ({
                                name: name,
                                proportion: '1.0', // Equal weight since we don't have specific proportions
                            }); })];
                    case 3:
                        error_4 = _a.sent();
                        throw new Error("Failed to get sources: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error'));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Transform 9mm API response to our SwapQuote schema
     */
    NineMMAggregator.prototype.transformQuoteResponse = function (data) {
        // Handle BigInt values from API by converting to string
        var safeStringify = function (value) {
            if (typeof value === 'bigint') {
                return value.toString();
            }
            if (typeof value === 'number') {
                return value.toString();
            }
            return value || '0';
        };
        // Handle sources array - API might return different formats
        var sources = [];
        if (Array.isArray(data.sources)) {
            sources = data.sources.map(function (source) {
                if (typeof source === 'string') {
                    return { name: source, proportion: '1' };
                }
                return {
                    name: source.name || 'Unknown',
                    proportion: source.proportion || '1'
                };
            });
        }
        return {
            sellToken: data.sellToken || '',
            buyToken: data.buyToken || '',
            sellAmount: safeStringify(data.sellAmount),
            buyAmount: safeStringify(data.buyAmount),
            price: safeStringify(data.price),
            guaranteedPrice: safeStringify(data.guaranteedPrice || data.price),
            gas: safeStringify(data.gas),
            gasPrice: safeStringify(data.gasPrice),
            protocolFee: safeStringify(data.protocolFee),
            minimumProtocolFee: safeStringify(data.minimumProtocolFee),
            buyTokenAddress: data.buyTokenAddress || data.buyToken || '',
            sellTokenAddress: data.sellTokenAddress || data.sellToken || '',
            value: safeStringify(data.value),
            to: data.to || '',
            data: data.data || '',
            estimatedPriceImpact: data.estimatedPriceImpact,
            sources: sources,
        };
    };
    /**
     * Format amount to wei based on token decimals
     */
    NineMMAggregator.formatAmount = function (amount, decimals) {
        try {
            var amountFloat = parseFloat(amount);
            if (isNaN(amountFloat)) {
                throw new Error('Invalid amount');
            }
            // Convert to wei by multiplying by 10^decimals
            var wei = Math.floor(amountFloat * Math.pow(10, decimals));
            return wei.toString();
        }
        catch (error) {
            throw new Error("Failed to format amount: ".concat(error instanceof Error ? error.message : 'Unknown error'));
        }
    };
    /**
     * Parse amount from wei to human readable format based on token decimals
     */
    NineMMAggregator.parseAmount = function (amount, decimals) {
        try {
            var amountString = void 0;
            if (typeof amount === 'bigint') {
                amountString = amount.toString();
            }
            else if (typeof amount === 'number') {
                amountString = amount.toString();
            }
            else {
                amountString = amount;
            }
            var amountBigInt = BigInt(amountString);
            var divisor = BigInt(Math.pow(10, decimals));
            // Convert from wei by dividing by 10^decimals
            var wholePart = amountBigInt / divisor;
            var fractionalPart = amountBigInt % divisor;
            if (fractionalPart === BigInt(0)) {
                return wholePart.toString();
            }
            // Format with appropriate decimal places
            var fractionalStr = fractionalPart.toString().padStart(decimals, '0');
            var trimmedFractional = fractionalStr.replace(/0+$/, '');
            if (trimmedFractional === '') {
                return wholePart.toString();
            }
            return "".concat(wholePart, ".").concat(trimmedFractional);
        }
        catch (error) {
            throw new Error("Failed to parse amount: ".concat(error instanceof Error ? error.message : 'Unknown error'));
        }
    };
    /**
     * Calculate price impact percentage
     */
    NineMMAggregator.calculatePriceImpact = function (inputAmount, outputAmount, marketPrice) {
        try {
            var input = parseFloat(inputAmount);
            var output = parseFloat(outputAmount);
            var price = parseFloat(marketPrice);
            var expectedOutput = input * price;
            var impact = ((expectedOutput - output) / expectedOutput) * 100;
            return Math.abs(impact).toFixed(2);
        }
        catch (error) {
            return '0.00';
        }
    };
    /**
     * Validate slippage percentage
     */
    NineMMAggregator.validateSlippage = function (slippage) {
        return slippage >= 0.1 && slippage <= 50; // 0.1% to 50%
    };
    /**
     * Calculate minimum received amount considering slippage
     */
    NineMMAggregator.getMinimumReceived = function (buyAmount, slippagePercentage) {
        try {
            var amount = parseFloat(buyAmount);
            var slippage = slippagePercentage / 100;
            var minimum = amount * (1 - slippage);
            return minimum.toString();
        }
        catch (error) {
            return '0';
        }
    };
    return NineMMAggregator;
}());
exports.NineMMAggregator = NineMMAggregator;
