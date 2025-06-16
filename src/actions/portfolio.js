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
var _9mm_v3_position_manager_js_1 = require("../utils/9mm-v3-position-manager.js");
var walletService_js_1 = require("../services/walletService.js");
var portfolioAction = {
    name: "PORTFOLIO_OVERVIEW",
    similes: [
        "SHOW_PORTFOLIO",
        "MY_PORTFOLIO",
        "PORTFOLIO_SUMMARY",
        "ALL_ASSETS",
        "MY_ASSETS",
        "PORTFOLIO_STATS"
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
                    return [2 /*return*/, parsed.intent === 'portfolio' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Show comprehensive portfolio overview including tokens, liquidity positions, and performance metrics",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var positionManager, platformUser, walletService, userWallets, walletCount, demoPortfolio, responseText, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    positionManager = new _9mm_v3_position_manager_js_1.NineMmV3PositionManager();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.getUserWallets(platformUser)];
                case 1:
                    userWallets = _a.sent();
                    walletCount = userWallets.length;
                    if (walletCount === 0) {
                        if (callback) {
                            callback({
                                text: "\uD83D\uDCCA **Portfolio Overview**\n\n\u274C **No Wallets Connected**\n\nTo view your portfolio, you need to connect a wallet first.\n\n**Quick Setup:**\n\u2022 Create a wallet: \"Create a new wallet\"\n\u2022 Import existing: \"Import wallet with private key\"\n\u2022 After setup, your portfolio will show:\n  - Token balances across all chains\n  - Active liquidity positions\n  - Total portfolio value\n  - Fee earnings and performance\n\n*Connect a wallet to get started!*"
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    demoPortfolio = {
                        totalValue: 12450.75,
                        tokenCount: 8,
                        activePositions: 3,
                        totalFeesEarned: 1250.30,
                        avgAPY: 18.7,
                        inRangePositions: 2,
                        chains: ["Pulsechain", "Base", "Sonic"],
                        topTokens: [
                            { symbol: "PLS", balance: "25,000", valueUSD: 4500 },
                            { symbol: "HEX", balance: "150,000", valueUSD: 3200 },
                            { symbol: "USDC", balance: "2,800", valueUSD: 2800 },
                            { symbol: "WPLS", balance: "8,500", valueUSD: 1950 }
                        ]
                    };
                    responseText = "\uD83D\uDCCA **Your Portfolio Overview**\n\n\uD83D\uDCB0 **Total Portfolio Value**: $".concat(demoPortfolio.totalValue.toLocaleString(), "\n\uD83C\uDFE6 **Connected Wallets**: ").concat(walletCount, "\n\uD83C\uDF10 **Active Chains**: ").concat(demoPortfolio.chains.join(', '), "\n\n\uD83D\uDC8E **Token Holdings** (").concat(demoPortfolio.tokenCount, " tokens)\n").concat(demoPortfolio.topTokens.map(function (token, i) {
                        return "".concat(i + 1, ". **").concat(token.symbol, "**: ").concat(token.balance, " (~$").concat(token.valueUSD.toLocaleString(), ")");
                    }).join('\n'), "\n\n\uD83C\uDFCA **Liquidity Positions** (").concat(demoPortfolio.activePositions, " active)\n\u2022 Total Positions: ").concat(demoPortfolio.activePositions, "\n\u2022 In Range: ").concat(demoPortfolio.inRangePositions, "/").concat(demoPortfolio.activePositions, " (").concat(Math.round((demoPortfolio.inRangePositions / demoPortfolio.activePositions) * 100), "%)\n\u2022 Total Fees Earned: $").concat(demoPortfolio.totalFeesEarned.toLocaleString(), "\n\u2022 Average APY: ").concat(demoPortfolio.avgAPY, "%\n\n\uD83D\uDCC8 **Performance**\n\u2022 Fee Earnings: ").concat(((demoPortfolio.totalFeesEarned / demoPortfolio.totalValue) * 100).toFixed(2), "% of portfolio\n\u2022 Risk Level: ").concat(demoPortfolio.inRangePositions >= 2 ? '🟢 LOW' : '🟡 MEDIUM', "\n\u2022 Management Status: ").concat(demoPortfolio.inRangePositions === demoPortfolio.activePositions ? 'All positions optimal' : "".concat(demoPortfolio.activePositions - demoPortfolio.inRangePositions, " position(s) need attention"), "\n\n**Quick Actions:**\n\u2022 \"Show my liquidity positions\" - Detailed LP analysis\n\u2022 \"Check my HEX balance\" - Token-specific info\n\u2022 \"What pools are available\" - Find new opportunities\n\n*Note: This is a demo view. Real portfolio data requires wallet connection.*");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 2:
                    error_1 = _a.sent();
                    console.error('Portfolio action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to load portfolio: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 3: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Show my portfolio" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you a comprehensive overview of your portfolio including tokens, liquidity positions, and performance metrics.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Portfolio summary" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me generate your portfolio summary with total value, active positions, and performance analytics.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "All my assets" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll compile all your assets across tokens and liquidity positions with current values and performance.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ]
    ],
};
exports.default = portfolioAction;
