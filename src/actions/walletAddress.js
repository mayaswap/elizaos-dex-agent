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
var walletAddressAction = {
    name: "SHOW_WALLET_ADDRESS",
    similes: [
        "SHOW_ADDRESS",
        "MY_ADDRESS",
        "WALLET_ADDRESS",
        "GET_ADDRESS",
        "DISPLAY_ADDRESS"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text_1, addressPatterns;
        var _a;
        return __generator(this, function (_b) {
            try {
                if (!((_a = message.content) === null || _a === void 0 ? void 0 : _a.text))
                    return [2 /*return*/, false];
                text_1 = message.content.text.toLowerCase();
                addressPatterns = [
                    /\bshow\s+(my\s+)?(wallet\s+)?address\b/i,
                    /\bwhat'?s\s+my\s+address\b/i,
                    /\bmy\s+wallet\s+address\b/i,
                    /\bget\s+my\s+address\b/i,
                    /\bdisplay\s+(my\s+)?address\b/i,
                    /\bwhere\s+is\s+my\s+address\b/i,
                    /\bwhat\s+is\s+my\s+wallet\s+address\b/i,
                ];
                return [2 /*return*/, addressPatterns.some(function (pattern) { return pattern.test(text_1); })];
            }
            catch (error) {
                console.error('Wallet address validation error:', error);
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    }); },
    description: "Display the user's active wallet address",
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var platformUser, walletService, responseText, activeWallet, error_1, error_2, errorText;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    responseText = "";
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, walletService.getActiveWallet(platformUser)];
                case 2:
                    activeWallet = _a.sent();
                    if (activeWallet === null || activeWallet === void 0 ? void 0 : activeWallet.address) {
                        responseText = "\uD83D\uDCBC **Your Active Wallet Address**\n\n\uD83D\uDCCB **Full Address (Click to Copy):**\n".concat(activeWallet.address, "\n\n**Wallet Details:**\n\u2022 Name: ").concat(activeWallet.name, "\n\u2022 Platform: ").concat(activeWallet.platform, "\n\u2022 Created: ").concat(new Date(activeWallet.createdAt).toLocaleString(), "\n\n\uD83D\uDD17 **Quick Actions:**\n\u2022 Tap/click the address above to copy it\n\u2022 \"Check my balance\" - See all your token balances\n\u2022 \"Create a new wallet\" - Add another wallet\n\n\uD83C\uDF10 **Networks Supported:**\n\u2022 PulseChain (Primary)\n\u2022 Base Chain  \n\u2022 Sonic Network\n\n\u26A1 **Pro Tip:** This same address works on all EVM networks!");
                    }
                    else {
                        responseText = "\uD83D\uDCBC **No Active Wallet Found**\n\nYou don't have a wallet set up yet! Let me help you:\n\n\uD83C\uDD95 **Create New Wallet:**\n\u2022 Say: \"Create a wallet for me\"\n\u2022 I'll generate a secure wallet instantly\n\n\uD83D\uDD17 **Import Existing Wallet:**\n\u2022 Say: \"Import wallet with private key [your-key]\"\n\u2022 Connect your existing wallet\n\n\uD83D\uDCF1 **Quick Setup:**\n\u2022 \"Create a wallet\" - Get started in seconds\n\u2022 Your wallet will be encrypted and stored securely\n\u2022 Works across Telegram, Discord, and Web\n\n**Once created, I'll remember your wallet for easy access!**";
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    console.log('Error retrieving wallet:', error_1);
                    responseText = "\uD83D\uDCBC **Wallet Lookup Issue**\n\nI'm having trouble accessing your wallet information.\n\n\uD83D\uDD04 **Try These Options:**\n\u2022 \"Create a wallet for me\" - Generate a new wallet\n\u2022 \"Check my balance\" - This will also show your address\n\u2022 \"Import wallet\" - Connect an existing wallet\n\n\uD83D\uDEE0\uFE0F **If you recently created a wallet:**\n\u2022 The wallet system might be initializing\n\u2022 Try again in a moment\n\u2022 Your wallet data is safely encrypted and stored\n\n**Need help?** Just ask me to create or import a wallet!";
                    return [3 /*break*/, 4];
                case 4:
                    if (callback) {
                        callback({
                            text: responseText,
                            content: { text: responseText }
                        });
                    }
                    return [2 /*return*/, true];
                case 5:
                    error_2 = _a.sent();
                    console.error('Wallet address action error:', error_2);
                    errorText = "\u274C **Address Display Error**\n            \nSorry, I encountered an error while retrieving your wallet address.\n\n**Quick Solutions:**\n\u2022 \"Create a wallet for me\" - Start fresh\n\u2022 \"Check my balance\" - Alternative way to see your address\n\u2022 Try asking again in a moment\n\n**Need immediate help?** Use the wallet creation command to get started.";
                    if (callback) {
                        callback({
                            text: errorText,
                            content: { text: errorText }
                        });
                    }
                    return [2 /*return*/, false];
                case 6: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Show my address"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "Here's your wallet address: 0x742d35Cc6635C0532925a3b8D357376C326910b2f"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: {
                    text: "What's my wallet address?"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "Let me display your active wallet address..."
                }
            }
        ]
    ]
};
exports.default = walletAddressAction;
