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
var databaseService_js_1 = require("../services/databaseService.js");
var watchlistsAction = {
    name: "WATCHLISTS",
    similes: [
        "CREATE_WATCHLIST",
        "MY_WATCHLIST",
        "TOKEN_LIST",
        "WATCH_TOKENS",
        "FAVORITE_TOKENS",
        "TRACK_TOKENS"
    ],
    description: "Create and manage token watchlists for easy price monitoring",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, keywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            keywords = [
                'watchlist', 'watch list', 'my tokens', 'favorite tokens',
                'create watchlist', 'add to watchlist', 'track tokens',
                'token list', 'my list', 'watchlists', 'favorites'
            ];
            return [2 /*return*/, keywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, platformUser, dbService, userPlatformId, responseText, nameMatch, tokensMatch, watchlistName, tokensString, tokens, watchlistId, error_1, watchlists, action, actionMatch, nameMatch, error_2;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 11, , 12]);
                    text = message.content.text.toLowerCase();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    dbService = new databaseService_js_1.DatabaseService(runtime);
                    return [4 /*yield*/, dbService.initializeDatabase()];
                case 1:
                    _c.sent();
                    userPlatformId = "".concat(platformUser.platform, ":").concat(platformUser.platformUserId);
                    responseText = '';
                    if (!(text.includes('create') || text.includes('new'))) return [3 /*break*/, 7];
                    nameMatch = text.match(/(?:create|new).*?watchlist.*?(?:named|called)\s+(.+?)(?:\s|$)/i);
                    tokensMatch = text.match(/(?:with|containing|tokens?)\s+(.+?)(?:\s|$)/i);
                    if (!!nameMatch) return [3 /*break*/, 2];
                    responseText = "\uD83D\uDCCB **Create New Watchlist**\n\nPlease specify a name for your watchlist:\n\n**Examples:**\n\u2022 \"Create watchlist named DeFi Gems\"\n\u2022 \"New watchlist called My Favorites with HEX WPLS USDC\"\n\u2022 \"Create watchlist named High Risk with tokens PLSX DAI\"\n\n**Format:** `create watchlist named [NAME] with [TOKEN1] [TOKEN2] [TOKEN3]`\n\n**Popular Watchlist Ideas:**\n\u2022 **DeFi Blue Chips** - Established DeFi tokens\n\u2022 **PulseChain Native** - WPLS, HEX, PLSX\n\u2022 **Stablecoins** - USDC, USDT, DAI\n\u2022 **Gaming Tokens** - Gaming and NFT projects\n\u2022 **High Beta** - Volatile tokens for active trading\n\nReady to create your watchlist!";
                    return [3 /*break*/, 6];
                case 2:
                    watchlistName = ((_a = nameMatch[1]) === null || _a === void 0 ? void 0 : _a.trim()) || '';
                    tokensString = ((_b = tokensMatch === null || tokensMatch === void 0 ? void 0 : tokensMatch[1]) === null || _b === void 0 ? void 0 : _b.trim()) || '';
                    tokens = tokensString ? tokensString.split(/[\s,]+/).map(function (t) { return t.toUpperCase(); }).filter(function (t) { return t.length > 0; }) : [];
                    if (!!watchlistName) return [3 /*break*/, 3];
                    responseText = "\u274C **Missing Watchlist Name**\n\nPlease provide a name for your watchlist.\n\n**Example:** \"Create watchlist named DeFi Favorites\"";
                    return [3 /*break*/, 6];
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, dbService.createWatchlist({
                            userPlatformId: userPlatformId,
                            name: watchlistName,
                            tokenSymbols: tokens,
                            description: "Custom watchlist created on ".concat(platformUser.platform),
                            createdAt: new Date().toISOString(),
                            platform: platformUser.platform,
                            isDefault: false
                        })];
                case 4:
                    watchlistId = _c.sent();
                    responseText = "\uD83D\uDCCB **Watchlist Created Successfully!**\n\n**Name:** ".concat(watchlistName, "\n**Tokens:** ").concat(tokens.length > 0 ? tokens.join(', ') : 'None (can add later)', "\n**Platform:** ").concat(platformUser.platform.toUpperCase(), "\n**Watchlist ID:** ").concat(watchlistId, "\n\n**\uD83C\uDFAF What's Next:**\n").concat(tokens.length > 0 ?
                        "\u2022 Your watchlist is ready with ".concat(tokens.length, " tokens\n\u2022 Check prices: \"show prices for ").concat(watchlistName, "\"\n\u2022 Add more tokens: \"add PLSX to ").concat(watchlistName, "\"") :
                        "\u2022 Add tokens: \"add HEX WPLS USDC to ".concat(watchlistName, "\"\n\u2022 Import from favorites: \"add my favorite tokens to ").concat(watchlistName, "\""), "\n\n**\uD83D\uDCF1 Management:**\n\u2022 \"show my watchlists\" - View all lists\n\u2022 \"edit ").concat(watchlistName, "\" - Modify this list\n\u2022 \"delete ").concat(watchlistName, "\" - Remove this list\n\n**\uD83D\uDCA1 Pro Tips:**\n\u2022 Organize tokens by category (DeFi, Gaming, etc.)\n\u2022 Create separate lists for different risk levels\n\u2022 Use watchlists for quick price checks\n\n*Your watchlist \"").concat(watchlistName, "\" is ready for monitoring!*");
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _c.sent();
                    responseText = "\u274C **Failed to Create Watchlist**\n\nCould not create watchlist: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error', "\n\n**Please Try Again:**\n\u2022 Check the watchlist name is valid\n\u2022 Ensure token symbols are correct\n\u2022 Example: \"create watchlist named DeFi Tokens with HEX WPLS USDC\"");
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 10];
                case 7:
                    if (!(text.includes('show') || text.includes('list') || text.includes('my'))) return [3 /*break*/, 9];
                    return [4 /*yield*/, dbService.getUserWatchlists(userPlatformId)];
                case 8:
                    watchlists = _c.sent();
                    if (watchlists.length === 0) {
                        responseText = "\uD83D\uDCCB **Your Token Watchlists**\n\nYou don't have any watchlists yet.\n\n**Create Your First Watchlist:**\n\u2022 \"Create watchlist named DeFi Gems with HEX WPLS USDC\"\n\u2022 \"New watchlist called Stablecoins with USDC USDT DAI\"\n\u2022 \"Create watchlist named PulseChain with WPLS HEX PLSX\"\n\n**Benefits:**\n\u2022 Quick price checks for multiple tokens\n\u2022 Organized token monitoring\n\u2022 Easy portfolio planning\n\u2022 Custom categories and themes\n\n**Popular Watchlist Ideas:**\n\uD83D\uDD35 **Blue Chip DeFi** - Established tokens\n\uD83D\uDFE2 **PulseChain Native** - WPLS, HEX, PLSX\n\uD83D\uDFE1 **Stablecoins** - USDC, USDT, DAI\n\uD83D\uDD34 **High Risk/Reward** - Volatile tokens\n\u26AB **Gaming & NFTs** - Gaming ecosystem\n\n**Get Started:** \"create watchlist named [NAME] with [TOKENS]\"";
                    }
                    else {
                        responseText = "\uD83D\uDCCB **Your Token Watchlists**\n\n**Platform:** ".concat(platformUser.platform.toUpperCase(), "\n**Total Lists:** ").concat(watchlists.length, "\n\n").concat(watchlists.map(function (list, i) {
                            var defaultBadge = list.isDefault ? '⭐ Default' : '';
                            var tokenCount = list.tokenSymbols.length;
                            return "**".concat(i + 1, ". ").concat(list.name, "** ").concat(defaultBadge, "\n\uD83D\uDCCA **Tokens:** ").concat(tokenCount > 0 ? "".concat(tokenCount, " tokens") : 'Empty', "\n").concat(tokenCount > 0 ? "\uD83D\uDD17 **Symbols:** ".concat(list.tokenSymbols.slice(0, 5).join(', ')).concat(tokenCount > 5 ? " +".concat(tokenCount - 5, " more") : '') : '', "\n\uD83D\uDCC5 **Created:** ").concat(new Date(list.createdAt).toLocaleDateString(), "\n\uD83C\uDD94 **ID:** ").concat(list.id.slice(-8), "\n").concat(list.description ? "\uD83D\uDCAC **Note:** ".concat(list.description) : '');
                        }).join('\n\n'), "\n\n**\uD83D\uDCF1 Quick Actions:**\n\u2022 \"show prices for [LIST_NAME]\" - Check all prices\n\u2022 \"add HEX to [LIST_NAME]\" - Add token to list\n\u2022 \"remove USDC from [LIST_NAME]\" - Remove token\n\u2022 \"edit [LIST_NAME]\" - Modify list\n\n**\uD83C\uDFAF Bulk Actions:**\n\u2022 \"check all watchlists\" - Prices for all lists\n\u2022 \"export watchlists\" - Get list data\n\u2022 \"merge lists\" - Combine watchlists\n\n**\uD83D\uDCA1 Management Tips:**\n\u2022 Keep lists organized by theme or strategy\n\u2022 Regularly review and update token selections\n\u2022 Use descriptive names for easy identification\n\n*Your watchlists help you stay on top of the markets!*");
                    }
                    return [3 /*break*/, 10];
                case 9:
                    if (text.includes('add') || text.includes('remove')) {
                        action = text.includes('add') ? 'add' : 'remove';
                        actionMatch = text.match(new RegExp("".concat(action, "\\s+(.+?)\\s+(?:to|from)\\s+(.+?)(?:\\s|$)"), 'i'));
                        if (!actionMatch) {
                            responseText = "\uD83D\uDCDD **".concat(action === 'add' ? 'Add' : 'Remove', " Tokens**\n\nPlease specify tokens and watchlist:\n\n**Format:** \"").concat(action, " [TOKENS] ").concat(action === 'add' ? 'to' : 'from', " [WATCHLIST_NAME]\"\n\n**Examples:**\n\u2022 \"").concat(action, " HEX WPLS ").concat(action === 'add' ? 'to' : 'from', " DeFi Favorites\"\n\u2022 \"").concat(action, " USDC ").concat(action === 'add' ? 'to' : 'from', " Stablecoins\"\n\n**Find Your Watchlists:**\n\u2022 \"show my watchlists\" - View all lists\n\nWhich tokens would you like to ").concat(action, "?");
                        }
                        else {
                            responseText = "\uD83D\uDD27 **Token Management**\n\nWatchlist token management will be implemented.\n\n**For Now:**\n\u2022 Create new watchlists with tokens included\n\u2022 \"show my watchlists\" - View current lists\n\n**Coming Soon:**\n\u2022 Add/remove individual tokens\n\u2022 Bulk token operations\n\u2022 Token reorganization\n\n**Current Workaround:**\n\u2022 Create a new watchlist with your desired tokens\n\u2022 Delete old watchlist if needed\n\nThis feature is in development!";
                        }
                    }
                    else if (text.includes('delete') || text.includes('remove')) {
                        // Delete entire watchlist
                        responseText = "\uD83D\uDDD1\uFE0F **Delete Watchlist**\n\nWatchlist deletion will be implemented.\n\n**For Now:**\n\u2022 \"show my watchlists\" - View current lists\n\u2022 Contact support for manual deletion\n\n**Coming Soon:**\n\u2022 Delete individual watchlists\n\u2022 Bulk watchlist management\n\u2022 Watchlist archiving\n\n**Safety Note:**\n\u2022 Deletion will be permanent\n\u2022 Consider exporting before deleting\n\u2022 Default watchlists may have special protection\n\nThis feature is in development!";
                    }
                    else if (text.includes('prices') || text.includes('check')) {
                        nameMatch = text.match(/(?:prices|check).*?(?:for|of)\s+(.+?)(?:\s|$)/i);
                        if (!nameMatch) {
                            responseText = "\uD83D\uDCB0 **Check Watchlist Prices**\n\nPlease specify which watchlist to check:\n\n**Format:** \"show prices for [WATCHLIST_NAME]\"\n**Example:** \"check prices for DeFi Favorites\"\n\n**Find Your Watchlists:**\n\u2022 \"show my watchlists\" - View all lists\n\n**Quick Checks:**\n\u2022 \"prices for all watchlists\" - Check everything\n\u2022 \"check my favorites\" - Default watchlist prices\n\nWhich watchlist would you like to check?";
                        }
                        else {
                            responseText = "\uD83D\uDCB0 **Watchlist Price Check**\n\nPrice checking for watchlists will be implemented.\n\n**For Now:**\n\u2022 \"price HEX\" - Check individual token prices\n\u2022 \"show my portfolio\" - Portfolio overview\n\n**Coming Soon:**\n\u2022 Bulk price checks for watchlists\n\u2022 Price change highlights\n\u2022 Performance summaries\n\u2022 Alert integration\n\n**Current Workaround:**\n\u2022 Check tokens individually: \"price [TOKEN]\"\n\u2022 Use portfolio view for owned tokens\n\nThis feature is in development!";
                        }
                    }
                    else {
                        // General help for watchlists
                        responseText = "\uD83D\uDCCB **Token Watchlist System**\n\n**\uD83C\uDFAF Available Commands:**\n\n**\uD83D\uDCDD Create Watchlists:**\n\u2022 \"Create watchlist named DeFi Gems with HEX WPLS USDC\"\n\u2022 \"New watchlist called Stablecoins with USDC USDT DAI\"\n\u2022 \"Create watchlist named Gaming with token symbols\"\n\n**\uD83D\uDCCB Manage Watchlists:**\n\u2022 \"show my watchlists\" - View all lists\n\u2022 \"list watchlists\" - Same as above\n\u2022 \"add HEX to DeFi Gems\" - Add token to list\n\u2022 \"remove USDC from Stablecoins\" - Remove token\n\n**\uD83D\uDCB0 Price Monitoring:**\n\u2022 \"show prices for DeFi Gems\" - Check list prices\n\u2022 \"check all watchlists\" - All list prices\n\u2022 \"prices for [NAME]\" - Specific list prices\n\n**\uD83C\uDFAF Watchlist Features:**\n\u2705 **Organized Monitoring** - Group tokens by theme\n\u2705 **Multi-Platform** - Works on all platforms\n\u2705 **Quick Access** - Fast price checks\n\u2705 **Unlimited Lists** - Create as many as needed\n\u2705 **Custom Categories** - Organize your way\n\n**\uD83D\uDCA1 Watchlist Ideas:**\n\n**\uD83D\uDCCA By Strategy:**\n\u2022 **Long-term Holds** - Blue chip DeFi tokens\n\u2022 **Trading Targets** - High volatility tokens\n\u2022 **Income Tokens** - Yield-bearing assets\n\u2022 **Moonshots** - High-risk, high-reward\n\n**\uD83C\uDFD7\uFE0F By Ecosystem:**\n\u2022 **PulseChain Native** - WPLS, HEX, PLSX\n\u2022 **Ethereum DeFi** - UNI, AAVE, COMP\n\u2022 **Stablecoins** - USDC, USDT, DAI\n\u2022 **Layer 2s** - MATIC, ARB, OP\n\n**\uD83D\uDCC8 By Market Cap:**\n\u2022 **Large Cap** - Established projects\n\u2022 **Mid Cap** - Growing projects  \n\u2022 **Small Cap** - Early stage tokens\n\n**\uD83D\uDE80 Get Started:**\n\"Create watchlist named [NAME] with [TOKEN1] [TOKEN2] [TOKEN3]\"\n\n*Example: \"Create watchlist named DeFi Blue Chips with HEX WPLS USDC\"*";
                    }
                    _c.label = 10;
                case 10:
                    if (callback) {
                        callback({ text: responseText });
                    }
                    return [2 /*return*/, true];
                case 11:
                    error_2 = _c.sent();
                    console.error('Watchlists error:', error_2);
                    if (callback) {
                        callback({
                            text: "\u274C **Watchlist Error**\n\nFailed to process watchlist request: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error', "\n\n**Try Again:**\n\u2022 \"create watchlist named DeFi Tokens with HEX WPLS USDC\"\n\u2022 \"show my watchlists\"\n\u2022 \"watchlist help\"\n\n**Common Issues:**\n\u2022 Check watchlist name is valid\n\u2022 Ensure token symbols are correct\n\u2022 Database connection may be unavailable\n\nIf the problem persists, please check your database connection.")
                        });
                    }
                    return [2 /*return*/, false];
                case 12: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "create watchlist named DeFi Favorites with HEX WPLS USDC" }
            },
            {
                name: "{{user2}}",
                content: { text: "Watchlist 'DeFi Favorites' created with HEX, WPLS, and USDC for easy monitoring!" }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "show my watchlists" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here are all your token watchlists with their contents and management options." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "check prices for DeFi Favorites" }
            },
            {
                name: "{{user2}}",
                content: { text: "Current prices for all tokens in your DeFi Favorites watchlist." }
            }
        ]
    ]
};
exports.default = watchlistsAction;
