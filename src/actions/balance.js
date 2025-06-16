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
var smartParser_js_1 = require("../utils/smartParser.js");
var chains_js_1 = require("../config/chains.js");
var walletService_js_1 = require("../services/walletService.js");
var balanceAction = {
    name: "CHECK_BALANCE",
    similes: [
        "WALLET_BALANCE",
        "TOKEN_BALANCE",
        "MY_BALANCE",
        "CHECK_HOLDINGS",
        "SHOW_BALANCE"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var parsed, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (!((_a = message.content) === null || _a === void 0 ? void 0 : _a.text))
                        return [2 /*return*/, false];
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(message.content.text)];
                case 1:
                    parsed = _b.sent();
                    return [2 /*return*/, parsed.intent === 'balance'];
                case 2:
                    error_1 = _b.sent();
                    console.error('Balance validation error:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    description: "Check token balances for wallets using the new WalletService",
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var responseText, userMessage, parsed, platformUser, walletService, userWallets, walletAddress, activeWallet, error_2, addressMatch, provider, nativeBalance, plsBalance, tokenAddresses, tokenChecks, _i, tokenChecks_1, tokenSymbol, tokenAddress, erc20Abi, contract, balance, formattedBalance, decimals, tokenError_1, error_3, error_4, errorText;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 17, , 18]);
                    responseText = "";
                    userMessage = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    if (!userMessage) {
                        responseText = "❌ I need a message to check balance. Try: 'Check my balance' or 'What's my PLS balance?'";
                        if (callback) {
                            callback({
                                text: responseText,
                                content: { text: responseText }
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(userMessage)];
                case 1:
                    parsed = _c.sent();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 2:
                    userWallets = _c.sent();
                    if (userWallets.length === 0) {
                        responseText = "\uD83D\uDCB0 **Balance Check**\n\nI need a wallet to check balances.\n\n**Options:**\n\u2022 \"Create a wallet for me\" (I'll remember it for future balance checks)\n\u2022 \"Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f\" \n\u2022 Import your existing wallet first\n\n**Note:** Once you create or import a wallet, I'll remember it for easy balance checking!";
                        if (callback) {
                            callback({
                                text: responseText,
                                content: { text: responseText }
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    walletAddress = null;
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, walletService.getActiveWallet(platformUser)];
                case 4:
                    activeWallet = _c.sent();
                    if (activeWallet === null || activeWallet === void 0 ? void 0 : activeWallet.address) {
                        walletAddress = activeWallet.address;
                        console.log("\uD83D\uDD0D Found active wallet: ".concat(walletAddress, " for ").concat(platformUser.platform, ":").concat(platformUser.platformUserId));
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _c.sent();
                    console.log('Could not retrieve wallet from WalletService:', error_2);
                    return [3 /*break*/, 6];
                case 6:
                    addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/);
                    if (addressMatch) {
                        walletAddress = addressMatch[0];
                        console.log("\uD83C\uDFAF Using address from message: ".concat(walletAddress));
                    }
                    if (!walletAddress) {
                        responseText = "\uD83D\uDCB0 **Balance Check**\n\nI need a wallet to check balances.\n\n**Options:**\n\u2022 \"Create a wallet for me\" (I'll remember it for future balance checks)\n\u2022 \"Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f\" \n\u2022 Import your existing wallet first\n\n**Note:** Once you create or import a wallet, I'll remember it for easy balance checking!";
                        if (callback) {
                            callback({
                                text: responseText,
                                content: { text: responseText }
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    provider = new ethers_1.ethers.JsonRpcProvider(chains_js_1.CHAIN_CONFIGS.pulsechain.rpcUrl);
                    _c.label = 7;
                case 7:
                    _c.trys.push([7, 15, , 16]);
                    console.log("\uD83C\uDF10 Checking balance for wallet: ".concat(walletAddress));
                    return [4 /*yield*/, provider.getBalance(walletAddress)];
                case 8:
                    nativeBalance = _c.sent();
                    plsBalance = ethers_1.ethers.formatEther(nativeBalance);
                    console.log("\uD83D\uDCB0 PLS Balance: ".concat(plsBalance));
                    responseText = "\uD83D\uDCB0 **Wallet Balance Report**\n\n\uD83D\uDCCB **Wallet Address:**\n".concat(walletAddress, "\n\n**Network:** PulseChain\n\n**Native Balance:**\n\u2022 **PLS:** ").concat(parseFloat(plsBalance).toFixed(4), " PLS\n\n**ERC-20 Tokens:**");
                    tokenAddresses = chains_js_1.POPULAR_TOKENS.pulsechain;
                    tokenChecks = ['WPLS', 'USDC', 'USDT', 'DAI', 'HEX', 'PLSX'];
                    _i = 0, tokenChecks_1 = tokenChecks;
                    _c.label = 9;
                case 9:
                    if (!(_i < tokenChecks_1.length)) return [3 /*break*/, 14];
                    tokenSymbol = tokenChecks_1[_i];
                    tokenAddress = tokenAddresses[tokenSymbol];
                    if (!(tokenAddress && tokenAddress !== 'NATIVE' && tokenAddress !== 'EeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')) return [3 /*break*/, 13];
                    _c.label = 10;
                case 10:
                    _c.trys.push([10, 12, , 13]);
                    erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
                    contract = new ethers_1.ethers.Contract(tokenAddress, erc20Abi, provider);
                    return [4 /*yield*/, contract.balanceOf(walletAddress)];
                case 11:
                    balance = _c.sent();
                    formattedBalance = '0';
                    if (balance > 0n) {
                        decimals = tokenSymbol === 'USDC' || tokenSymbol === 'USDT' ? 6 :
                            tokenSymbol === 'HEX' ? 8 : 18;
                        formattedBalance = ethers_1.ethers.formatUnits(balance, decimals);
                    }
                    responseText += "\n\u2022 **".concat(tokenSymbol, ":** ").concat(parseFloat(formattedBalance).toFixed(4), " ").concat(tokenSymbol);
                    console.log("\uD83E\uDE99 ".concat(tokenSymbol, ": ").concat(formattedBalance));
                    return [3 /*break*/, 13];
                case 12:
                    tokenError_1 = _c.sent();
                    console.log("Could not fetch ".concat(tokenSymbol, " balance:"), tokenError_1);
                    responseText += "\n\u2022 **".concat(tokenSymbol, ":** Unable to fetch");
                    return [3 /*break*/, 13];
                case 13:
                    _i++;
                    return [3 /*break*/, 9];
                case 14:
                    responseText += "\n\n*\u2705 Balance check completed for PulseChain network*\n*\uD83D\uDCA1 To check other networks, specify: \"Check my Base balance\" or \"Check my Sonic balance\"*";
                    return [3 /*break*/, 16];
                case 15:
                    error_3 = _c.sent();
                    console.error('Balance check error:', error_3);
                    responseText = "\u274C **Balance Check Failed**\n\n\uD83D\uDCCB Could not retrieve balance for wallet:\n".concat(walletAddress, "\n\n**Possible reasons:**\n\u2022 Network connection issues\n\u2022 Invalid wallet address\n\u2022 RPC provider temporarily unavailable\n\n**Try again or:**\n\u2022 \"Create a new wallet\" if you need a fresh wallet\n\u2022 \"Check balance of [different-address]\" with a known funded address");
                    return [3 /*break*/, 16];
                case 16:
                    if (callback) {
                        callback({
                            text: responseText,
                            content: { text: responseText }
                        });
                    }
                    return [2 /*return*/, true];
                case 17:
                    error_4 = _c.sent();
                    console.error('Balance action error:', error_4);
                    errorText = "\u274C **Balance Error**\n            \nSorry, I encountered an error while checking your balance. Please try again or:\n\n\u2022 \"Create a wallet for me\" to get started\n\u2022 \"Check balance of 0x...\" with a specific address";
                    if (callback) {
                        callback({
                            text: errorText,
                            content: { text: errorText }
                        });
                    }
                    return [2 /*return*/, false];
                case 18: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "What's my balance?"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "I'll check your wallet balance across all major tokens on PulseChain!"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "Checking balance for the specified wallet address..."
                }
            }
        ]
    ]
};
exports.default = balanceAction;
