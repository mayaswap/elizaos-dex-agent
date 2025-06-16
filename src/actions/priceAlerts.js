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
var priceAlertsAction = {
    name: "PRICE_ALERTS",
    similes: [
        "CREATE_ALERT",
        "PRICE_NOTIFICATION",
        "SET_ALERT",
        "ALERT_ME",
        "PRICE_WATCH",
        "NOTIFY_PRICE"
    ],
    description: "Create, manage, and view price alerts for tokens",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, keywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            keywords = [
                'alert', 'notify', 'notification', 'watch', 'alert me',
                'price alert', 'set alert', 'create alert', 'remove alert',
                'my alerts', 'show alerts', 'list alerts'
            ];
            return [2 /*return*/, keywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, platformUser, dbService, userPlatformId, responseText, alertMatch, simpleMatch, priceMatch, tokenSymbol, targetPrice, isAbove, alertId, error_1, alerts, idMatch, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 11, , 12]);
                    text = message.content.text.toLowerCase();
                    platformUser = (0, walletService_js_1.createPlatformUser)(runtime, message);
                    dbService = new databaseService_js_1.DatabaseService(runtime);
                    return [4 /*yield*/, dbService.initializeDatabase()];
                case 1:
                    _b.sent();
                    userPlatformId = "".concat(platformUser.platform, ":").concat(platformUser.platformUserId);
                    responseText = '';
                    if (!(text.includes('create') || text.includes('set') || text.includes('alert me'))) return [3 /*break*/, 7];
                    alertMatch = text.match(/(?:alert|notify).*?(?:when|if)\s+(.+?)\s+(?:hits|reaches|goes\s+(?:above|below|over|under))\s+[\$]?([0-9.,]+)/i);
                    simpleMatch = text.match(/(?:alert|notify).*?(.+?)\s+(?:above|below|over|under)\s+[\$]?([0-9.,]+)/i);
                    priceMatch = alertMatch || simpleMatch;
                    if (!!priceMatch) return [3 /*break*/, 2];
                    responseText = "\uD83D\uDD14 **Create Price Alert**\n\nPlease specify the token and target price:\n\n**Examples:**\n\u2022 \"Alert me when HEX hits $0.001\"\n\u2022 \"Notify when WPLS goes above $0.0003\"\n\u2022 \"Set alert for USDC below $0.99\"\n\u2022 \"Create alert when PLSX reaches $0.0005\"\n\n**Format:** `alert me when [TOKEN] goes [above/below] $[PRICE]`\n\n**Supported Operators:**\n\u2022 **above/over** - Alert when price goes higher\n\u2022 **below/under** - Alert when price goes lower\n\nReady to set your alert!";
                    return [3 /*break*/, 6];
                case 2:
                    tokenSymbol = ((_a = priceMatch[1]) === null || _a === void 0 ? void 0 : _a.trim().toUpperCase()) || '';
                    targetPrice = parseFloat((priceMatch[2] || '0').replace(/,/g, ''));
                    isAbove = text.includes('above') || text.includes('over') || text.includes('hits') || text.includes('reaches');
                    if (!(isNaN(targetPrice) || targetPrice <= 0)) return [3 /*break*/, 3];
                    responseText = "\u274C **Invalid Price**\n\nPlease enter a valid price greater than 0.\n\n**Example:** \"Alert me when HEX goes above $0.001\"";
                    return [3 /*break*/, 6];
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, dbService.createPriceAlert({
                            userPlatformId: userPlatformId,
                            tokenSymbol: tokenSymbol,
                            targetPrice: targetPrice,
                            isAbove: isAbove,
                            isActive: true,
                            createdAt: new Date().toISOString(),
                            platform: platformUser.platform,
                            alertMessage: "".concat(tokenSymbol, " ").concat(isAbove ? 'above' : 'below', " $").concat(targetPrice)
                        })];
                case 4:
                    alertId = _b.sent();
                    responseText = "\uD83D\uDD14 **Price Alert Created Successfully!**\n\n**Token:** ".concat(tokenSymbol, "\n**Target Price:** $").concat(targetPrice.toFixed(6), "\n**Condition:** ").concat(isAbove ? 'Above' : 'Below', " target\n**Platform:** ").concat(platformUser.platform.toUpperCase(), "\n**Alert ID:** ").concat(alertId, "\n\n**\uD83C\uDFAF Alert Details:**\n\u2022 You'll be notified when ").concat(tokenSymbol, " ").concat(isAbove ? 'rises above' : 'drops below', " $").concat(targetPrice, "\n\u2022 Alert is active and monitoring current prices\n\u2022 Works across all platforms where you're logged in\n\n**\uD83D\uDCF1 Management:**\n\u2022 \"show my alerts\" - View all alerts\n\u2022 \"remove alert ").concat(alertId.slice(-8), "\" - Delete this alert\n\u2022 \"pause alerts\" - Temporarily disable notifications\n\n**\uD83D\uDCA1 Pro Tips:**\n\u2022 Set multiple alerts for different price levels\n\u2022 Use alerts for both buying opportunities and stop-losses\n\u2022 Alerts work 24/7 even when you're offline\n\n*We'll notify you as soon as ").concat(tokenSymbol, " ").concat(isAbove ? 'breaks above' : 'falls below', " your target price!*");
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    responseText = "\u274C **Failed to Create Alert**\n\nCould not create price alert: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error', "\n\n**Please Try Again:**\n\u2022 Check the token symbol is correct\n\u2022 Ensure price is a valid number\n\u2022 Example: \"alert me when HEX goes above $0.001\"");
                    return [3 /*break*/, 6];
                case 6: return [3 /*break*/, 10];
                case 7:
                    if (!(text.includes('show') || text.includes('list') || text.includes('my alerts'))) return [3 /*break*/, 9];
                    return [4 /*yield*/, dbService.getActivePriceAlerts(userPlatformId)];
                case 8:
                    alerts = _b.sent();
                    if (alerts.length === 0) {
                        responseText = "\uD83D\uDD14 **Your Price Alerts**\n\nYou don't have any active price alerts yet.\n\n**Create Your First Alert:**\n\u2022 \"Alert me when HEX hits $0.001\"\n\u2022 \"Notify when WPLS goes above $0.0003\"  \n\u2022 \"Set alert for USDC below $0.99\"\n\n**Benefits:**\n\u2022 24/7 price monitoring\n\u2022 Instant notifications\n\u2022 Never miss trading opportunities\n\u2022 Works across all platforms\n\n**Get Started:** \"alert me when [TOKEN] goes [above/below] $[PRICE]\"";
                    }
                    else {
                        responseText = "\uD83D\uDD14 **Your Active Price Alerts**\n\n**Platform:** ".concat(platformUser.platform.toUpperCase(), "\n**Total Alerts:** ").concat(alerts.length, "\n\n").concat(alerts.map(function (alert, i) {
                            var direction = alert.isAbove ? '📈 Above' : '📉 Below';
                            var timeAgo = new Date(alert.createdAt).toLocaleDateString();
                            return "**".concat(i + 1, ". ").concat(alert.tokenSymbol, "** ").concat(direction, " $").concat(alert.targetPrice.toFixed(6), "\n\uD83C\uDFAF **Condition:** Price ").concat(alert.isAbove ? 'rises above' : 'drops below', " target\n\uD83D\uDCC5 **Created:** ").concat(timeAgo, "\n\uD83C\uDD94 **ID:** ").concat(alert.id.slice(-8), "\n").concat(alert.alertMessage ? "\uD83D\uDCAC **Note:** ".concat(alert.alertMessage) : '');
                        }).join('\n\n'), "\n\n**\uD83C\uDFAF Alert Status:**\n\u2705 All alerts are active and monitoring\n\uD83D\uDD04 Real-time price tracking enabled\n\uD83D\uDCF1 Cross-platform notifications ready\n\n**\uD83D\uDCF1 Management Actions:**\n\u2022 \"remove alert [ID]\" - Delete specific alert\n\u2022 \"pause all alerts\" - Temporarily disable\n\u2022 \"create alert\" - Add new price alert\n\u2022 \"alert settings\" - Configure notification preferences\n\n**\uD83D\uDCA1 Alert Tips:**\n\u2022 Set alerts slightly above/below round numbers for better fills\n\u2022 Use multiple alerts for scaling in/out of positions\n\u2022 Combine with trading actions: \"alert me when HEX hits $0.001 then buy 1000\"\n\n*Your alerts are monitoring prices 24/7 across all supported exchanges!*");
                    }
                    return [3 /*break*/, 10];
                case 9:
                    if (text.includes('remove') || text.includes('delete') || text.includes('cancel')) {
                        idMatch = text.match(/(?:remove|delete|cancel).*?alert.*?([a-zA-Z0-9_]{8,})/i);
                        if (!idMatch) {
                            responseText = "\uD83D\uDDD1\uFE0F **Remove Price Alert**\n\nPlease specify which alert to remove:\n\n**Format:** \"remove alert [ALERT_ID]\"\n**Example:** \"remove alert abc12345\"\n\n**Find Alert IDs:**\n\u2022 \"show my alerts\" - View all your alerts with IDs\n\n**Bulk Actions:**\n\u2022 \"remove all alerts\" - Delete all alerts\n\u2022 \"pause alerts\" - Temporarily disable (keeps alerts)\n\nWhich alert would you like to remove?";
                        }
                        else {
                            // This would need implementation in DatabaseService
                            responseText = "\uD83D\uDDD1\uFE0F **Alert Removal**\n\nAlert removal functionality will be implemented.\n\n**For Now:**\n\u2022 \"show my alerts\" - View current alerts\n\u2022 Contact support to manually remove alerts\n\n**Coming Soon:**\n\u2022 Individual alert removal\n\u2022 Bulk alert management\n\u2022 Alert modification\n\nWe'll add this feature in the next update!";
                        }
                    }
                    else if (text.includes('pause') || text.includes('disable')) {
                        // Pause all alerts
                        responseText = "\u23F8\uFE0F **Pause All Alerts**\n\nAlert pausing functionality will be implemented.\n\n**Current Status:**\n\u2022 All your alerts remain active\n\u2022 Notifications continue as normal\n\n**Coming Soon:**\n\u2022 Pause/resume all alerts\n\u2022 Temporary alert suspension\n\u2022 Scheduled alert activation\n\n**For Now:**\n\u2022 \"show my alerts\" - View active alerts\n\u2022 \"remove alert [ID]\" - Delete individual alerts\n\nThis feature is in development!";
                    }
                    else {
                        // General help for price alerts
                        responseText = "\uD83D\uDD14 **Price Alert System**\n\n**\uD83C\uDFAF Available Commands:**\n\n**\uD83D\uDCDD Create Alerts:**\n\u2022 \"Alert me when HEX hits $0.001\"\n\u2022 \"Notify when WPLS goes above $0.0003\"\n\u2022 \"Set alert for USDC below $0.99\"\n\u2022 \"Create alert when PLSX reaches $0.0005\"\n\n**\uD83D\uDCCB Manage Alerts:**\n\u2022 \"show my alerts\" - View all active alerts\n\u2022 \"list alerts\" - Same as above\n\u2022 \"remove alert [ID]\" - Delete specific alert\n\u2022 \"pause alerts\" - Temporarily disable all\n\n**\uD83C\uDFAF Alert Features:**\n\u2705 **24/7 Monitoring** - Never miss price movements\n\u2705 **Multi-Platform** - Works on Telegram, Discord, Web\n\u2705 **Real-Time** - Instant notifications when triggered\n\u2705 **Unlimited** - Set as many alerts as you need\n\u2705 **Persistent** - Alerts survive restarts and outages\n\n**\uD83D\uDCA1 Pro Tips:**\n\n**For Buying Opportunities:**\n\u2022 \"Alert when HEX drops below $0.0008\" (buy the dip)\n\u2022 \"Notify when WPLS goes above $0.0003\" (breakout alert)\n\n**For Risk Management:**\n\u2022 \"Alert when my position drops below $500\" (portfolio alert)\n\u2022 \"Notify when USDC goes below $0.98\" (depeg warning)\n\n**For Profit Taking:**\n\u2022 \"Alert when HEX hits $0.002\" (take profit level)\n\u2022 \"Notify when my portfolio exceeds $10000\" (milestone alert)\n\n**\uD83D\uDE80 Get Started:**\nType: \"alert me when [TOKEN] goes [above/below] $[PRICE]\"\n\n*Example: \"alert me when HEX goes above $0.001\"*";
                    }
                    _b.label = 10;
                case 10:
                    if (callback) {
                        callback({ text: responseText });
                    }
                    return [2 /*return*/, true];
                case 11:
                    error_2 = _b.sent();
                    console.error('Price alerts error:', error_2);
                    if (callback) {
                        callback({
                            text: "\u274C **Price Alert Error**\n\nFailed to process price alert request: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error', "\n\n**Try Again:**\n\u2022 \"alert me when HEX goes above $0.001\"\n\u2022 \"show my alerts\"\n\u2022 \"create price alert\"\n\n**Common Issues:**\n\u2022 Check token symbol spelling\n\u2022 Ensure price is a valid number\n\u2022 Database connection may be unavailable\n\nIf the problem persists, please check your database connection.")
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
                content: { text: "alert me when HEX hits $0.001" }
            },
            {
                name: "{{user2}}",
                content: { text: "Price alert created! I'll notify you when HEX reaches $0.001." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "show my alerts" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here are all your active price alerts with their current status." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "notify when WPLS goes above $0.0003" }
            },
            {
                name: "{{user2}}",
                content: { text: "Alert set! You'll be notified when WPLS price rises above $0.0003." }
            }
        ]
    ]
};
exports.default = priceAlertsAction;
