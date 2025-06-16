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
var tokenAllowanceAction = {
    name: "TOKEN_ALLOWANCE",
    similes: [
        "ALLOWANCE_MANAGEMENT",
        "TOKEN_APPROVAL",
        "SPENDING_LIMIT",
        "REVOKE_APPROVAL",
        "CHECK_ALLOWANCE"
    ],
    description: "Manage ERC20 token allowances - check, set, or revoke spending permissions for DEX contracts",
    validate: function (runtime, message) { return __awaiter(void 0, void 0, void 0, function () {
        var text, allowanceKeywords;
        var _a, _b;
        return __generator(this, function (_c) {
            text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
            allowanceKeywords = [
                'allowance', 'approval', 'approve', 'revoke', 'spending limit',
                'permission', 'authorize', 'unlimited approval', 'check allowance',
                'set allowance', 'token permission', 'spending cap', 'approve tokens'
            ];
            return [2 /*return*/, allowanceKeywords.some(function (keyword) { return text.includes(keyword); })];
        });
    }); },
    handler: function (runtime, message, state, options, callback) { return __awaiter(void 0, void 0, void 0, function () {
        var text, action, allowanceCheckAvailable, mockAllowanceData, responseText, revokeToken, setToken, amountMatch, amount;
        var _a, _b;
        return __generator(this, function (_c) {
            try {
                text = ((_b = (_a = message.content) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.toLowerCase()) || '';
                action = 'check';
                if (text.includes('revoke') || text.includes('remove'))
                    action = 'revoke';
                else if (text.includes('set') || text.includes('approve') || text.includes('authorize'))
                    action = 'set';
                allowanceCheckAvailable = false;
                if (!allowanceCheckAvailable) {
                    if (callback) {
                        callback({
                            text: "\uD83D\uDD10 **Token Allowances**\n\n\u26A0\uFE0F **Coming Soon!**\n\nToken allowance management is under development.\n\n**What's coming:**\n\u2022 View current token approvals\n\u2022 Revoke unnecessary allowances\n\u2022 Set custom allowance amounts\n\u2022 Security recommendations\n\u2022 Gas-efficient approval strategies\n\n**Security Tips:**\n\u2022 Only approve what you need\n\u2022 Revoke unused allowances\n\u2022 Use exact amounts when possible\n\nToken allowance management will help you maintain better security. Stay tuned!"
                        });
                    }
                    return [2 /*return*/, true];
                }
                mockAllowanceData = {
                    currentAllowances: [
                        {
                            token: 'USDC',
                            tokenAddress: '0x15D38573d2feeb82e7ad5187aB8c1D52',
                            spender: '9mm Router',
                            spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                            allowance: '115792089237316195423570985008687907853269984665640564039457584007913129639935',
                            isUnlimited: true,
                            lastApproved: '2024-12-20',
                            riskLevel: 'High'
                        },
                        {
                            token: 'HEX',
                            tokenAddress: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
                            spender: '9mm Router',
                            spenderAddress: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
                            allowance: '1000000000000000000000',
                            isUnlimited: false,
                            lastApproved: '2024-12-19',
                            riskLevel: 'Medium'
                        },
                        {
                            token: 'WPLS',
                            tokenAddress: '0x70499adEBB11Efd915E3b69E700c331778628707',
                            spender: 'Old Contract',
                            spenderAddress: '0x123...OLD',
                            allowance: '500000000000000000000',
                            isUnlimited: false,
                            lastApproved: '2024-10-15',
                            riskLevel: 'Critical'
                        }
                    ],
                    recommendations: [
                        {
                            type: 'revoke',
                            token: 'WPLS',
                            reason: 'Old contract - potential security risk',
                            priority: 'High'
                        },
                        {
                            type: 'limit',
                            token: 'USDC',
                            reason: 'Unlimited approval - consider setting spending limit',
                            priority: 'Medium'
                        }
                    ]
                };
                responseText = '';
                switch (action) {
                    case 'check':
                        responseText = "\uD83D\uDD10 **Token Allowance Overview**\n\n**Current Approvals:**\n".concat(mockAllowanceData.currentAllowances.map(function (allowance, i) {
                            var riskIcon = allowance.riskLevel === 'Critical' ? '🔴' :
                                allowance.riskLevel === 'High' ? '🟠' :
                                    allowance.riskLevel === 'Medium' ? '🟡' : '🟢';
                            var amount = allowance.isUnlimited ? 'UNLIMITED' :
                                "".concat((parseFloat(allowance.allowance) / 1e18).toLocaleString(), " ").concat(allowance.token);
                            return "".concat(i + 1, ". **").concat(allowance.token, "** \u2192 ").concat(allowance.spender, "\n   Amount: ").concat(amount, " ").concat(riskIcon, " ").concat(allowance.riskLevel, " Risk\n   Approved: ").concat(allowance.lastApproved, "\n   Address: ").concat(allowance.spenderAddress.slice(0, 8), "...");
                        }).join('\n'), "\n\n**\uD83D\uDEA8 Security Recommendations:**\n").concat(mockAllowanceData.recommendations.map(function (rec) {
                            var priorityIcon = rec.priority === 'High' ? '🔴' : rec.priority === 'Medium' ? '🟡' : '🟢';
                            return "".concat(priorityIcon, " **").concat(rec.type.toUpperCase(), "** ").concat(rec.token, ": ").concat(rec.reason);
                        }).join('\n'), "\n\n**\uD83D\uDEE1\uFE0F Best Practices:**\n\u2022 Revoke unused approvals regularly\n\u2022 Set spending limits instead of unlimited approvals\n\u2022 Review approvals before major transactions\n\u2022 Never approve unknown contracts\n\n**Quick Actions:**\n\u2022 \"Revoke WPLS approval\" - Remove old contract access\n\u2022 \"Set USDC allowance to $1000\" - Limit spending amount\n\u2022 \"Approve HEX for trading\" - Grant new permission");
                        break;
                    case 'revoke':
                        revokeToken = text.includes('usdc') ? 'USDC' :
                            text.includes('hex') ? 'HEX' :
                                text.includes('wpls') ? 'WPLS' : 'UNKNOWN';
                        responseText = "\uD83D\uDD34 **Revoking Token Approval**\n\n**Action:** Remove spending permission for ".concat(revokeToken, "\n**Contract:** 9mm Router (0x7a25...2488D)\n**Current Allowance:** ").concat(revokeToken === 'USDC' ? 'UNLIMITED' : '1,000 tokens', "\n\n**Transaction Details:**\n\u2022 Gas Estimate: ~45,000 gas (~$0.15)\n\u2022 Method: approve(spender, 0)\n\u2022 Security: \u2705 Safe operation\n\n**\u26A0\uFE0F Impact:**\n\u2022 Future trades will require new approval\n\u2022 Existing trades/swaps will complete normally\n\u2022 Protects against potential contract exploits\n\n**Confirm to proceed:**\n\u2022 \"Yes, revoke ").concat(revokeToken, " approval\"\n\u2022 \"Cancel revoke\"\n\n*Note: This is a demo - actual transaction would be sent to blockchain*");
                        break;
                    case 'set':
                        setToken = text.includes('usdc') ? 'USDC' :
                            text.includes('hex') ? 'HEX' :
                                text.includes('wpls') ? 'WPLS' : 'UNKNOWN';
                        amountMatch = text.match(/(\d+(?:\.\d+)?)/);
                        amount = amountMatch ? amountMatch[1] : '1000';
                        responseText = "\uD83D\uDFE2 **Setting Token Allowance**\n\n**Token:** ".concat(setToken, "\n**Spender:** 9mm Router (0x7a25...2488D)\n**New Allowance:** ").concat(amount, " ").concat(setToken, "\n**Current:** ").concat(setToken === 'USDC' ? 'UNLIMITED' : 'No approval', "\n\n**Transaction Details:**\n\u2022 Gas Estimate: ~46,000 gas (~$0.16)\n\u2022 Method: approve(spender, amount)\n\u2022 Security: \u2705 Limited spending amount\n\n**\uD83D\uDCA1 Smart Limits:**\n\u2022 Recommended: Set 2-3x your typical trade size\n\u2022 Current setting: ").concat(amount, " ").concat(setToken, "\n\u2022 You can increase later if needed\n\n**\u26A0\uFE0F Security Notes:**\n\u2022 Only approve what you plan to spend\n\u2022 This contract has been audited\n\u2022 Revoke when done trading\n\n**Confirm to proceed:**\n\u2022 \"Yes, approve ").concat(amount, " ").concat(setToken, "\"\n\u2022 \"Set different amount\"\n\u2022 \"Cancel approval\"\n\n*Note: This is a demo - actual transaction would be sent to blockchain*");
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
                console.error('Token allowance action error:', error);
                if (callback) {
                    callback({
                        text: "\u274C Failed to manage token allowances: ".concat(error instanceof Error ? error.message : 'Unknown error')
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
                content: { text: "Check my token allowances" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you all your current token approvals and any security recommendations.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Revoke USDC approval" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll help you revoke the USDC spending permission from the DEX contract for security.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Set HEX allowance to 1000" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll set a limited spending allowance of 1000 HEX for the DEX router instead of unlimited approval.",
                    action: "TOKEN_ALLOWANCE"
                }
            }
        ]
    ],
};
exports.default = tokenAllowanceAction;
