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
var ethers_1 = require("ethers");
var gasPriceAction = {
    name: "CHECK_GAS_PRICE",
    similes: [
        "GAS_FEES",
        "CHECK_GAS",
        "GAS_TRACKER",
        "NETWORK_FEES",
        "TRANSACTION_COST",
        "GAS_MONITOR"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, gasKeywords, priceKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            gasKeywords = ['gas', 'fees', 'cost', 'transaction cost', 'network fees'];
            priceKeywords = ['price', 'check', 'current', 'what', 'how much'];
            return [2 /*return*/, gasKeywords.some(function (keyword) { return text.includes(keyword); }) &&
                    priceKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    description: "Check current gas prices and network fees on PulseChain and other networks",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, chainConfigs, chainsToCheck, gasData, _i, chainsToCheck_1, chainKey, config, provider, feeData, gasPrice, maxFeePerGas, maxPriorityFeePerGas, swapGasLimit, transferGasLimit, lpGasLimit, swapCost, transferCost, lpCost, gasPriceLevel, error_1, responseText, data, error_2;
        var _a, _b, _c, _d, _e, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 7, , 8]);
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    chainConfigs = {
                        pulsechain: {
                            name: "PulseChain",
                            rpc: "https://rpc.pulsechain.com",
                            symbol: "PLS",
                            chainId: 369
                        },
                        base: {
                            name: "Base",
                            rpc: "https://mainnet.base.org",
                            symbol: "ETH",
                            chainId: 8453
                        },
                        sonic: {
                            name: "Sonic",
                            rpc: "https://rpc.soniclabs.com",
                            symbol: "S",
                            chainId: 146
                        }
                    };
                    chainsToCheck = Object.keys(chainConfigs);
                    if (text.includes('pulse'))
                        chainsToCheck = ['pulsechain'];
                    else if (text.includes('base'))
                        chainsToCheck = ['base'];
                    else if (text.includes('sonic'))
                        chainsToCheck = ['sonic'];
                    gasData = [];
                    _i = 0, chainsToCheck_1 = chainsToCheck;
                    _g.label = 1;
                case 1:
                    if (!(_i < chainsToCheck_1.length)) return [3 /*break*/, 6];
                    chainKey = chainsToCheck_1[_i];
                    config = chainConfigs[chainKey];
                    _g.label = 2;
                case 2:
                    _g.trys.push([2, 4, , 5]);
                    provider = new ethers_1.ethers.JsonRpcProvider(config.rpc);
                    return [4 /*yield*/, provider.getFeeData()];
                case 3:
                    feeData = _g.sent();
                    gasPrice = feeData.gasPrice ? Number(ethers_1.ethers.formatUnits(feeData.gasPrice, 'gwei')) : 0;
                    maxFeePerGas = feeData.maxFeePerGas ? Number(ethers_1.ethers.formatUnits(feeData.maxFeePerGas, 'gwei')) : 0;
                    maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? Number(ethers_1.ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')) : 0;
                    swapGasLimit = 200000;
                    transferGasLimit = 21000;
                    lpGasLimit = 300000;
                    swapCost = (gasPrice * swapGasLimit) / 1e9;
                    transferCost = (gasPrice * transferGasLimit) / 1e9;
                    lpCost = (gasPrice * lpGasLimit) / 1e9;
                    gasPriceLevel = '🟢 LOW';
                    if (gasPrice > 20)
                        gasPriceLevel = '🟡 MEDIUM';
                    if (gasPrice > 50)
                        gasPriceLevel = '🔴 HIGH';
                    if (gasPrice > 100)
                        gasPriceLevel = '💀 EXTREME';
                    gasData.push({
                        chain: config.name,
                        symbol: config.symbol,
                        gasPrice: gasPrice.toFixed(2),
                        maxFeePerGas: maxFeePerGas.toFixed(2),
                        maxPriorityFeePerGas: maxPriorityFeePerGas.toFixed(2),
                        level: gasPriceLevel,
                        costs: {
                            swap: swapCost.toFixed(6),
                            transfer: transferCost.toFixed(6),
                            liquidity: lpCost.toFixed(6)
                        }
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _g.sent();
                    gasData.push({
                        chain: config.name,
                        symbol: config.symbol,
                        gasPrice: 'N/A',
                        level: '❌ ERROR',
                        error: 'Unable to fetch'
                    });
                    return [3 /*break*/, 5];
                case 5:
                    _i++;
                    return [3 /*break*/, 1];
                case 6:
                    responseText = '';
                    if (gasData.length === 1) {
                        data = gasData[0];
                        if (data.error) {
                            responseText = "\u26FD **Gas Prices - ".concat(data.chain, "**\n\n\u274C **Error**: ").concat(data.error, "\nUnable to fetch current gas prices for ").concat(data.chain, ".\n\n*Please try again or check network status.*");
                        }
                        else {
                            responseText = "\u26FD **Gas Prices - ".concat(data.chain, "**\n\n\uD83D\uDCCA **Current Fees**:\n\u2022 Standard Gas Price: ").concat(data.gasPrice, " gwei (").concat(data.level, ")\n\u2022 Max Fee Per Gas: ").concat(data.maxFeePerGas, " gwei\n\u2022 Priority Fee: ").concat(data.maxPriorityFeePerGas, " gwei\n\n\uD83D\uDCB0 **Transaction Costs** (in ").concat(data.symbol, "):\n\u2022 Token Swap: ~").concat((_c = data.costs) === null || _c === void 0 ? void 0 : _c.swap, " ").concat(data.symbol, "\n\u2022 Simple Transfer: ~").concat((_d = data.costs) === null || _d === void 0 ? void 0 : _d.transfer, " ").concat(data.symbol, "  \n\u2022 LP Operations: ~").concat((_e = data.costs) === null || _e === void 0 ? void 0 : _e.liquidity, " ").concat(data.symbol, "\n\n\uD83D\uDCA1 **Timing Advice**: ").concat(data.level.includes('LOW') ? 'Great time to transact!' :
                                data.level.includes('MEDIUM') ? 'Moderate fees - consider waiting if not urgent' :
                                    'High fees - wait for lower gas if possible');
                        }
                    }
                    else {
                        responseText = "\u26FD **Multi-Chain Gas Monitor**\n\n".concat(gasData.map(function (data) {
                            var _a, _b;
                            if (data.error) {
                                return "**".concat(data.chain, "**: \u274C ").concat(data.error);
                            }
                            return "**".concat(data.chain, "**: ").concat(data.gasPrice, " gwei (").concat(data.level, ")\n   Swap Cost: ~").concat((_a = data.costs) === null || _a === void 0 ? void 0 : _a.swap, " ").concat(data.symbol, " | Transfer: ~").concat((_b = data.costs) === null || _b === void 0 ? void 0 : _b.transfer, " ").concat(data.symbol);
                        }).join('\n\n'), "\n\n\uD83C\uDFC6 **Best Chain**: ").concat(((_f = gasData
                            .filter(function (d) { return !d.error; })
                            .sort(function (a, b) { return parseFloat(a.gasPrice) - parseFloat(b.gasPrice); })[0]) === null || _f === void 0 ? void 0 : _f.chain) || 'N/A', "\n\n\uD83D\uDCA1 **Pro Tip**: Use the lowest gas chain for non-urgent transactions to save on fees!");
                    }
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 7:
                    error_2 = _g.sent();
                    console.error('Gas price action error:', error_2);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to check gas prices: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 8: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "What's the current gas price?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check the current gas prices across all supported networks to help you time your transactions optimally.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Check gas fees on PulseChain" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me get the current gas fees for PulseChain and show you transaction cost estimates.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "How much will this transaction cost?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check current gas prices and estimate transaction costs for different operation types.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ]
    ],
};
exports.default = gasPriceAction;
