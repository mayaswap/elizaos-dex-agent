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
var slippageManagementAction = {
    name: "SLIPPAGE_MANAGEMENT",
    similes: [
        "SET_SLIPPAGE",
        "SLIPPAGE_TOLERANCE",
        "TRADE_SETTINGS",
        "EXECUTION_SETTINGS",
        "SLIPPAGE_CONFIG",
        "MEV_PROTECTION"
    ],
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, slippageKeywords, actionKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            slippageKeywords = ['slippage', 'tolerance', 'protection', 'mev', 'execution'];
            actionKeywords = ['set', 'change', 'update', 'configure', 'use', 'enable', 'disable'];
            return [2 /*return*/, slippageKeywords.some(function (keyword) { return text.includes(keyword); }) &&
                    (actionKeywords.some(function (keyword) { return text.includes(keyword); }) || text.includes('%'))];
        });
    }); },
    description: "Configure slippage tolerance and trade execution settings for optimal trading",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, percentageMatch, requestedSlippage, platformUser, walletService, activeWallet, persistentSettings, currentSettings, riskLevel, advice, responseText, enable, disable, newStatus, responseText, enable, responseText, responseText, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                    percentageMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
                    requestedSlippage = (percentageMatch === null || percentageMatch === void 0 ? void 0 : percentageMatch[1]) ? parseFloat(percentageMatch[1]) : null;
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    walletService = new walletService_js_1.WalletService(runtime);
                    return [4 /*yield*/, walletService.getActiveWallet(platformUser)];
                case 1:
                    activeWallet = _c.sent();
                    if (!activeWallet) {
                        if (callback) {
                            callback({
                                text: "\u274C **No Active Wallet**\n\nPlease create a wallet first before managing slippage settings.\n\n**Quick Setup:**\n\u2022 \"Create a wallet\" to get started\n\u2022 \"Import wallet\" if you have an existing one\n\nEach wallet has its own independent slippage settings stored securely."
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    persistentSettings = activeWallet.settings || {
                        slippagePercentage: 0.5,
                        mevProtection: true,
                        autoSlippage: false,
                        transactionDeadline: 20
                    };
                    currentSettings = {
                        slippage: persistentSettings.slippagePercentage,
                        mevProtection: persistentSettings.mevProtection,
                        autoSlippage: persistentSettings.autoSlippage,
                        maxSlippage: 5.0, // Hard-coded max for safety
                        frontrunProtection: persistentSettings.mevProtection, // Same as MEV protection
                        deadline: persistentSettings.transactionDeadline
                    };
                    if (!(requestedSlippage !== null)) return [3 /*break*/, 3];
                    // Validate slippage range
                    if (requestedSlippage < 0.1 || requestedSlippage > 50) {
                        if (callback) {
                            callback({
                                text: "\u26A0\uFE0F **Invalid Slippage Setting**\n\n\u274C **".concat(requestedSlippage, "% is outside safe range**\n\n**Recommended Slippage Ranges:**\n\u2022 \uD83D\uDFE2 **Low Risk**: 0.1% - 0.5% (for stable pairs, may fail in volatile markets)\n\u2022 \uD83D\uDFE1 **Moderate**: 0.5% - 2% (balanced approach, works for most trades)\n\u2022 \uD83D\uDD34 **High Risk**: 2% - 5% (volatile tokens, higher MEV risk)\n\u2022 \uD83D\uDC80 **Dangerous**: 5%+ (extreme cases only, high MEV risk)\n\n**Safe Range**: 0.1% - 50%\n**Current Setting**: ").concat(currentSettings.slippage, "%\n\nTry: \"Set slippage to 1%\" or \"Use 0.3% slippage\"")
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    riskLevel = '';
                    advice = '';
                    if (requestedSlippage <= 0.5) {
                        riskLevel = '🟢 LOW RISK';
                        advice = 'Great for stable pairs and large liquidity pools. May fail during high volatility.';
                    }
                    else if (requestedSlippage <= 2) {
                        riskLevel = '🟡 MODERATE RISK';
                        advice = 'Balanced setting that works for most trades. Good protection with reasonable execution.';
                    }
                    else if (requestedSlippage <= 5) {
                        riskLevel = '🔴 HIGH RISK';
                        advice = 'Use for volatile tokens or small liquidity pools. Higher MEV exposure.';
                    }
                    else {
                        riskLevel = '💀 EXTREME RISK';
                        advice = 'Only for emergency situations. Very high MEV risk and potential for sandwich attacks.';
                    }
                    // Save the updated slippage setting
                    return [4 /*yield*/, walletService.updateWalletSettings(platformUser, activeWallet.id, { slippagePercentage: requestedSlippage })];
                case 2:
                    // Save the updated slippage setting
                    _c.sent();
                    responseText = "\u2699\uFE0F **Slippage Updated - ".concat(requestedSlippage, "%**\n\n\u2705 **Slippage tolerance set to ").concat(requestedSlippage, "% (Saved)**\n\n\uD83D\uDCCA **Risk Assessment**: ").concat(riskLevel, "\n\uD83D\uDCA1 **Advice**: ").concat(advice, "\n\n\uD83D\uDD27 **Current Trading Settings**:\n\u2022 Slippage Tolerance: ").concat(requestedSlippage, "%\n\u2022 MEV Protection: ").concat(currentSettings.mevProtection ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Auto Slippage: ").concat(currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Max Slippage Cap: ").concat(currentSettings.maxSlippage, "%\n\u2022 Transaction Deadline: ").concat(currentSettings.deadline, " minutes\n\n\uD83D\uDCC8 **Trade Impact**:\nFor a $1,000 trade, you might receive ").concat((1000 * (1 - requestedSlippage / 100)).toFixed(2), " - $1,000 worth of tokens.\n\n**Other Settings:**\n\u2022 \"Enable MEV protection\" - Protect against front-running\n\u2022 \"Set auto slippage\" - Dynamic slippage based on market conditions\n\u2022 \"Use high slippage protection\" - Extra sandwich attack protection");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 3:
                    if (!(text.includes('mev') || text.includes('frontrun') || text.includes('sandwich'))) return [3 /*break*/, 5];
                    enable = text.includes('enable') || text.includes('turn on') || text.includes('activate');
                    disable = text.includes('disable') || text.includes('turn off') || text.includes('deactivate');
                    if (!(enable || disable)) return [3 /*break*/, 5];
                    newStatus = enable;
                    // Save MEV protection setting
                    return [4 /*yield*/, walletService.updateWalletSettings(platformUser, activeWallet.id, {
                            mevProtection: newStatus
                        })];
                case 4:
                    // Save MEV protection setting
                    _c.sent();
                    responseText = "\uD83D\uDEE1\uFE0F **MEV Protection ".concat(newStatus ? 'Enabled' : 'Disabled', "**\n\n").concat(newStatus ? '✅' : '❌', " **MEV Protection is now ").concat(newStatus ? 'ACTIVE' : 'INACTIVE', "**\n\n**What this means:**\n").concat(newStatus ?
                        "\u2022 \uD83D\uDEE1\uFE0F Protection against front-running attacks\n\u2022 \uD83D\uDD12 Sandwich attack detection and prevention\n\u2022 \u23F1\uFE0F Private mempool routing when possible\n\u2022 \uD83D\uDCCA Dynamic slippage adjustment for suspicious activity" :
                        "\u2022 \u26A0\uFE0F No protection against MEV attacks\n\u2022 \uD83C\uDFAF Vulnerable to front-running and sandwich attacks\n\u2022 \uD83D\uDCB0 Potentially worse execution prices\n\u2022 \uD83D\uDEA8 Higher risk of failed transactions", "\n\n\uD83D\uDD27 **Current Settings**:\n\u2022 MEV Protection: ").concat(newStatus ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Slippage Tolerance: ").concat(currentSettings.slippage, "%\n\u2022 Front-run Protection: ").concat(newStatus ? '✅ Active' : '❌ Inactive', "\n\n\uD83D\uDCA1 **Recommendation**: ").concat(newStatus ? 'Keep MEV protection enabled for safer trading' : 'Enable MEV protection to avoid sandwich attacks');
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 5:
                    if (!(text.includes('auto') && text.includes('slippage'))) return [3 /*break*/, 8];
                    enable = text.includes('enable') || text.includes('turn on') || text.includes('set');
                    if (!enable) return [3 /*break*/, 7];
                    return [4 /*yield*/, walletService.updateWalletSettings(platformUser, activeWallet.id, { autoSlippage: true })];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    responseText = "\uD83E\uDD16 **Auto Slippage ".concat(enable ? 'Enabled' : 'Status', "**\n\n").concat(enable ? '✅ **Auto Slippage is now ACTIVE**' : "\u2139\uFE0F **Auto Slippage is currently ".concat(currentSettings.autoSlippage ? 'ENABLED' : 'DISABLED', "**"), "\n\n**How Auto Slippage Works:**\n\u2022 \uD83D\uDCCA Analyzes real-time market conditions\n\u2022 \uD83C\uDFAF Adjusts slippage based on token volatility\n\u2022 \uD83D\uDD04 Uses higher slippage for volatile/low-liquidity tokens\n\u2022 \uD83D\uDEE1\uFE0F Maintains minimum slippage for MEV protection\n\n**Dynamic Ranges:**\n\u2022 Stable pairs (USDC/USDT): 0.1% - 0.3%\n\u2022 Major tokens (ETH/BTC): 0.3% - 1%\n\u2022 Alt tokens: 1% - 3%\n\u2022 Micro-cap tokens: 2% - 5%\n\n\uD83D\uDD27 **Settings:**\n\u2022 Auto Slippage: ").concat(enable ? '✅ Enabled' : currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Max Auto Slippage: ").concat(currentSettings.maxSlippage, "%\n\u2022 Base Slippage: ").concat(currentSettings.slippage, "%\n\n**Manual Override:**\nYou can still set specific slippage with \"Set slippage to X%\" for individual trades.");
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 8:
                    // Show current settings
                    if (text.includes('show') || text.includes('current') || text.includes('settings')) {
                        responseText = "\u2699\uFE0F **Current Trading Settings**\n\n\uD83C\uDFAF **Slippage Configuration:**\n\u2022 Tolerance: ".concat(currentSettings.slippage, "%\n\u2022 Auto Slippage: ").concat(currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Max Slippage: ").concat(currentSettings.maxSlippage, "%\n\n\uD83D\uDEE1\uFE0F **Protection Settings:**\n\u2022 MEV Protection: ").concat(currentSettings.mevProtection ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Front-run Protection: ").concat(currentSettings.frontrunProtection ? '✅ Enabled' : '❌ Disabled', "\n\u2022 Transaction Deadline: ").concat(currentSettings.deadline, " minutes\n\n\uD83D\uDCCA **Risk Level**: ").concat(currentSettings.slippage <= 0.5 ? '🟢 LOW' :
                            currentSettings.slippage <= 2 ? '🟡 MODERATE' :
                                currentSettings.slippage <= 5 ? '🔴 HIGH' : '💀 EXTREME', "\n\n**Quick Commands:**\n\u2022 \"Set slippage to 1%\" - Change slippage tolerance\n\u2022 \"Enable MEV protection\" - Turn on sandwich attack protection\n\u2022 \"Enable auto slippage\" - Dynamic slippage based on market conditions\n\u2022 \"Use high slippage protection\" - Maximum protection settings\n\n\uD83D\uDCA1 **Tip**: Lower slippage = safer trades but higher chance of failure during volatility");
                        if (callback) {
                            callback({
                                text: responseText
                            });
                        }
                        return [2 /*return*/, true];
                    }
                    // Default help message
                    if (callback) {
                        callback({
                            text: "\u2699\uFE0F **Slippage & Trade Settings**\n\nI can help you optimize your trading execution! Try:\n\n**Set Slippage:**\n\u2022 \"Set slippage to 0.5%\" - Conservative setting\n\u2022 \"Use 1% slippage\" - Moderate setting\n\u2022 \"Set slippage to 2%\" - For volatile tokens\n\n**Protection Settings:**\n\u2022 \"Enable MEV protection\" - Protect against sandwich attacks\n\u2022 \"Disable MEV protection\" - Turn off protection\n\u2022 \"Enable auto slippage\" - Dynamic slippage adjustment\n\n**View Settings:**\n\u2022 \"Show current settings\" - View all configurations\n\u2022 \"What's my slippage?\" - Current slippage setting\n\n**Presets:**\n\u2022 \"Use conservative settings\" - 0.3% slippage + max protection\n\u2022 \"Use aggressive settings\" - 2% slippage + fast execution\n\nCurrent slippage: ".concat(currentSettings.slippage, "% | MEV Protection: ").concat(currentSettings.mevProtection ? 'ON' : 'OFF')
                        });
                    }
                    return [2 /*return*/, true];
                case 9:
                    error_1 = _c.sent();
                    console.error('Slippage management action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to update slippage settings: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 10: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Set slippage to 0.5%" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll set your slippage tolerance to 0.5% and show you the risk assessment for this setting.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Enable MEV protection" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll enable MEV protection to safeguard your trades against front-running and sandwich attacks.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my trading settings" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll display your current slippage tolerance, MEV protection status, and other trading configurations.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ]
    ],
};
exports.default = slippageManagementAction;
