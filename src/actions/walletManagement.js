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
var wallet_storage_js_1 = require("../utils/wallet-storage.js");
var walletManagementAction = {
    name: "WALLET_MANAGEMENT",
    similes: [
        "WALLET_SWITCH",
        "WALLET_LIST",
        "WALLET_RENAME",
        "WALLET_CREATE",
        "WALLET_DELETE",
        "WALLET_INFO"
    ],
    description: "Manage multiple named wallets - switch, create, rename, delete, and view wallet information",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, walletKeywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            walletKeywords = [
                'wallet', 'switch wallet', 'list wallets', 'create wallet',
                'rename wallet', 'delete wallet', 'wallet info', 'my wallets',
                'change wallet', 'new wallet', 'wallet settings', 'active wallet'
            ];
            return [2 /*return*/, walletKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, walletStorage, action, wallets, activeWallet_1, responseText, switchMatch, targetName_1, targetWallet, switched, settings_1, renameMatch, currentName_1, newName, walletToRename, renamed, createMatch, walletName, deleteMatch, nameToDelete_1, walletToDelete, settings;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            try {
                text = message.content.text.toLowerCase();
                walletStorage = wallet_storage_js_1.WalletStorage.getInstance();
                action = 'list';
                if (text.includes('switch') || text.includes('change wallet'))
                    action = 'switch';
                else if (text.includes('rename'))
                    action = 'rename';
                else if (text.includes('delete') || text.includes('remove'))
                    action = 'delete';
                else if (text.includes('create') || text.includes('new wallet'))
                    action = 'create';
                else if (text.includes('info') || text.includes('details'))
                    action = 'info';
                else if (text.includes('active') || text.includes('current'))
                    action = 'active';
                wallets = walletStorage.getWalletList();
                activeWallet_1 = walletStorage.getActiveWallet();
                responseText = '';
                switch (action) {
                    case 'list':
                        responseText = "\uD83D\uDC5B **Wallet Management Dashboard**\n\n**Active Wallet:** ".concat(activeWallet_1 ? "\uD83D\uDFE2 ".concat(activeWallet_1.name) : '❌ None', "\n").concat(activeWallet_1 ? "\u2022 Address: ".concat(activeWallet_1.address, "\n\u2022 Last Used: ").concat(new Date(activeWallet_1.lastUsed).toLocaleString()) : '', "\n\n**All Wallets (").concat(wallets.length, "/").concat(walletStorage.getAllWallets().maxWallets || 3, "):**\n").concat(wallets.map(function (wallet, i) {
                            var isActive = (activeWallet_1 === null || activeWallet_1 === void 0 ? void 0 : activeWallet_1.id) === wallet.id;
                            var indicator = isActive ? '🟢 Active' : '⚫ Inactive';
                            return "".concat(i + 1, ". **").concat(wallet.name, "** ").concat(indicator, "\n   Address: ").concat(wallet.address, "\n   Last Used: ").concat(new Date(wallet.lastUsed).toLocaleString(), "\n   ID: ").concat(wallet.id);
                        }).join('\n'), "\n\n**\uD83D\uDCA1 Available Actions:**\n\u2022 \"Switch to [wallet name]\" - Change active wallet\n\u2022 \"Rename [wallet name] to [new name]\" - Update wallet name\n\u2022 \"Create new wallet named [name]\" - Add wallet (max 3)\n\u2022 \"Delete wallet [name]\" - Remove wallet\n\u2022 \"Show wallet info\" - Detailed current wallet info\n\n**\u2699\uFE0F Per-Wallet Settings:**\nEach wallet has its own slippage settings, MEV protection, and trading preferences.");
                        break;
                    case 'switch':
                        switchMatch = text.match(/(?:switch|change).*?(?:to|wallet)\s+(.+?)(?:\s|$)/i);
                        targetName_1 = (_a = switchMatch === null || switchMatch === void 0 ? void 0 : switchMatch[1]) === null || _a === void 0 ? void 0 : _a.trim();
                        if (!targetName_1) {
                            responseText = "\u274C **Wallet Switch Failed**\n\nPlease specify which wallet to switch to.\n\n**Available wallets:**\n".concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name); }).join('\n'), "\n\n**Try:** \"Switch to [wallet name]\"");
                            break;
                        }
                        targetWallet = wallets.find(function (w) {
                            return w.name.toLowerCase().includes(targetName_1.toLowerCase()) ||
                                w.address.toLowerCase().includes(targetName_1.toLowerCase());
                        });
                        if (!targetWallet) {
                            responseText = "\u274C **Wallet Not Found**\n\nNo wallet found matching \"".concat(targetName_1, "\".\n\n**Available wallets:**\n").concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name, " (").concat(w.address, ")"); }).join('\n'));
                            break;
                        }
                        switched = walletStorage.switchWallet(targetWallet.id);
                        if (switched) {
                            settings_1 = walletStorage.getWalletSettings(targetWallet.id);
                            responseText = "\u2705 **Wallet Switched Successfully**\n\n**Now Active:** ".concat(targetWallet.name, "\n\u2022 Address: ").concat(targetWallet.address, "\n\u2022 Slippage: ").concat((settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.slippagePercentage) || 0.5, "%\n\u2022 MEV Protection: ").concat((settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.mevProtection) ? 'Enabled' : 'Disabled', "\n\u2022 Auto Slippage: ").concat((settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.autoSlippage) ? 'Enabled' : 'Disabled', "\n\u2022 Deadline: ").concat((settings_1 === null || settings_1 === void 0 ? void 0 : settings_1.transactionDeadline) || 20, " minutes\n\n**Ready for trading with this wallet!**\nAll transactions will now use these settings.");
                        }
                        else {
                            responseText = "\u274C Failed to switch to wallet \"".concat(targetName_1, "\"");
                        }
                        break;
                    case 'rename':
                        renameMatch = text.match(/rename\s+(.+?)\s+to\s+(.+?)(?:\s|$)/i);
                        if (!renameMatch) {
                            responseText = "\u274C **Rename Format Incorrect**\n\nPlease use: \"Rename [current name] to [new name]\"\n\n**Example:** \"Rename Wallet 1 to Trading Wallet\"";
                            break;
                        }
                        currentName_1 = (_b = renameMatch[1]) === null || _b === void 0 ? void 0 : _b.trim();
                        newName = renameMatch[2].trim();
                        walletToRename = wallets.find(function (w) {
                            return w.name.toLowerCase().includes(currentName_1.toLowerCase());
                        });
                        if (!walletToRename) {
                            responseText = "\u274C **Wallet Not Found**\n\nNo wallet found with name containing \"".concat(currentName_1, "\".\n\n**Available wallets:**\n").concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name); }).join('\n'));
                            break;
                        }
                        renamed = walletStorage.renameWallet(walletToRename.id, newName);
                        if (renamed) {
                            responseText = "\u2705 **Wallet Renamed Successfully**\n\n**Old Name:** ".concat(currentName_1, "\n**New Name:** ").concat(newName, "\n**Address:** ").concat(walletToRename.address, "\n\nThe wallet name has been updated and saved.");
                        }
                        else {
                            responseText = "\u274C Failed to rename wallet \"".concat(currentName_1, "\"");
                        }
                        break;
                    case 'create':
                        createMatch = text.match(/(?:create|new).*?(?:named|called)\s+(.+?)(?:\s|$)/i);
                        walletName = ((_c = createMatch === null || createMatch === void 0 ? void 0 : createMatch[1]) === null || _c === void 0 ? void 0 : _c.trim()) || "Wallet ".concat(wallets.length + 1);
                        try {
                            // This would need to integrate with the actual wallet creation logic
                            responseText = "\u26A0\uFE0F **Wallet Creation**\n\nTo create a new wallet named \"".concat(walletName, "\":\n\n**Option 1: Generate New Wallet**\n\u2022 \"Generate new wallet\" - Create fresh wallet with new keys\n\n**Option 2: Import Existing**  \n\u2022 \"Import wallet with mnemonic\" - Use existing seed phrase\n\u2022 \"Import wallet with private key\" - Use existing private key\n\n**Current Status:**\n\u2022 Wallets: ").concat(wallets.length, "/").concat(walletStorage.getAllWallets().maxWallets || 3, " (max allowed)\n\u2022 ").concat(wallets.length >= 3 ? '❌ Maximum wallets reached' : '✅ Can create more wallets', "\n\n**Note:** Each wallet will have independent slippage settings and trading preferences.");
                        }
                        catch (error) {
                            responseText = "\u274C **Cannot Create Wallet**\n\n".concat(error instanceof Error ? error.message : 'Unknown error occurred', "\n\n**Current Status:**\n\u2022 Wallets: ").concat(wallets.length, "/").concat(walletStorage.getAllWallets().maxWallets || 3);
                        }
                        break;
                    case 'delete':
                        deleteMatch = text.match(/delete\s+(?:wallet\s+)?(.+?)(?:\s|$)/i);
                        nameToDelete_1 = (_d = deleteMatch === null || deleteMatch === void 0 ? void 0 : deleteMatch[1]) === null || _d === void 0 ? void 0 : _d.trim();
                        if (!nameToDelete_1) {
                            responseText = "\u274C **Delete Format Incorrect**\n\nPlease specify which wallet to delete.\n\n**Format:** \"Delete wallet [name]\"\n**Example:** \"Delete wallet Trading\"\n\n**\u26A0\uFE0F Warning:** This action cannot be undone!";
                            break;
                        }
                        walletToDelete = wallets.find(function (w) {
                            return w.name.toLowerCase().includes(nameToDelete_1.toLowerCase());
                        });
                        if (!walletToDelete) {
                            responseText = "\u274C **Wallet Not Found**\n\nNo wallet found with name containing \"".concat(nameToDelete_1, "\".\n\n**Available wallets:**\n").concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name); }).join('\n'));
                            break;
                        }
                        if (wallets.length === 1) {
                            responseText = "\u274C **Cannot Delete Last Wallet**\n\nYou cannot delete your only remaining wallet.\nCreate another wallet first before deleting this one.";
                            break;
                        }
                        responseText = "\u26A0\uFE0F **Confirm Wallet Deletion**\n\n**Wallet to Delete:** ".concat(walletToDelete.name, "\n**Address:** ").concat(walletToDelete.address, "\n**Warning:** This action is PERMANENT and cannot be undone!\n\n**\u26A0\uFE0F IMPORTANT:**\n\u2022 Make sure you have the private key/mnemonic saved elsewhere\n\u2022 Any funds in this wallet will become inaccessible through this app\n\u2022 This only removes the wallet from the app, not from the blockchain\n\n**To confirm:** \"Yes, delete wallet ").concat(walletToDelete.name, "\"\n**To cancel:** \"Cancel deletion\"");
                        break;
                    case 'active':
                    case 'info':
                        if (!activeWallet_1) {
                            responseText = "\u274C **No Active Wallet**\n\nNo wallet is currently active. Please switch to a wallet first.\n\n**Available wallets:**\n".concat(wallets.map(function (w, i) { return "".concat(i + 1, ". ").concat(w.name); }).join('\n'), "\n\n**Use:** \"Switch to [wallet name]\"");
                            break;
                        }
                        settings = walletStorage.getWalletSettings();
                        responseText = "\uD83D\uDD0D **Active Wallet Information**\n\n**\uD83D\uDCCB Wallet Details:**\n\u2022 Name: ".concat(activeWallet_1.name, "\n\u2022 Address: ").concat(activeWallet_1.address, "\n\u2022 Created: ").concat(new Date(activeWallet_1.createdAt).toLocaleString(), "\n\u2022 Last Used: ").concat(new Date(activeWallet_1.lastUsed).toLocaleString(), "\n\n**\u2699\uFE0F Current Settings:**\n\u2022 Slippage Tolerance: ").concat((settings === null || settings === void 0 ? void 0 : settings.slippagePercentage) || 0.5, "%\n\u2022 MEV Protection: ").concat((settings === null || settings === void 0 ? void 0 : settings.mevProtection) ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Auto Slippage: ").concat((settings === null || settings === void 0 ? void 0 : settings.autoSlippage) ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Transaction Deadline: ").concat((settings === null || settings === void 0 ? void 0 : settings.transactionDeadline) || 20, " minutes\n\n**\uD83D\uDCCA Wallet Management:**\n\u2022 Total Wallets: ").concat(wallets.length, "/").concat(walletStorage.getAllWallets().maxWallets || 3, "\n\u2022 Storage Location: ").concat(walletStorage.getStorageLocation(), "\n\n**\uD83D\uDCA1 Quick Actions:**\n\u2022 \"Change slippage to X%\" - Update slippage for this wallet\n\u2022 \"Switch to [wallet name]\" - Change active wallet\n\u2022 \"List wallets\" - View all wallets");
                        break;
                    default:
                        responseText = "\uD83D\uDC5B **Wallet Management Help**\n\n**Available Commands:**\n\n**\uD83D\uDCCB View & Switch:**\n\u2022 \"List wallets\" - Show all wallets\n\u2022 \"Switch to [name]\" - Change active wallet\n\u2022 \"Show wallet info\" - Current wallet details\n\n**\u270F\uFE0F Manage:**\n\u2022 \"Rename [old] to [new]\" - Update wallet name\n\u2022 \"Create new wallet named [name]\" - Add wallet\n\u2022 \"Delete wallet [name]\" - Remove wallet\n\n**Current Status:**\n\u2022 Active: ".concat((activeWallet_1 === null || activeWallet_1 === void 0 ? void 0 : activeWallet_1.name) || 'None', "\n\u2022 Total: ").concat(wallets.length, "/").concat(walletStorage.getAllWallets().maxWallets || 3, " wallets\n\nEach wallet has independent trading settings!");
                        break;
                }
                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return [2 /*return*/, true];
            }
            catch (error) {
                console.error('Wallet management action error:', error);
                if (callback) {
                    callback({
                        text: "\u274C Failed to manage wallets: ".concat(error instanceof Error ? error.message : 'Unknown error')
                    });
                }
                return [2 /*return*/, false];
            }
            return [2 /*return*/];
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "List my wallets" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you all your wallets with their names, addresses, and which one is currently active.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Switch to Trading Wallet" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll switch to your Trading Wallet and show you its current settings and configuration.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Rename Wallet 1 to DeFi Wallet" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll rename your wallet from 'Wallet 1' to 'DeFi Wallet' for easier identification.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ]
    ],
};
exports.default = walletManagementAction;
