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
var priceMonitor_js_1 = require("../services/priceMonitor.js");
var startMonitoringAction = {
    name: "START_MONITORING",
    similes: [
        "START_PRICE_MONITORING",
        "BEGIN_TRACKING",
        "ACTIVATE_ALERTS",
        "MONITOR_PRICE",
        "WATCH_TOKEN"
    ],
    description: "Start active price monitoring for tokens when user explicitly chooses to do so",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, monitoringKeywords;
        return __generator(this, function (_a) {
            text = message.content.text.toLowerCase();
            monitoringKeywords = [
                'yes, start monitoring', 'start monitoring', 'begin tracking',
                'activate monitoring', 'watch price', 'monitor token',
                'yes, monitor', 'start price alerts', 'track price'
            ];
            return [2 /*return*/, monitoringKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, tokenMatch, priceMatch, token_1, targetPrice_1, condition_1, currentPrice, alertId, responseText;
        var _a;
        return __generator(this, function (_b) {
            try {
                text = message.content.text.toLowerCase();
                tokenMatch = text.match(/(?:monitoring|monitor|watch|track)\s+([a-z]+)/i);
                priceMatch = text.match(/(?:at|@|for|when|hits?)\s*\$?(\d+\.?\d*)/);
                token_1 = ((_a = tokenMatch === null || tokenMatch === void 0 ? void 0 : tokenMatch[1]) === null || _a === void 0 ? void 0 : _a.toUpperCase()) ||
                    (text.includes('hex') ? 'HEX' :
                        text.includes('pls') ? 'PLS' :
                            text.includes('plsx') ? 'PLSX' : 'UNKNOWN');
                targetPrice_1 = (priceMatch === null || priceMatch === void 0 ? void 0 : priceMatch[1]) ? parseFloat(priceMatch[1]) : null;
                if (token_1 === 'UNKNOWN' || !targetPrice_1) {
                    if (callback) {
                        callback({
                            text: "\u274C **Unable to Parse Monitoring Request**\n\nI couldn't extract the token and price from your message.\n\n**Please specify clearly:**\n\u2022 Token: HEX, PLS, PLSX, or USDC\n\u2022 Target Price: e.g., $0.005\n\n**Examples:**\n\u2022 \"Yes, start monitoring HEX at $0.005\"\n\u2022 \"Monitor PLS for $0.0001\"\n\u2022 \"Watch PLSX when it hits $0.00015\"\n\n**Try again with clear token and price...**"
                        });
                    }
                    return [2 /*return*/, true];
                }
                condition_1 = 'below';
                if (text.includes('above') || text.includes('over') || text.includes('hits') || text.includes('reaches')) {
                    condition_1 = 'above';
                }
                currentPrice = priceMonitor_js_1.priceMonitor.getCachedPrice(token_1);
                alertId = priceMonitor_js_1.priceMonitor.addAlert({
                    token: token_1,
                    targetPrice: targetPrice_1,
                    condition: condition_1,
                    active: true,
                    callback: function (currentPrice) {
                        console.log("\uD83D\uDEA8 PRICE ALERT TRIGGERED: ".concat(token_1, " ").concat(condition_1, " $").concat(targetPrice_1, "!"));
                        console.log("\uD83D\uDCB0 Current Price: $".concat(currentPrice.toFixed(6)));
                        console.log("\u23F0 Time to take action!");
                        console.log("\uD83D\uDD17 Trade on 9mm: https://9mm.pro/swap");
                        // Could add more notification methods here:
                        // - Email
                        // - Discord webhook
                        // - Push notification
                        // - SMS
                    }
                });
                responseText = "\u2705 **Price Monitoring Activated!**\n\n**\uD83D\uDCCB Alert Details:**\n\u2022 Token: ".concat(token_1, "\n\u2022 Target Price: $").concat(targetPrice_1, "\n\u2022 Condition: Alert when ").concat(condition_1, " $").concat(targetPrice_1, "\n\u2022 Current Price: ").concat(currentPrice ? "$".concat(currentPrice.toFixed(6)) : 'Fetching...', "\n\u2022 Alert ID: ").concat(alertId, "\n\n**\uD83D\uDD14 Monitoring Status:**\n\u2022 \u2705 Background monitoring active\n\u2022 \u23F1\uFE0F Checking prices every 1 minute  \n\u2022 \uD83D\uDCCA Using 9mm V3 subgraph real-time data\n\u2022 \uD83D\uDEA8 Console alerts when triggered\n\n**\uD83D\uDCF1 What Happens When Triggered:**\n1. Console notification with price details\n2. Direct link to 9mm trading interface  \n3. Recommended action guidance\n4. Alert automatically deactivates\n\n**\u2699\uFE0F Management Commands:**\n\u2022 \"Show my active monitors\" - View all alerts\n\u2022 \"Cancel monitoring ").concat(token_1, "\" - Stop this alert\n\u2022 \"Pause all monitoring\" - Temporary disable\n\u2022 \"Add another alert\" - Monitor more tokens\n\n**\uD83C\uDFAF Pro Tips:**\n\u2022 Set realistic price targets\n\u2022 Don't set too many alerts (performance)\n\u2022 Check console regularly for notifications\n\u2022 Have your trading plan ready\n\n*Real-time monitoring now active - you're in control!*");
                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return [2 /*return*/, true];
            }
            catch (error) {
                console.error('Start monitoring action error:', error);
                if (callback) {
                    callback({
                        text: "\u274C Failed to start price monitoring: ".concat(error instanceof Error ? error.message : 'Unknown error')
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
                content: { text: "Yes, start monitoring HEX at $0.005" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll activate real-time price monitoring for HEX at $0.005 and alert you when the target is reached.",
                    action: "START_MONITORING"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Monitor PLS when it hits $0.0001" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Setting up price monitoring for PLS at $0.0001 with real-time alerts when the target price is reached.",
                    action: "START_MONITORING"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Start tracking PLSX price for $0.00015" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Activating background price monitoring for PLSX at $0.00015 with immediate notifications when triggered.",
                    action: "START_MONITORING"
                }
            }
        ]
    ],
};
exports.default = startMonitoringAction;
