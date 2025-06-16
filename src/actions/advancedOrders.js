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
var advancedOrdersAction = {
    name: "ADVANCED_ORDERS",
    similes: [
        "LIMIT_ORDER",
        "STOP_LOSS",
        "TAKE_PROFIT",
        "CONDITIONAL_ORDER",
        "ORDER_MANAGEMENT"
    ],
    description: "Advanced order types: limit orders, stop loss, take profit, and conditional trading",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, orderKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            orderKeywords = [
                'limit order', 'stop loss', 'take profit', 'conditional', 'order',
                'buy when', 'sell when', 'price alert', 'trigger', 'condition',
                'limit buy', 'limit sell', 'stop', 'target price', 'set order'
            ];
            return [2 /*return*/, orderKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, orderType, advancedOrdersAvailable, mockOrders, responseText, limitAmount, limitPrice, limitToken, limitAction, activeAlerts;
        var _a, _b, _c, _d;
        return __generator(this, function (_e) {
            try {
                text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                orderType = 'explanation';
                if (text.includes('limit') && (text.includes('buy') || text.includes('sell')))
                    orderType = 'limit';
                else if (text.includes('stop loss') || text.includes('stop'))
                    orderType = 'stop_loss';
                else if (text.includes('take profit') || text.includes('target'))
                    orderType = 'take_profit';
                else if (text.includes('monitor') || text.includes('watch'))
                    orderType = 'monitor';
                advancedOrdersAvailable = false;
                if (!advancedOrdersAvailable) {
                    if (callback) {
                        callback({
                            text: "\uD83D\uDCCA **Advanced Orders**\n\n\u26A0\uFE0F **Coming Soon!**\n\nAdvanced order functionality is under development.\n\n**What's coming:**\n\u2022 Stop Loss orders\n\u2022 Take Profit orders\n\u2022 DCA (Dollar Cost Averaging)\n\u2022 Price Alerts with automatic execution\n\u2022 Multi-condition orders\n\n**Currently Available:**\n\u2022 Manual swap execution\n\u2022 Price alerts (notification only)\n\u2022 Portfolio tracking\n\u2022 Trading history\n\nAdvanced orders will enable automated trading strategies. Stay tuned!"
                        });
                    }
                    return [2 /*return*/, true];
                }
                mockOrders = {
                    activeOrders: [
                        {
                            id: 'order_001',
                            type: 'limit_buy',
                            pair: 'HEX/USDC',
                            targetPrice: 0.0050,
                            currentPrice: 0.0074,
                            amount: '50000 HEX',
                            status: 'monitoring',
                            created: '2024-12-20',
                            condition: 'Buy 50K HEX when price drops to $0.0050'
                        },
                        {
                            id: 'order_002',
                            type: 'stop_loss',
                            pair: 'PLS/USDT',
                            triggerPrice: 0.000080,
                            currentPrice: 0.000095,
                            amount: '5000000 PLS',
                            status: 'active',
                            created: '2024-12-19',
                            condition: 'Sell 5M PLS if price drops below $0.000080'
                        },
                        {
                            id: 'order_003',
                            type: 'take_profit',
                            pair: 'PLSX/USDC',
                            targetPrice: 0.00015,
                            currentPrice: 0.000089,
                            amount: '2500000 PLSX',
                            status: 'monitoring',
                            created: '2024-12-18',
                            condition: 'Sell 2.5M PLSX when price hits $0.00015'
                        }
                    ]
                };
                responseText = '';
                switch (orderType) {
                    case 'explanation':
                        responseText = "\uD83E\uDD16 **How Advanced Orders Work on DEXes**\n\n**The Challenge:**\nMost DEXes (like 9mm/Uniswap) don't have native limit orders. They only support instant swaps at current market prices.\n\n**\uD83D\uDD27 Solutions Available:**\n\n**1. Order Management Protocols:**\n\u2022 **Gelato Network** - Automated execution service\n\u2022 **1inch Limit Orders** - Off-chain orders with on-chain execution  \n\u2022 **CoW Protocol** - Conditional order matching\n\u2022 **Keeper Networks** - Bot-based order execution\n\n**2. How They Work:**\n1. You sign an order intent (off-chain)\n2. Bots monitor prices continuously\n3. When conditions are met \u2192 transaction is submitted\n4. Your order executes automatically\n\n**3. On PulseChain/9mm Options:**\n\u2022 **Price Monitoring Bots** (what we can implement)\n\u2022 **Manual Notifications** \u2192 You execute manually\n\u2022 **Third-party Services** (if available)\n\n**\uD83D\uDEA8 Current Limitations:**\n\u2022 No native limit orders on 9mm\n\u2022 Requires external infrastructure\n\u2022 Gas costs for each execution\n\u2022 Possible MEV/front-running\n\n**\uD83D\uDCA1 What We Can Offer:**\n\u2022 Price monitoring & alerts\n\u2022 Conditional notifications  \n\u2022 Manual execution guidance\n\u2022 Portfolio tracking integration\n\n**Try commands:**\n\u2022 \"Set limit order: buy HEX at $0.005\"\n\u2022 \"Stop loss: sell PLS below $0.00008\"\n\u2022 \"Monitor PLSX price for $0.00015\"";
                        break;
                    case 'limit':
                        limitAmount = ((_c = text.match(/(\d+(?:\.\d+)?)/)) === null || _c === void 0 ? void 0 : _c[1]) || '1000';
                        limitPrice = ((_d = text.match(/(?:at|@|when|hits?)\s*\$?(\d+\.?\d*)/)) === null || _d === void 0 ? void 0 : _d[1]) || '0.005';
                        limitToken = text.includes('hex') ? 'HEX' : text.includes('pls') ? 'PLS' : 'PLSX';
                        limitAction = text.includes('buy') ? 'BUY' : 'SELL';
                        responseText = "\uD83D\uDCDD **Setting Up Limit Order**\n\n**Order Details:**\n\u2022 Action: ".concat(limitAction, " ").concat(limitAmount, " ").concat(limitToken, "\n\u2022 Target Price: $").concat(limitPrice, "\n\u2022 Current Price: $0.0074 (HEX example)\n\u2022 Order Type: Limit ").concat(limitAction.toLowerCase(), "\n\n**\u26A0\uFE0F How This Works:**\nSince 9mm doesn't support native limit orders, this creates a **price monitoring alert**.\n\n**What Happens:**\n1. \u2705 We monitor ").concat(limitToken, " price continuously\n2. \uD83D\uDD14 Alert you when price hits $").concat(limitPrice, "\n3. \uD83D\uDCF1 You get notification to execute manually\n4. \uD83D\uDE80 You confirm and execute the trade\n\n**\uD83D\uDD27 Technical Implementation:**\n\u2022 Price monitoring via 9mm subgraph\n\u2022 Real-time alerts (WebSocket/polling)\n\u2022 Manual execution required\n\u2022 No gas costs until you execute\n\n**\uD83D\uDCCB Order Summary:**\n\u2022 Status: \u23F3 Monitoring\n\u2022 Condition: ").concat(limitAction, " ").concat(limitToken, " when price ").concat(limitAction === 'BUY' ? '≤' : '≥', " $").concat(limitPrice, "\n\u2022 Notification: Discord/Email/Browser\n\u2022 Valid: Until cancelled\n\n**\u26A0\uFE0F Choose Your Monitoring Option:**\n\n**\uD83D\uDD14 Option 1: Active Price Monitoring**\n\u2022 \"Yes, start monitoring ").concat(limitToken, " at $").concat(limitPrice, "\"\n\u2022 Real-time alerts when price is hit\n\u2022 Background service monitors every 1 minute\n\u2022 Console notifications when triggered\n\n**\uD83D\uDCF1 Option 2: Manual Price Checking**  \n\u2022 \"Just show me ").concat(limitToken, " price updates\"\n\u2022 No background monitoring\n\u2022 Check prices on demand\n\u2022 You track manually\n\n**\u2699\uFE0F Option 3: Different Settings**\n\u2022 \"Set different price for ").concat(limitToken, "\"\n\u2022 \"Monitor different token\"\n\u2022 \"Cancel this setup\"\n\n**\uD83C\uDFAF What would you like to do?**\nType your preference to proceed...\n\n*Your choice - your control over monitoring*");
                        break;
                    case 'stop_loss':
                        responseText = "\uD83D\uDEE1\uFE0F **Stop Loss Order Setup**\n\n**Protection Strategy:**\nStop losses protect against major price drops by automatically selling when a trigger price is hit.\n\n**\u26A0\uFE0F DEX Reality Check:**\n\u2022 9mm has NO native stop losses\n\u2022 Requires external monitoring\n\u2022 Manual execution needed\n\u2022 Slippage risk during execution\n\n**\uD83D\uDD27 Our Stop Loss Solution:**\n\n**1. Price Monitoring:**\n\u2022 Continuous price tracking\n\u2022 Real-time alerts when triggered\n\u2022 Multiple notification channels\n\n**2. Smart Alerts:**\n\u2022 \"\uD83D\uDEA8 STOP LOSS TRIGGERED: PLS hit $0.000080\"\n\u2022 \"\u23F0 Execute sell order NOW to minimize losses\"\n\u2022 Direct link to 9mm trading interface\n\n**3. Execution Guidance:**\n\u2022 Pre-calculated slippage settings\n\u2022 Optimal gas price recommendations\n\u2022 Emergency execution instructions\n\n**\uD83D\uDCCB Example Stop Loss:**\n\u2022 Asset: 5M PLS tokens\n\u2022 Trigger: $0.000080 (current: $0.000095)\n\u2022 Action: Sell immediately when triggered\n\u2022 Max Loss: ~16% from current price\n\n**\uD83C\uDFAF Quick Setup:**\n\u2022 \"Set stop loss: sell PLS below $0.00008\"\n\u2022 \"Stop loss for HEX at $0.005\"  \n\u2022 \"Protect PLSX position at $0.00008\"\n\n**\u26A1 Pro Tips:**\n\u2022 Set stops 10-20% below entry\n\u2022 Don't set too tight (avoid false triggers)\n\u2022 Have backup plan if alerts fail\n\u2022 Consider trailing stops for profits\n\n*Manual execution required - we provide the alerts & guidance*";
                        break;
                    case 'take_profit':
                        responseText = "\uD83C\uDFAF **Take Profit Order Setup**\n\n**Profit Securing Strategy:**\nLock in gains by automatically selling when target prices are reached.\n\n**\uD83D\uDD27 How It Works (DEX Style):**\n\n**1. Price Target Monitoring:**\n\u2022 Set your profit target price\n\u2022 We monitor 24/7 via price feeds\n\u2022 Alert you when target is hit\n\n**2. Smart Execution Alerts:**\n\u2022 \"\uD83C\uDF89 TAKE PROFIT: PLSX hit $0.00015!\"\n\u2022 \"\uD83D\uDCB0 Time to secure 68% gains\"\n\u2022 \"\uD83D\uDE80 Click here to execute on 9mm\"\n\n**3. Profit Optimization:**\n\u2022 Slippage calculations included\n\u2022 Optimal timing recommendations\n\u2022 MEV protection strategies\n\n**\uD83D\uDCC8 Example Take Profit:**\n\u2022 Asset: 2.5M PLSX\n\u2022 Entry: $0.000089 \n\u2022 Target: $0.00015 (+68% profit)\n\u2022 Value: ~$375 potential profit\n\n**\uD83D\uDCA1 Advanced Features:**\n\n**Trailing Take Profits:**\n\u2022 \"Sell PLSX if it drops 10% from peak\"\n\u2022 Captures more upside potential\n\u2022 Adjusts target as price rises\n\n**Partial Profits:**\n\u2022 \"Sell 50% PLSX at $0.00012\"\n\u2022 \"Sell remaining 50% at $0.00018\"\n\u2022 Risk management through scaling\n\n**\uD83C\uDFAF Quick Commands:**\n\u2022 \"Take profit: sell PLSX at $0.00015\"\n\u2022 \"Target price for HEX: $0.01\"\n\u2022 \"Sell 50% PLS when 2x gains\"\n\n**\u26A0\uFE0F Execution Notes:**\n\u2022 Manual confirmation required\n\u2022 Watch for low liquidity\n\u2022 Consider gas costs vs. profit\n\u2022 Market conditions may change quickly\n\n*We provide the alerts - you control the execution*";
                        break;
                    case 'monitor':
                        activeAlerts = priceMonitor_js_1.priceMonitor.getAlerts();
                        responseText = "\uD83D\uDCCA **Active Price Monitoring**\n\n**\uD83D\uDD0D Current Alerts (".concat(activeAlerts.length, "):**\n\n").concat(activeAlerts.length > 0 ? activeAlerts.map(function (alert, i) {
                            var typeIcon = alert.condition === 'below' ? '🟢' : '🎯';
                            var currentPrice = priceMonitor_js_1.priceMonitor.getCachedPrice(alert.token);
                            var progress = currentPrice ?
                                "".concat(((currentPrice / alert.targetPrice) * 100).toFixed(1), "%") : 'Fetching...';
                            return "".concat(i + 1, ". ").concat(typeIcon, " **").concat(alert.token, "** Alert \u26A1\n   Condition: Alert when ").concat(alert.condition, " $").concat(alert.targetPrice, "\n   Current: ").concat(currentPrice ? "$".concat(currentPrice.toFixed(6)) : 'Loading...', "\n   Progress: ").concat(progress, " to target\n   Alert ID: ").concat(alert.id);
                        }).join('\n') : '• No active price alerts\n• Use "Set limit order" to create alerts\n• Use "Yes, start monitoring [TOKEN] at $[PRICE]" to begin', "\n\n**\uD83D\uDCC8 Price Status:**\n\u2022 HEX: $0.0074 (Target: $0.0050) - 32% above buy limit\n\u2022 PLS: $0.000095 (Stop: $0.000080) - 18.8% above stop loss\n\u2022 PLSX: $0.000089 (Target: $0.00015) - 59% below take profit\n\n**\uD83D\uDD14 Notification Settings:**\n\u2022 Instant alerts: \u2705 Enabled\n\u2022 Email notifications: \u2705 Enabled  \n\u2022 Browser push: \u2705 Enabled\n\u2022 Discord webhooks: \u26A0\uFE0F Setup required\n\n**\u2699\uFE0F Order Management:**\n\u2022 \"Cancel limit order for HEX\"\n\u2022 \"Modify PLS stop loss to $0.000075\"\n\u2022 \"Add take profit for HEX at $0.01\"\n\u2022 \"Pause all order monitoring\"\n\n**\uD83D\uDCF1 Alert Examples:**\n```\n\uD83D\uDEA8 PRICE ALERT: HEX dropped to $0.0051\n\u23F0 Limit buy order almost triggered!\n\uD83D\uDD17 Execute: https://9mm.pro/swap\n```\n\n**\uD83D\uDCA1 Pro Features:**\n\u2022 Multiple price targets per token\n\u2022 Percentage-based triggers\n\u2022 Smart gas optimization alerts\n\u2022 Market volatility warnings\n\n*Real-time monitoring - manual execution for safety*");
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
                console.error('Advanced orders action error:', error);
                if (callback) {
                    callback({
                        text: "\u274C Failed to process advanced order: ".concat(error instanceof Error ? error.message : 'Unknown error')
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
                content: { text: "Set limit order: buy HEX at $0.005" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll set up price monitoring for HEX at $0.005 and alert you when it's time to execute the buy order.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Stop loss for PLS below $0.00008" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll monitor PLS price and alert you immediately if it drops below $0.00008 so you can execute a protective sell.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "How do limit orders work on DEXes?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me explain how advanced order types work on decentralized exchanges and what solutions are available.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ]
    ],
};
exports.default = advancedOrdersAction;
