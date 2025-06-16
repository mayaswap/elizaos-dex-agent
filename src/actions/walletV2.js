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
var walletV2Action = {
    name: "WALLET_V2",
    similes: [
        "CREATE_WALLET",
        "GENERATE_WALLET",
        "NEW_WALLET",
        "IMPORT_WALLET",
        "WALLET_INFO",
        "MY_WALLET",
        "WALLET_LIST",
        "SWITCH_WALLET",
        "LIST_WALLETS",
        "SHOW_WALLET",
        "WALLET_DASHBOARD",
        "WALLET_SETTINGS"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text_1, walletKeywords, hasWalletKeyword, parsed, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    if (!((_a = message.content) === null || _a === void 0 ? void 0 : _a.text))
                        return [2 /*return*/, false];
                    text_1 = message.content.text.toLowerCase();
                    walletKeywords = [
                        'wallet', 'create', 'generate', 'new wallet', 'import wallet',
                        'list wallet', 'show wallet', 'my wallet', 'wallet info',
                        'wallet settings', 'switch to', 'wallet dashboard'
                    ];
                    hasWalletKeyword = walletKeywords.some(function (keyword) { return text_1.includes(keyword); });
                    if (hasWalletKeyword) {
                        return [2 /*return*/, true];
                    }
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(message.content.text)];
                case 1:
                    parsed = _b.sent();
                    return [2 /*return*/, parsed.intent === 'wallet'];
                case 2:
                    error_1 = _b.sent();
                    console.error('Wallet V2 validation error:', error_1);
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    description: "Advanced multi-platform wallet management with database storage and encryption",
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var userMessage, lowerText, walletService, platformUser, responseText, nameMatch, walletName, newWallet, error_2, wallets, summary, error_3, switchMatch, targetName_1, wallets, targetWallet, success, activeWallet, error_4;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    _f.trys.push([0, 25, , 26]);
                    userMessage = ((_a = message.content) === null || _a === void 0 ? void 0 : _a.text) || "";
                    lowerText = userMessage.toLowerCase();
                    walletService = void 0;
                    if (!((_b = runtime.customServices) === null || _b === void 0 ? void 0 : _b.wallet)) return [3 /*break*/, 1];
                    walletService = runtime.customServices.wallet;
                    console.log('✅ Using shared WalletService from runtime');
                    return [3 /*break*/, 3];
                case 1:
                    // Fallback: create new instance if not available
                    console.warn("⚠️ Shared wallet service not available, creating new WalletService instance");
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.initializeDatabase()];
                case 2:
                    _f.sent();
                    _f.label = 3;
                case 3:
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    responseText = "";
                    if (!(lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('new'))) return [3 /*break*/, 8];
                    nameMatch = lowerText.match(/(?:named|called)\s+(.+?)(?:\s|$)/i);
                    walletName = (_c = nameMatch === null || nameMatch === void 0 ? void 0 : nameMatch[1]) === null || _c === void 0 ? void 0 : _c.trim();
                    _f.label = 4;
                case 4:
                    _f.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, walletService.createWallet(platformUser, walletName)];
                case 5:
                    newWallet = _f.sent();
                    responseText = "\uD83C\uDF89 **New Wallet Created Successfully!**\n\n**Platform:** ".concat(platformUser.platform.toUpperCase(), "\n**Wallet Name:** ").concat(newWallet.name, "\n\n\uD83D\uDCCB **Full Address (Tap to Copy):**\n`").concat(newWallet.address, "`\n\n\u26A0\uFE0F **IMPORTANT SECURITY NOTES:**\n\u2022 Your wallet is securely encrypted and stored in the database\n\u2022 Each platform account has its own isolated wallet storage\n\u2022 Maximum 5 wallets per platform account\n\u2022 Wallet is automatically set as active\n\n\uD83D\uDE80 **Next Steps:**\n1. Fund your wallet with tokens from another wallet or exchange\n2. Start trading with commands like \"swap 100 USDC for WPLS\"\n3. Check your balance with \"show my balance\"\n\n**\uD83D\uDCF1 Platform Benefits:**\n\u2022 **Terminal**: Direct command-line access\n\u2022 **Database**: Persistent storage with encryption\n\u2022 **Multi-Platform**: Ready for Telegram, Discord, Web\n\n**\uD83D\uDD12 Security Features:**\n\u2022 AES-256 encryption for private keys\n\u2022 Platform-isolated storage\n\u2022 Database-backed persistence\n\u2022 Secure key derivation\n\n*Ready to start trading on PulseChain, Base, and other EVM networks!*");
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _f.sent();
                    responseText = "\u274C **Failed to Create Wallet**\n\n".concat(error_2 instanceof Error ? error_2.message : 'Unknown error occurred', "\n\n**Possible Issues:**\n\u2022 Maximum wallet limit reached (5 per platform)\n\u2022 Database connection error\n\u2022 Encryption key not available\n\n**Try Again:** \"create new wallet\" or contact support if the issue persists.");
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 24];
                case 8:
                    if (!lowerText.includes('import')) return [3 /*break*/, 9];
                    responseText = "\uD83D\uDD10 **Import Existing Wallet**\n\nTo import your existing wallet, I need either:\n\n**Option 1: Private Key Import**\nSend: \"import wallet with private key: YOUR_PRIVATE_KEY\"\n\n**Option 2: Mnemonic Phrase Import**  \nSend: \"import wallet with mnemonic: YOUR_SEED_PHRASE\"\n\n**\u26A0\uFE0F SECURITY WARNING:**\n\u2022 Only import wallets in secure, private conversations\n\u2022 Never share private keys or seed phrases publicly\n\u2022 Double-check you're talking to the official bot\n\u2022 Consider using a dedicated trading wallet with limited funds\n\n**\uD83D\uDD12 What Happens:**\n\u2022 Your private key/mnemonic is immediately encrypted\n\u2022 Original key material is never stored in plain text\n\u2022 Wallet is added to your platform account\n\u2022 You can name it during import: \"import wallet named MyWallet with private key: ...\"\n\n**Ready to import?** Send your private key or mnemonic phrase.";
                    return [3 /*break*/, 24];
                case 9:
                    if (!(lowerText.includes('list') || lowerText.includes('show') || lowerText.includes('my wallet') || lowerText.includes('what is my wallet'))) return [3 /*break*/, 15];
                    _f.label = 10;
                case 10:
                    _f.trys.push([10, 13, , 14]);
                    return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 11:
                    wallets = _f.sent();
                    return [4 /*yield*/, walletService.getUserSummary(platformUser)];
                case 12:
                    summary = _f.sent();
                    if (wallets.length === 0) {
                        responseText = "\uD83D\uDC5B **No Wallets Found**\n\nYou don't have any wallets yet on ".concat(platformUser.platform.toUpperCase(), ".\n\n**Get Started:**\n\u2022 \"create new wallet\" - Generate a fresh wallet\n\u2022 \"import wallet\" - Import existing wallet from private key/mnemonic\n\n**Platform:** ").concat(platformUser.platform.toUpperCase(), "\n**User ID:** ").concat(platformUser.platformUserId);
                    }
                    else {
                        responseText = "\uD83D\uDC5B **Your Wallet Dashboard**\n\n**Platform:** ".concat(platformUser.platform.toUpperCase(), " (@").concat(platformUser.platformUsername || platformUser.platformUserId, ")\n**Total Wallets:** ").concat(summary.totalWallets, "/5\n**Member Since:** ").concat(summary.createdAt.toLocaleDateString(), "\n\n**\uD83D\uDFE2 Active Wallet:** ").concat(((_d = summary.activeWallet) === null || _d === void 0 ? void 0 : _d.name) || 'None', "\n").concat(summary.activeWallet ? "\u2022 Address: `".concat(summary.activeWallet.address, "`\n\u2022 Created: ").concat(summary.activeWallet.createdAt.toLocaleDateString(), "\n\u2022 Last Used: ").concat(summary.activeWallet.lastUsed.toLocaleString()) : '', "\n\n**\uD83D\uDCCB All Wallets:**\n").concat(wallets.map(function (wallet, i) {
                            var indicator = wallet.isActive ? '🟢 Active' : '⚫ Inactive';
                            return "".concat(i + 1, ". **").concat(wallet.name, "** ").concat(indicator, "\n   \uD83D\uDCCD `").concat(wallet.address, "`\n   \uD83D\uDCC5 Created: ").concat(wallet.createdAt.toLocaleDateString(), "\n   \u2699\uFE0F Slippage: ").concat(wallet.settings.slippagePercentage, "%\n   \uD83D\uDEE1\uFE0F MEV Protection: ").concat(wallet.settings.mevProtection ? 'ON' : 'OFF');
                        }).join('\n\n'), "\n\n**\uD83D\uDCA1 Wallet Actions:**\n\u2022 \"switch to [wallet name]\" - Change active wallet\n\u2022 \"wallet settings\" - Configure trading preferences\n\u2022 \"create new wallet\" - Add another wallet (max 5)\n\u2022 \"import wallet\" - Import from private key/mnemonic\n\n**\uD83D\uDD12 Security Status:**\n\u2705 Private keys encrypted with AES-256\n\u2705 Platform-isolated storage\n\u2705 Database backup & recovery");
                    }
                    return [3 /*break*/, 14];
                case 13:
                    error_3 = _f.sent();
                    responseText = "\u274C **Error retrieving wallets**\n\n".concat(error_3 instanceof Error ? error_3.message : 'Unknown error occurred', "\n\n**Try:** \"create new wallet\" to get started.");
                    return [3 /*break*/, 14];
                case 14: return [3 /*break*/, 24];
                case 15:
                    if (!lowerText.includes('switch')) return [3 /*break*/, 21];
                    switchMatch = lowerText.match(/switch\s+to\s+(.+?)(?:\s|$)/i);
                    targetName_1 = (_e = switchMatch === null || switchMatch === void 0 ? void 0 : switchMatch[1]) === null || _e === void 0 ? void 0 : _e.trim();
                    if (!!targetName_1) return [3 /*break*/, 16];
                    responseText = "\u274C **Wallet Switch Failed**\n\nPlease specify which wallet to switch to.\n\n**Usage:** \"switch to [wallet name]\"\n**Example:** \"switch to MyTradingWallet\"\n\nUse \"list wallets\" to see available wallets.";
                    return [3 /*break*/, 20];
                case 16: return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 17:
                    wallets = _f.sent();
                    targetWallet = wallets.find(function (w) {
                        return w.name.toLowerCase().includes(targetName_1.toLowerCase()) ||
                            w.address.toLowerCase().includes(targetName_1.toLowerCase());
                    });
                    if (!!targetWallet) return [3 /*break*/, 18];
                    responseText = "\u274C **Wallet Not Found**\n\nNo wallet found matching \"".concat(targetName_1, "\".\n\n**Available wallets:**\n").concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name); }).join('\n'), "\n\n**Try:** \"switch to [exact wallet name]\"");
                    return [3 /*break*/, 20];
                case 18: return [4 /*yield*/, walletService.switchWallet(platformUser, targetWallet.id)];
                case 19:
                    success = _f.sent();
                    if (success) {
                        responseText = "\u2705 **Wallet Switched Successfully**\n\n**New Active Wallet:** ".concat(targetWallet.name, "\n**Address:** `").concat(targetWallet.address, "`\n**Settings:**\n\u2022 Slippage: ").concat(targetWallet.settings.slippagePercentage, "%\n\u2022 MEV Protection: ").concat(targetWallet.settings.mevProtection ? 'ON' : 'OFF', "\n\u2022 Auto Slippage: ").concat(targetWallet.settings.autoSlippage ? 'ON' : 'OFF', "\n\n**Ready for Trading!** Your commands will now use this wallet.\n\n**Quick Actions:**\n\u2022 \"show my balance\" - Check token balances\n\u2022 \"swap 100 USDC for WPLS\" - Execute trades\n\u2022 \"wallet settings\" - Modify trading preferences");
                    }
                    else {
                        responseText = "\u274C **Failed to Switch Wallet**\n\nCould not switch to \"".concat(targetWallet.name, "\". This might be due to:\n\u2022 Database connection error\n\u2022 Wallet synchronization issue\n\n**Try Again:** \"switch to ").concat(targetWallet.name, "\"");
                    }
                    _f.label = 20;
                case 20: return [3 /*break*/, 24];
                case 21:
                    if (!lowerText.includes('settings')) return [3 /*break*/, 23];
                    return [4 /*yield*/, walletService.getActiveWallet(platformUser)];
                case 22:
                    activeWallet = _f.sent();
                    if (!activeWallet) {
                        responseText = "\u274C **No Active Wallet**\n\nYou need to have an active wallet to view settings.\n\n**Get Started:**\n\u2022 \"create new wallet\" - Generate a fresh wallet\n\u2022 \"list wallets\" - View existing wallets";
                    }
                    else {
                        responseText = "\u2699\uFE0F **Wallet Settings: ".concat(activeWallet.name, "**\n\n**\uD83C\uDFAF Trading Settings:**\n\u2022 **Slippage Tolerance:** ").concat(activeWallet.settings.slippagePercentage, "%\n\u2022 **MEV Protection:** ").concat(activeWallet.settings.mevProtection ? '✅ Enabled' : '❌ Disabled', "\n\u2022 **Auto Slippage:** ").concat(activeWallet.settings.autoSlippage ? '✅ Enabled' : '❌ Disabled', "\n\u2022 **Transaction Deadline:** ").concat(activeWallet.settings.transactionDeadline, " minutes\n\u2022 **Gas Price Preference:** ").concat(activeWallet.settings.preferredGasPrice || 'standard', "\n\n**\uD83D\uDD14 Notification Settings:**\n\u2022 **Price Alerts:** ").concat(activeWallet.settings.notifications.priceAlerts ? '✅ ON' : '❌ OFF', "\n\u2022 **Transaction Updates:** ").concat(activeWallet.settings.notifications.transactionUpdates ? '✅ ON' : '❌ OFF', "\n\u2022 **Portfolio Changes:** ").concat(activeWallet.settings.notifications.portfolioChanges ? '✅ ON' : '❌ OFF', "\n\n**\uD83D\uDCCA Wallet Info:**\n\u2022 **Address:** `").concat(activeWallet.address, "`\n\u2022 **Created:** ").concat(activeWallet.createdAt.toLocaleDateString(), "\n\u2022 **Last Used:** ").concat(activeWallet.lastUsed.toLocaleString(), "\n\n**\uD83D\uDCA1 Update Settings:**\n\u2022 \"set slippage to 1%\" - Change slippage tolerance\n\u2022 \"enable MEV protection\" - Toggle MEV protection\n\u2022 \"disable auto slippage\" - Toggle auto slippage\n\u2022 \"set gas to fast\" - Change gas preference (slow/standard/fast)\n\n**Each wallet has independent settings!**");
                    }
                    return [3 /*break*/, 24];
                case 23:
                    // General wallet help
                    responseText = "\uD83D\uDC5B **Multi-Platform Wallet System**\n\n**Platform:** ".concat(platformUser.platform.toUpperCase(), "\n\n**\uD83D\uDE80 Available Commands:**\n\n**\uD83D\uDCB0 Wallet Management:**\n\u2022 \"create new wallet\" - Generate fresh wallet\n\u2022 \"list wallets\" - Show all your wallets\n\u2022 \"switch to [name]\" - Change active wallet\n\u2022 \"wallet settings\" - View/modify trading preferences\n\n**\uD83D\uDD10 Import/Export:**\n\u2022 \"import wallet\" - Import from private key/mnemonic\n\u2022 \"import wallet named MyWallet with private key: 0x...\" - Import with name\n\n**\u2699\uFE0F Configuration:**\n\u2022 \"set slippage to X%\" - Update slippage tolerance\n\u2022 \"enable MEV protection\" - Toggle MEV protection\n\u2022 \"wallet settings\" - View current configuration\n\n**\uD83C\uDFAF Features:**\n\u2705 **Terminal Access:** Direct command-line interface\n\u2705 **Secure Storage:** AES-256 encrypted private keys\n\u2705 **Multiple Wallets:** Up to 5 wallets per platform\n\u2705 **Independent Settings:** Each wallet has its own preferences\n\u2705 **Database Persistence:** All data stored securely\n\n**\uD83D\uDCF1 Current Status:**\n\u2022 Platform: ").concat(platformUser.platform.toUpperCase(), "\n\u2022 User: ").concat(platformUser.platformUsername || platformUser.platformUserId, "\n\n**Get Started:** \"create new wallet\" or \"list wallets\"");
                    _f.label = 24;
                case 24:
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 25:
                    error_4 = _f.sent();
                    console.error('Wallet V2 action error:', error_4);
                    if (callback) {
                        callback({
                            text: "\u274C **Wallet System Error**\n\nAn unexpected error occurred: ".concat(error_4 instanceof Error ? error_4.message : 'Unknown error', "\n\n**Possible Solutions:**\n\u2022 Try again in a few moments\n\u2022 Check if the database is accessible\n\u2022 Verify your platform permissions\n\n**For Support:** Please report this error with the timestamp: ").concat(new Date().toISOString())
                        });
                    }
                    return [2 /*return*/, false];
                case 26: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "create new wallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "I'll create a new wallet for you with secure encryption and database storage." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "list my wallets" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here are all your wallets with their current settings and activity status." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "what is my wallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here's your current wallet information and dashboard." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "switch to MyTradingWallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "Successfully switched to MyTradingWallet. All trading commands will now use this wallet." }
            }
        ]
    ]
};
exports.default = walletV2Action;
