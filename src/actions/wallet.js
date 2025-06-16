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
var walletService_js_1 = require("../services/walletService.js");
var walletAction = {
    name: "WALLET_LEGACY",
    similes: [
        "CREATE_WALLET",
        "GENERATE_WALLET",
        "NEW_WALLET",
        "WALLET_BALANCE",
        "CHECK_BALANCE",
        "CONNECT_WALLET",
        "MY_WALLET"
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
                    return [2 /*return*/, parsed.intent === 'wallet']; // Only handle wallet intent, not balance
                case 2:
                    error_1 = _b.sent();
                    console.error('Wallet validation error:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    description: "Generate new wallets, check balances, and manage wallet connections",
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, parsed, responseText, lowerText, platformUser, walletService, existingWallet, activeWallet, error_2, newWallet, error_3, error_4, errorText;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 12, , 13]);
                    userMessage = ((_a = message.content) === null || _a === void 0 ? void 0 : _a.text) || "";
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(userMessage)];
                case 1:
                    parsed = _b.sent();
                    responseText = "";
                    if (!(parsed.intent === 'wallet')) return [3 /*break*/, 11];
                    lowerText = userMessage.toLowerCase();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    existingWallet = null;
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, walletService.getActiveWallet(platformUser)];
                case 3:
                    activeWallet = _b.sent();
                    if (activeWallet) {
                        existingWallet = activeWallet;
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_2 = _b.sent();
                    console.log('No existing wallet found:', error_2);
                    return [3 /*break*/, 5];
                case 5:
                    if (!(lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('new'))) return [3 /*break*/, 10];
                    _b.label = 6;
                case 6:
                    _b.trys.push([6, 8, , 9]);
                    return [4 /*yield*/, walletService.createWallet(platformUser)];
                case 7:
                    newWallet = _b.sent();
                    responseText = "\uD83C\uDF89 **New Wallet Created Successfully!**\n\n\uD83D\uDCCB **Full Address (Tap to Copy):**\n".concat(newWallet.address, "\n\n**Wallet Details:**\n\u2022 Name: ").concat(newWallet.name, "\n\u2022 Platform: ").concat(newWallet.platform, "\n\n\u26A0\uFE0F **IMPORTANT SECURITY NOTES:**\n\u2022 Your private key is encrypted with AES-256 and stored securely\n\u2022 Use the telegram bot to manage your wallet safely\n\u2022 This wallet is ready for real transactions\n\u2022 Never share your wallet access with anyone\n\n\uD83D\uDE80 **Next Steps:**\n1. Fund your wallet by sending tokens to the address above\n2. Use \"check my balance\" to see your tokens\n3. Start trading with natural language commands\n\n*This wallet works across PulseChain, Base Chain, and other EVM networks.*\n*\u2705 Your wallet is securely stored with military-grade encryption!*\n\n**Recovery:** Your wallet is safely stored in our encrypted database system.");
                    return [3 /*break*/, 9];
                case 8:
                    error_3 = _b.sent();
                    responseText = "\u274C **Wallet Creation Failed**\n\n".concat(error_3.message || 'Unknown error occurred', "\n\nPlease try again or use the telegram bot for reliable wallet creation.");
                    return [3 /*break*/, 9];
                case 9: return [3 /*break*/, 11];
                case 10:
                    if (lowerText.includes('connect')) {
                        responseText = "\uD83D\uDD17 **Wallet Connection Guide**\n\nTo connect your existing wallet, you have a few options:\n\n**Option 1: Use Your Private Key**\n\u2022 Tell me: \"Import wallet with private key [your-key]\"\n\u2022 I can help you access your existing wallet\n\n**Option 2: Generate New Wallet**\n\u2022 Say: \"Create a new wallet for me\"\n\u2022 Get a fresh wallet address and private key\n\n**Option 3: Check Existing Balance**\n\u2022 Tell me: \"Check balance of [wallet-address]\"\n\u2022 I can query any public wallet address\n\n\uD83D\uDCA1 **What would you like to do?**";
                    }
                    else {
                        // Check if they're asking about their wallet
                        if (existingWallet && (lowerText.includes('my wallet') || lowerText.includes('what is my') || lowerText.includes('show my'))) {
                            responseText = "\uD83D\uDCBC **Your Active Wallet**\n\n\uD83D\uDCCB **Full Address (Tap to Copy):**\n".concat(existingWallet.address, "\n\n**Wallet Details:**\n\u2022 Name: ").concat(existingWallet.name, "\n\u2022 Created: ").concat(new Date(existingWallet.createdAt).toLocaleString(), "\n\n\uD83D\uDD10 **Security:** AES-256 encrypted database storage\n\n\u2705 Your wallet is safely stored and will persist across sessions!\n\n**Options:**\n\u2022 \"What's my balance\" - Check your token balances\n\u2022 \"Create a new wallet\" - Add another wallet\n\u2022 Use the telegram bot for full wallet management\n\n\u26A0\uFE0F **Note:** Your private key is encrypted and secure in our database.");
                        }
                        else {
                            responseText = "\uD83D\uDCBC **Wallet Management Options**\n\nI can help you with:\n\n\uD83C\uDD95 **Create New Wallet:** \"Create a wallet for me\"\n\uD83D\uDD17 **Connect Existing:** \"Connect my wallet\" \n\uD83D\uDCB0 **Check Balance:** \"What's my balance\" or \"Check balance of [address]\"\n\uD83D\uDCDD **Import Wallet:** \"Import wallet with private key [key]\"\n\n**What would you like to do?**";
                        }
                    }
                    _b.label = 11;
                case 11:
                    if (callback) {
                        callback({
                            text: responseText,
                            content: { text: responseText }
                        });
                    }
                    return [2 /*return*/, true];
                case 12:
                    error_4 = _b.sent();
                    console.error('Wallet action error:', error_4);
                    errorText = "\u274C **Wallet Error**\n            \nSorry, I encountered an error while handling your wallet request. Please try again or ask for help with:\n\n\u2022 \"Create a new wallet\"\n\u2022 \"Check my balance\" \n\u2022 \"Connect wallet help\"";
                    if (callback) {
                        callback({
                            text: errorText,
                            content: { text: errorText }
                        });
                    }
                    return [2 /*return*/, false];
                case 13: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Create a wallet for me"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "🎉 New wallet created! Address: 0x... Private Key: 0x... Keep your private key safe!"
                }
            }
        ],
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
                    text: "To check your balance, I need your wallet address. Create a wallet first if you don't have one!"
                }
            }
        ]
    ]
};
exports.default = walletAction;
