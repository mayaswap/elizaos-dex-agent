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
var _9mm_v3_fee_tracker_js_1 = require("../utils/9mm-v3-fee-tracker.js");
var ethers_1 = require("ethers");
var removeLiquidityAction = {
    name: "REMOVE_LIQUIDITY",
    similes: [
        "WITHDRAW_LIQUIDITY",
        "REMOVE_FROM_POOL",
        "EXIT_POSITION",
        "CLOSE_POSITION",
        "WITHDRAW_LP",
        "REMOVE_LP"
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
                    return [2 /*return*/, parsed.intent === 'removeLiquidity' && parsed.confidence > 0.6];
            }
        });
    }); },
    description: "Remove liquidity from 9mm V3 positions using natural language commands",
    handler: function (runtime, message, state, _options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, parsed, positionManager, feeTracker, demoUserAddress, position, _a, feeEarningsResult, performanceResult, feeEarnings, performance_1, token0, token1, feeTierMap, feeTier, inRange, responseText_1, responseText, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    text = message.content.text;
                    return [4 /*yield*/, (0, smartParser_js_1.parseCommand)(text)];
                case 1:
                    parsed = _b.sent();
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    positionManager = new _9mm_v3_position_manager_js_1.NineMmV3PositionManager();
                    feeTracker = new _9mm_v3_fee_tracker_js_1.NineMmV3FeeTracker();
                    demoUserAddress = "0x0000000000000000000000000000000000000000";
                    if (!parsed.positionId) return [3 /*break*/, 5];
                    return [4 /*yield*/, positionManager.getPositionDetails(parsed.positionId)];
                case 3:
                    position = _b.sent();
                    if (!position) {
                        if (callback) {
                            callback({
                                text: "\u274C Position #".concat(parsed.positionId, " not found. Please check the position ID and try again.")
                            });
                        }
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, Promise.allSettled([
                            feeTracker.getFeeEarningsHistory(position.id),
                            feeTracker.getPositionPerformance(position)
                        ])];
                case 4:
                    _a = _b.sent(), feeEarningsResult = _a[0], performanceResult = _a[1];
                    feeEarnings = feeEarningsResult.status === 'fulfilled'
                        ? feeEarningsResult.value
                        : { totalEarned: { usd: '0' }, earningRate: { annualizedAPY: 0 } };
                    performance_1 = performanceResult.status === 'fulfilled'
                        ? performanceResult.value
                        : {
                            currentValue: { totalUSD: 0 },
                            pnl: { percentageReturn: '0', annualizedReturn: '0', ilPnL: '0' },
                            vsHodl: { outperformance: 0 }
                        };
                    // Log any errors but continue execution
                    if (feeEarningsResult.status === 'rejected') {
                        console.warn('Failed to fetch fee earnings:', feeEarningsResult.reason);
                    }
                    if (performanceResult.status === 'rejected') {
                        console.warn('Failed to fetch performance data:', performanceResult.reason);
                    }
                    token0 = position.pool.token0.symbol;
                    token1 = position.pool.token1.symbol;
                    feeTierMap = {
                        '2500': '0.25%',
                        '10000': '1%',
                        '20000': '2%'
                    };
                    feeTier = feeTierMap[position.pool.feeTier] || "".concat(parseInt(position.pool.feeTier) / 10000, "%");
                    inRange = positionManager.isPositionInRange(position);
                    responseText_1 = "\uD83D\uDD34 **Remove Liquidity from Position #".concat(position.id.slice(0, 8), "...**\n\n\uD83D\uDCCA **Position Details:**\n\u2022 Pool: ").concat(token0, "/").concat(token1, " ").concat(feeTier, "\n\u2022 Status: ").concat(inRange ? '🟢 In Range' : '🔴 Out of Range', "\n\u2022 Current Value: $").concat(performance_1.currentValue.totalUSD, "\n\n\uD83D\uDCB0 **Performance Summary:**\n\u2022 Total Fees Earned: $").concat(feeEarnings.totalEarned.usd, " (").concat(feeEarnings.earningRate.annualizedAPY.toFixed(2), "% APY)\n\u2022 Total Return: ").concat(performance_1.pnl.percentageReturn, "% (").concat(performance_1.pnl.annualizedReturn, "% annualized)\n\u2022 vs HODL: ").concat(performance_1.vsHodl.outperformance > 0 ? '+' : '').concat(performance_1.vsHodl.outperformance, "%\n\u2022 IL Impact: ").concat(parseFloat(performance_1.pnl.ilPnL) < 0 ? '-' : '+').concat(Math.abs(parseFloat(performance_1.pnl.ilPnL)).toFixed(2), "%\n\n\uD83C\uDFAF **Removal Options:**\n").concat(parsed.percentage ? "\u2022 Remove ".concat(parsed.percentage, "% of position") : '• Remove 100% (full position)', "\n\u2022 Collect unclaimed fees: ~$").concat((parseFloat(feeEarnings.totalEarned.usd) * 0.1).toFixed(2), " estimated\n\u2022 Expected to receive: ").concat(ethers_1.ethers.formatUnits(position.depositedToken0, position.pool.token0.decimals), " ").concat(token0, " + ").concat(ethers_1.ethers.formatUnits(position.depositedToken1, position.pool.token1.decimals), " ").concat(token1, "\n\n\u26A0\uFE0F **Important Notes:**\n\u2022 Removing liquidity will stop earning fees\n\u2022 You'll receive tokens at current pool ratio\n\u2022 Any unclaimed fees will be collected automatically\n\n*This is a preview. To execute removal, you would need to connect your wallet and sign the transaction.*");
                    if (callback) {
                        callback({
                            text: responseText_1
                        });
                    }
                    return [2 /*return*/, true];
                case 5:
                    responseText = "\uD83D\uDD0D **Remove Liquidity - Position Selection Required**\n\nTo remove liquidity, I need to know which position you want to close.\n\n**How to specify:**\n\u2022 By position ID: \"Remove liquidity from position #12345\"\n\u2022 By percentage: \"Remove 50% from position #12345\"\n\u2022 Remove all: \"Close all my positions\"\n\n**Finding your positions:**\nSay \"Show my liquidity positions\" to see all your active positions with their IDs and performance metrics.\n\n**Out-of-range positions:**\nIf you have positions that are out of range and not earning fees, you might want to remove and reposition them.\n\n*Note: This would require connecting your wallet to see actual positions.*";
                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return [2 /*return*/, true];
                case 6:
                    error_1 = _b.sent();
                    console.error('Remove liquidity action error:', error_1);
                    if (callback) {
                        callback({
                            text: "\u274C Failed to process liquidity removal: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error')
                        });
                    }
                    return [2 /*return*/, false];
                case 7: return [2 /*return*/];
            }
        });
    }); },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Remove liquidity from position #12345" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll help you remove liquidity from position #12345. Let me fetch the position details and show you the expected returns.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "I want to close my PLS/USDC position" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll help you close your PLS/USDC position. First, let me identify your positions in that pool.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Withdraw 50% of my liquidity from position 789" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll prepare a 50% withdrawal from position #789, showing you the expected tokens and fees you'll receive.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ]
    ],
};
exports.default = removeLiquidityAction;
