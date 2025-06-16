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
var positionTrackingAction = {
    name: "POSITION_TRACKING",
    similes: [
        "LP_TRACKING",
        "POSITION_MANAGEMENT",
        "PORTFOLIO_TRACKING",
        "LP_PERFORMANCE",
        "POSITION_ANALYSIS"
    ],
    description: "Track and analyze liquidity provider positions, performance, and profit/loss",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, positionKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            positionKeywords = [
                'position', 'lp', 'liquidity', 'performance', 'profit', 'loss',
                'pnl', 'track', 'monitor', 'portfolio', 'fees earned', 'impermanent',
                'my positions', 'position tracking', 'lp tracking', 'show my lp'
            ];
            return [2 /*return*/, positionKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, positionsAvailable, mockPositions, responseText, hexPosition;
        var _a, _b;
        return __generator(this, function (_c) {
            try {
                text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                positionsAvailable = false;
                if (!positionsAvailable) {
                    if (callback) {
                        callback({
                            text: "\uD83D\uDCCA **Position Tracking**\n\n\u26A0\uFE0F **Coming Soon!**\n\nPosition tracking for liquidity provider (LP) positions is under development.\n\n**What's coming:**\n\u2022 Real-time LP position monitoring\n\u2022 Fees earned tracking\n\u2022 Impermanent loss calculations\n\u2022 Performance analytics\n\u2022 Price range monitoring\n\u2022 APY calculations\n\n**Currently Available:**\n\u2022 Price monitoring for tokens\n\u2022 Trading history tracking\n\u2022 Portfolio overview\n\u2022 Swap execution\n\nStay tuned for comprehensive LP position tracking!"
                        });
                    }
                    return [2 /*return*/, true];
                }
                mockPositions = {
                    activeLPPositions: [
                        {
                            pool: 'HEX/USDC',
                            poolAddress: '0x123...abc',
                            tokenId: '45123',
                            entryDate: '2024-11-15',
                            initialValue: 2500, // USD
                            currentValue: 2847,
                            feesEarned: 127.50,
                            impermanentLoss: -82.30,
                            netPnL: 45.20,
                            pnlPercentage: 1.81,
                            liquidity: {
                                hex: '125000',
                                usdc: '850'
                            },
                            priceRange: {
                                lower: 0.0065,
                                upper: 0.0085,
                                current: 0.0074,
                                inRange: true
                            },
                            apy: 34.2,
                            daysActive: 35
                        },
                        {
                            pool: 'PLS/USDT',
                            poolAddress: '0x456...def',
                            tokenId: '45124',
                            entryDate: '2024-12-01',
                            initialValue: 1000,
                            currentValue: 975,
                            feesEarned: 23.80,
                            impermanentLoss: -48.80,
                            netPnL: -25.00,
                            pnlPercentage: -2.50,
                            liquidity: {
                                pls: '12500000',
                                usdt: '500'
                            },
                            priceRange: {
                                lower: 0.00008,
                                upper: 0.00012,
                                current: 0.000095,
                                inRange: true
                            },
                            apy: 18.7,
                            daysActive: 19
                        }
                    ],
                    closedPositions: [
                        {
                            pool: 'PLSX/HEX',
                            exitDate: '2024-11-30',
                            holdingPeriod: 45,
                            initialValue: 1500,
                            finalValue: 1789,
                            totalFees: 156.20,
                            impermanentLoss: -67.40,
                            netPnL: 289,
                            pnlPercentage: 19.27,
                            realized: true
                        }
                    ],
                    totalStats: {
                        totalInvested: 5000,
                        currentValue: 3822,
                        totalFeesEarned: 307.50,
                        totalImpermanentLoss: -198.50,
                        totalNetPnL: 309.20,
                        totalPnLPercentage: 6.18,
                        activeDays: 99,
                        avgDailyFees: 3.11
                    }
                };
                responseText = '';
                if (text.includes('performance') || text.includes('overview')) {
                    responseText = "\uD83D\uDCCA **LP Position Performance Overview**\n\n**\uD83D\uDCB0 Total Portfolio:**\n\u2022 Total Invested: $".concat(mockPositions.totalStats.totalInvested.toLocaleString(), "\n\u2022 Current Value: $").concat(mockPositions.totalStats.currentValue.toLocaleString(), "\n\u2022 Net P&L: ").concat(mockPositions.totalStats.totalNetPnL > 0 ? '🟢' : '🔴', " $").concat(mockPositions.totalStats.totalNetPnL.toLocaleString(), " (").concat(mockPositions.totalStats.totalPnLPercentage.toFixed(2), "%)\n\n**\uD83D\uDCC8 Performance Breakdown:**\n\u2022 Fees Earned: \uD83D\uDFE2 $").concat(mockPositions.totalStats.totalFeesEarned.toLocaleString(), "\n\u2022 Impermanent Loss: \uD83D\uDD34 $").concat(Math.abs(mockPositions.totalStats.totalImpermanentLoss).toLocaleString(), "\n\u2022 Active Days: ").concat(mockPositions.totalStats.activeDays, "\n\u2022 Avg Daily Fees: $").concat(mockPositions.totalStats.avgDailyFees.toFixed(2), "\n\n**Active Positions (").concat(mockPositions.activeLPPositions.length, "):**\n").concat(mockPositions.activeLPPositions.map(function (pos, i) {
                        var pnlIcon = pos.netPnL > 0 ? '🟢' : '🔴';
                        var rangeIcon = pos.priceRange.inRange ? '🟢' : '🔴';
                        return "".concat(i + 1, ". **").concat(pos.pool, "** ").concat(rangeIcon, " ").concat(pos.priceRange.inRange ? 'In Range' : 'Out of Range', "\n   Value: $").concat(pos.currentValue.toLocaleString(), " | P&L: ").concat(pnlIcon, " $").concat(pos.netPnL.toFixed(2), " (").concat(pos.pnlPercentage.toFixed(2), "%)\n   Fees: $").concat(pos.feesEarned.toFixed(2), " | APY: ").concat(pos.apy.toFixed(1), "% | Days: ").concat(pos.daysActive);
                    }).join('\n'), "\n\n**\uD83C\uDFAF Quick Actions:**\n\u2022 \"Show HEX/USDC position details\" - Deep dive analysis\n\u2022 \"Exit PLS/USDT position\" - Close losing position\n\u2022 \"Rebalance positions\" - Optimize price ranges");
                }
                else if (text.includes('details') || text.includes('hex')) {
                    hexPosition = mockPositions.activeLPPositions[0];
                    if (!hexPosition) {
                        responseText = "\u274C **No HEX/USDC Position Found**\n\nYou don't currently have any HEX/USDC liquidity positions.\n\n**Create a Position:**\n\u2022 Add liquidity to HEX/USDC pool\n\u2022 Choose price range for fee earning\n\u2022 Monitor position performance\n\n**Other Available Positions:**\n\u2022 Check \"position overview\" for all positions\n\u2022 View \"portfolio summary\" for total stats\n\nWould you like to see all your active positions instead?";
                    }
                    else {
                        responseText = "\uD83D\uDD0D **HEX/USDC Position Details**\n\n**\uD83D\uDCCB Position Info:**\n\u2022 Pool: ".concat(hexPosition.pool, " (0.3% fee tier)  \n\u2022 Token ID: #").concat(hexPosition.tokenId, "\n\u2022 Entry Date: ").concat(hexPosition.entryDate, "\n\u2022 Days Active: ").concat(hexPosition.daysActive, "\n\n**\uD83D\uDCB0 Financial Performance:**\n\u2022 Initial Value: $").concat(hexPosition.initialValue.toLocaleString(), "\n\u2022 Current Value: $").concat(hexPosition.currentValue.toLocaleString(), "\n\u2022 Net P&L: ").concat(hexPosition.netPnL > 0 ? '🟢' : '🔴', " $").concat(hexPosition.netPnL.toFixed(2), " (").concat(hexPosition.pnlPercentage.toFixed(2), "%)\n\n**\uD83D\uDCCA P&L Breakdown:**\n\u2022 Fees Earned: \uD83D\uDFE2 $").concat(hexPosition.feesEarned.toFixed(2), "\n\u2022 Impermanent Loss: \uD83D\uDD34 $").concat(Math.abs(hexPosition.impermanentLoss).toFixed(2), "\n\u2022 Current APY: ").concat(hexPosition.apy.toFixed(1), "%\n\n**\uD83D\uDCA7 Current Liquidity:**\n\u2022 HEX: ").concat(parseFloat(hexPosition.liquidity.hex || '0').toLocaleString(), " tokens\n\u2022 USDC: $").concat(parseFloat(hexPosition.liquidity.usdc || '0').toLocaleString(), "\n\n**\uD83D\uDCCD Price Range:**\n\u2022 Lower: $").concat(hexPosition.priceRange.lower.toFixed(4), "\n\u2022 Current: $").concat(hexPosition.priceRange.current.toFixed(4), " ").concat(hexPosition.priceRange.inRange ? '🟢 In Range' : '🔴 Out of Range', "\n\u2022 Upper: $").concat(hexPosition.priceRange.upper.toFixed(4), "\n\n**\uD83D\uDCA1 Recommendations:**\n").concat(hexPosition.priceRange.inRange ?
                            '• Position is earning fees actively\n• Consider collecting fees periodically\n• Monitor for price range breaks' :
                            '• Position is not earning fees\n• Consider rebalancing price range\n• Evaluate exit vs. adjustment', "\n\n**\uD83C\uDFAF Actions:**\n\u2022 \"Collect fees\" - Harvest earned fees\n\u2022 \"Rebalance range\" - Update price range\n\u2022 \"Exit position\" - Close position\n\u2022 \"Add liquidity\" - Increase position size");
                    }
                }
                else {
                    responseText = "\uD83D\uDCC8 **Position Tracking Hub**\n\n**Active Monitoring:**\n\u2022 ".concat(mockPositions.activeLPPositions.length, " active LP positions\n\u2022 $").concat(mockPositions.totalStats.currentValue.toLocaleString(), " total value\n\u2022 ").concat(mockPositions.totalStats.totalPnLPercentage.toFixed(2), "% overall return\n\n**\uD83D\uDCCA What would you like to track?**\n\n**Position Overview:**\n\u2022 \"Show LP performance\" - Portfolio summary\n\u2022 \"Position overview\" - All positions at a glance\n\n**Detailed Analysis:**\n\u2022 \"Show HEX/USDC position details\" - Deep dive\n\u2022 \"Show PLS/USDT position details\" - Individual analysis\n\n**Management Actions:**\n\u2022 \"Collect all fees\" - Harvest earnings\n\u2022 \"Rebalance positions\" - Optimize ranges\n\u2022 \"Exit losing positions\" - Risk management\n\n**Historical Data:**\n\u2022 \"Show closed positions\" - Past performance\n\u2022 \"Trading history\" - All transactions\n\u2022 \"Fee earnings report\" - Income tracking\n\n*Real-time data from 9mm V3 subgraph + on-chain position tracking*");
                }
                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return [2 /*return*/, true];
            }
            catch (error) {
                console.error('Position tracking action error:', error);
                if (callback) {
                    callback({
                        text: "\u274C Failed to load position data: ".concat(error instanceof Error ? error.message : 'Unknown error')
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
                content: { text: "Show my LP positions" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you all your active liquidity provider positions with performance metrics and P&L analysis.",
                    action: "POSITION_TRACKING"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Track HEX/USDC position performance" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me analyze your HEX/USDC position including fees earned, impermanent loss, and current range status.",
                    action: "POSITION_TRACKING"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show LP profit and loss" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll provide a comprehensive P&L breakdown of your liquidity provider positions.",
                    action: "POSITION_TRACKING"
                }
            }
        ]
    ],
};
exports.default = positionTrackingAction;
