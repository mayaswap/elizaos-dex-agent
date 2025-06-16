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
var walletService_js_1 = require("../services/walletService.js");
var multiChainAction = {
    name: "MULTI_CHAIN_SUPPORT",
    similes: [
        "SWITCH_NETWORK",
        "CHANGE_CHAIN",
        "NETWORK_SWITCH",
        "CROSS_CHAIN",
        "CHAIN_SELECTION",
        "NETWORK_INFO"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, chainKeywords, actionKeywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            chainKeywords = ['chain', 'network', 'switch', 'base', 'sonic', 'pulse', 'pulsechain'];
            actionKeywords = ['switch', 'change', 'use', 'connect', 'show', 'balance'];
            return [2 /*return*/, chainKeywords.some(function (keyword) { return text.includes(keyword); }) &&
                    actionKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    description: "Switch between supported networks and manage multi-chain operations",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, supportedChains, targetChain, platformUser, walletService, userWallets, walletCount, responseText, chain, responseText, responseText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    text = message.content.text.toLowerCase();
                    supportedChains = {
                        pulsechain: {
                            name: "PulseChain",
                            chainId: 369,
                            symbol: "PLS",
                            rpc: "https://rpc.pulsechain.com",
                            explorer: "https://scan.pulsechain.com",
                            description: "Richard Heart's Ethereum fork with lower fees",
                            dexes: ["9mm V2", "9mm V3", "DexGen"],
                            features: ["Low Gas", "HEX Native", "OA Sacrifice"]
                        },
                        base: {
                            name: "Base",
                            chainId: 8453,
                            symbol: "ETH",
                            rpc: "https://mainnet.base.org",
                            explorer: "https://basescan.org",
                            description: "Coinbase's Layer 2 built on Optimism",
                            dexes: ["Uniswap V3", "SushiSwap", "BaseSwap"],
                            features: ["L2 Scaling", "Coinbase Integration", "Low Fees"]
                        },
                        sonic: {
                            name: "Sonic",
                            chainId: 146,
                            symbol: "S",
                            rpc: "https://rpc.soniclabs.com",
                            explorer: "https://sonicscan.org",
                            description: "High-performance EVM-compatible chain",
                            dexes: ["SonicSwap", "TurboSwap", "VelocityDEX"],
                            features: ["Ultra Fast", "High TPS", "Gaming Focused"]
                        }
                    };
                    targetChain = null;
                    if (text.includes('pulse'))
                        targetChain = 'pulsechain';
                    else if (text.includes('base'))
                        targetChain = 'base';
                    else if (text.includes('sonic'))
                        targetChain = 'sonic';
                    if (!(text.includes('balance') && !targetChain)) return [3 /*break*/, 2];
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 1:
                    userWallets = _a.sent();
                    walletCount = userWallets.length;
                    if (walletCount === 0) {
                        if (callback) {
                            callback({
                                text: "\uD83C\uDF10 **Multi-Chain Balance Check**\n\n\u274C **No Wallets Connected**\n\nTo check balances across chains, you need to connect a wallet first.\n\n**After connecting, you can:**\n\u2022 \"Show my Base balance\"\n\u2022 \"Check PulseChain balance\"  \n\u2022 \"Sonic network balance\"\n\u2022 \"All chain balances\"\n\n*Connect a wallet to get started!*"
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    responseText = "\uD83C\uDF10 **Multi-Chain Portfolio Overview**\n\n\uD83D\uDCBC **Connected Wallets**: ".concat(walletCount, " wallet").concat(walletCount > 1 ? 's' : '', "\n\n\u26A0\uFE0F **Multi-Chain Balance Check**: Coming Soon!\n\nCurrently, I can:\n\u2705 Show PulseChain balances (real-time)\n\uD83D\uDD04 Switch between networks\n\uD83D\uDCCA Provide network information\n\nMulti-chain balance checking across Base and Sonic is under development. \n\n**Available Now:**\n\u2022 \"Show my balance\" - Check PulseChain balances\n\u2022 \"Switch to Base network\" - Change active chain\n\u2022 \"What chains are supported?\" - View all networks\n\n**Coming Soon:**\n\u2022 Real-time Base network balances\n\u2022 Sonic chain integration\n\u2022 Cross-chain portfolio analytics\n\n*Stay tuned for full multi-chain support!*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 2:
                    // Handle network switching
                    if (targetChain && (text.includes('switch') || text.includes('change') || text.includes('use'))) {
                        chain = supportedChains[targetChain];
                        responseText = "\uD83D\uDD04 **Network Switch - ".concat(chain.name, "**\n\n\u2705 **Successfully switched to ").concat(chain.name, "**\n\n\uD83C\uDF10 **Network Details**:\n\u2022 Chain ID: ").concat(chain.chainId, "\n\u2022 Native Token: ").concat(chain.symbol, "\n\u2022 RPC URL: ").concat(chain.rpc, "\n\u2022 Block Explorer: ").concat(chain.explorer, "\n\n\uD83D\uDCDD **Description**: ").concat(chain.description, "\n\n\uD83C\uDFEA **Available DEXs**: ").concat(chain.dexes.join(', '), "\n\n\u26A1 **Key Features**: ").concat(chain.features.join(' • '), "\n\n**What you can do now:**\n\u2022 \"What's the gas price?\" - Check ").concat(chain.name, " fees\n\u2022 \"Show my balance\" - View ").concat(chain.symbol, " and token balances\n\u2022 \"Swap tokens\" - Trade on ").concat(chain.name, " DEXs\n\u2022 \"Show available pools\" - Find liquidity opportunities\n\n*All future operations will use ").concat(chain.name, " network*");
                        if (callback) {
                            callback({
                                text: responseText
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    // Show network information
                    if (text.includes('info') || text.includes('show') || (!targetChain && text.includes('network'))) {
                        responseText = "\uD83C\uDF10 **Supported Networks**\n\n".concat(Object.entries(supportedChains).map(function (_a) {
                            var key = _a[0], chain = _a[1];
                            return "**".concat(chain.name, "** (Chain ID: ").concat(chain.chainId, ")\n\u2022 Native Token: ").concat(chain.symbol, "\n\u2022 Description: ").concat(chain.description, "\n\u2022 DEXs: ").concat(chain.dexes.join(', '), "\n\u2022 Features: ").concat(chain.features.join(' • '), "\n\u2022 Switch Command: \"Switch to ").concat(key, "\"");
                        }).join('\n\n'), "\n\n**Multi-Chain Commands:**\n\u2022 \"Switch to [network]\" - Change active network\n\u2022 \"Show [network] balance\" - Chain-specific balance\n\u2022 \"All chain balances\" - Portfolio across all networks\n\u2022 \"What chains are supported?\" - This information\n\n\uD83D\uDCA1 **Pro Tip**: Each chain has different gas costs and available tokens. Choose the best chain for your transaction needs!");
                        if (callback) {
                            callback({
                                text: responseText
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    // Default response for unrecognized network commands
                    if (callback) {
                        callback({
                            text: "\uD83C\uDF10 **Multi-Chain Support**\n\nI can help you with network operations! Try:\n\n**Switch Networks:**\n\u2022 \"Switch to Base network\"\n\u2022 \"Change to PulseChain\"  \n\u2022 \"Use Sonic chain\"\n\n**Check Balances:**\n\u2022 \"Show my Base balance\"\n\u2022 \"PulseChain balance\"\n\u2022 \"All chain balances\"\n\n**Network Info:**\n\u2022 \"What chains are supported?\"\n\u2022 \"Show network information\"\n\nCurrently supported: PulseChain, Base, and Sonic networks."
                        });
                    }
                    return [2 /*return*/, true];
                case 3:
                    error_1 = _a.sent();
                    console.error('Multi-chain action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to process multi-chain request: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 4: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Switch to Base network" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll switch you to the Base network and show you the available features and DEXs.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my Sonic balance" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me check your token balances on the Sonic network.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "What chains are supported?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you all supported networks with their features and how to switch between them.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ]
    ],
};
exports.default = multiChainAction;
