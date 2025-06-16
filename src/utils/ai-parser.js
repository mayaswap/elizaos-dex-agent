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
exports.AIParser = void 0;
exports.parseWithAI = parseWithAI;
var sdk_1 = require("@anthropic-ai/sdk");
var dotenv_1 = require("dotenv");
var chains_js_1 = require("../config/chains.js");
// Load environment variables
dotenv_1.default.config();
// Initialize Anthropic client with proper environment variable handling
var getAnthropicKey = function () {
    return process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY; // Support both for backward compatibility
};
var client = new sdk_1.default({
    apiKey: getAnthropicKey(),
});
// Available tokens for validation
var AVAILABLE_TOKENS = Object.values(chains_js_1.POPULAR_TOKENS.pulsechain);
/**
 * AI-Powered Natural Language Parser
 * Uses OpenAI to understand user commands with typos, variations, and natural language
 */
var AIParser = /** @class */ (function () {
    function AIParser() {
        this.isEnabled = false;
        // Check if API key is available
        this.isEnabled = !!getAnthropicKey();
        if (!this.isEnabled) {
            console.log('🔧 AI parsing disabled - no ANTHROPIC_API_KEY or OPENAI_API_KEY found');
        }
    }
    AIParser.getInstance = function () {
        if (!AIParser.instance) {
            AIParser.instance = new AIParser();
        }
        return AIParser.instance;
    };
    /**
     * Parse natural language command using AI
     */
    AIParser.prototype.parseCommand = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, completion, response, parsed, result, error_1;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        if (!this.isEnabled) {
                            console.log('🔧 AI parser disabled - API key not found');
                            throw new Error('AI parser not enabled - API key missing');
                        }
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, , 4]);
                        systemPrompt = "You are an expert at parsing natural language commands for a DEX (Decentralized Exchange) trading interface.\n\nYour job is to analyze user input and determine if it's:\n1. A STRUCTURED COMMAND - specific trading/wallet actions that need parameters\n2. GENERAL CONVERSATION - greetings, questions, casual chat\n\nONLY structured commands should be parsed. General conversation should be identified as such.\n\nAvailable Structured Command Intents:\n- swap: Exchange one token for another (needs tokens/amounts)\n- price: Get specific token price information  \n- balance: Check wallet token balances\n- wallet: Create/manage wallets\n- address: Show wallet address\n- addLiquidity: Add liquidity to pools (needs tokens/amounts)\n- removeLiquidity: Remove liquidity from pools (needs position)\n- poolQuery: Query specific pool information (needs tokens)\n- portfolio: View portfolio overview\n\nAvailable Tokens: ".concat(AVAILABLE_TOKENS.join(', '), "\n\nIMPORTANT RULES FOR TOKEN FIELD MAPPING:\n- For \"price\" queries: The token being asked about goes in \"fromToken\" field\n  Example: \"price of PLS\" \u2192 fromToken: \"PLS\", toToken: null\n- For \"swap\" commands: Source token in \"fromToken\", destination in \"toToken\"\n  Example: \"swap PLS for HEX\" \u2192 fromToken: \"PLS\", toToken: \"HEX\"\n- For single token queries (balance, price): Use \"fromToken\" only\n- If input is greeting/casual chat (hi, hello, how are you, etc.) \u2192 return \"general_conversation\"\n- If input is vague questions without specific parameters \u2192 return \"general_conversation\"  \n- Only parse as structured command if it has clear action + parameters\n\nRESPONSE FORMAT - Return ONLY valid JSON:\n\nFor STRUCTURED COMMANDS:\n{\n  \"intent\": \"swap|price|balance|wallet|addLiquidity|removeLiquidity|poolQuery|portfolio\",\n  \"fromToken\": \"TOKEN_SYMBOL or null\",\n  \"toToken\": \"TOKEN_SYMBOL or null\", \n  \"amount\": \"AMOUNT_STRING or null\",\n  \"confidence\": 0.95,\n  \"rawInput\": \"original input\",\n  \"reasoning\": \"brief explanation\"\n}\n\nFor GENERAL CONVERSATION:\n{\n  \"intent\": \"general_conversation\",\n  \"fromToken\": null,\n  \"toToken\": null,\n  \"amount\": null,\n  \"confidence\": 0.95,\n  \"rawInput\": \"original input\",\n  \"reasoning\": \"This is general conversation/greeting\"\n}\n\nExamples:\nInput: \"hi\" \u2192 {\"intent\": \"general_conversation\", \"fromToken\": null, \"toToken\": null, \"amount\": null, \"confidence\": 0.95, \"rawInput\": \"hi\", \"reasoning\": \"This is a greeting\"}\nInput: \"price of PLS\" \u2192 {\"intent\": \"price\", \"fromToken\": \"PLS\", \"toToken\": null, \"amount\": null, \"confidence\": 0.95, \"rawInput\": \"price of PLS\", \"reasoning\": \"Price query for PLS token\"}\nInput: \"swap 100 usdc for pls\" \u2192 {\"intent\": \"swap\", \"fromToken\": \"USDC\", \"toToken\": \"PLS\", \"amount\": \"100\", \"confidence\": 0.95, \"rawInput\": \"swap 100 usdc for pls\", \"reasoning\": \"Clear swap command with parameters\"}\nInput: \"how are you?\" \u2192 {\"intent\": \"general_conversation\", \"fromToken\": null, \"toToken\": null, \"amount\": null, \"confidence\": 0.95, \"rawInput\": \"how are you?\", \"reasoning\": \"General question/conversation\"}");
                        console.log('🤖 Calling Anthropic API...');
                        return [4 /*yield*/, client.messages.create({
                                model: "claude-3-haiku-20240307", // Fast and cost-effective model
                                max_tokens: 200,
                                temperature: 0.1, // Low temperature for consistent parsing
                                system: systemPrompt,
                                messages: [
                                    { role: "user", content: input }
                                ]
                            })];
                    case 2:
                        completion = _f.sent();
                        console.log('✅ Anthropic API response received');
                        response = ((_a = completion.content[0]) === null || _a === void 0 ? void 0 : _a.type) === 'text' ? completion.content[0].text : null;
                        if (!response) {
                            throw new Error('No response from AI');
                        }
                        parsed = void 0;
                        try {
                            parsed = JSON.parse(response.trim());
                        }
                        catch (jsonError) {
                            // If it's not JSON, it might be natural language - return low confidence for general chat
                            console.log('🤖 AI returned natural language instead of JSON - this seems like general conversation');
                            return [2 /*return*/, {
                                    intent: 'general_conversation',
                                    confidence: 0.05, // Very low confidence to avoid repeated attempts
                                    rawInput: input
                                }];
                        }
                        result = {
                            intent: this.validateIntent(parsed.intent),
                            fromToken: this.normalizeToken(parsed.fromToken),
                            toToken: this.normalizeToken(parsed.toToken),
                            amount: parsed.amount || undefined,
                            confidence: Math.min(Math.max(parsed.confidence || 0.5, 0), 1),
                            rawInput: input,
                            // Add any additional fields if needed
                            slippage: parsed.slippage || undefined,
                            feeTier: parsed.feeTier || undefined,
                            positionId: parsed.positionId || undefined,
                            percentage: parsed.percentage || undefined,
                            rangeType: parsed.rangeType || undefined,
                            outOfRange: parsed.outOfRange || undefined
                        };
                        console.log("\uD83E\uDD16 AI Parsed: \"".concat(input, "\" \u2192 ").concat(result.intent, " (").concat((result.confidence * 100).toFixed(0), "% confidence)"));
                        if (parsed.reasoning) {
                            console.log("   Reasoning: ".concat(parsed.reasoning));
                        }
                        return [2 /*return*/, result];
                    case 3:
                        error_1 = _f.sent();
                        // Provide detailed error information for debugging
                        if (((_b = error_1.error) === null || _b === void 0 ? void 0 : _b.type) === 'authentication_error') {
                            console.error('❌ Anthropic API Authentication Error - Invalid API key');
                            console.error('💡 Check your ANTHROPIC_API_KEY in .env file');
                        }
                        else if (((_c = error_1.error) === null || _c === void 0 ? void 0 : _c.type) === 'rate_limit_error') {
                            console.error('❌ Anthropic API Rate Limit - Please wait and try again');
                        }
                        else if (((_d = error_1.error) === null || _d === void 0 ? void 0 : _d.type) === 'api_error') {
                            console.error('❌ Anthropic API Error:', error_1.error.message);
                        }
                        else if ((_e = error_1.message) === null || _e === void 0 ? void 0 : _e.includes('JSON')) {
                            console.error('❌ AI Response Parsing Error - Invalid JSON response');
                            console.error('Response was:', error_1.message);
                        }
                        else {
                            console.error('❌ AI Parser Error:', error_1.message);
                            console.error('Full error:', error_1);
                        }
                        // Return low confidence for fallback to regex
                        return [2 /*return*/, {
                                intent: 'general_conversation',
                                confidence: 0.1,
                                rawInput: input
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Validate and normalize intent
     */
    AIParser.prototype.validateIntent = function (intent) {
        var validIntents = [
            'swap', 'price', 'balance', 'wallet', 'address', 'addLiquidity',
            'removeLiquidity', 'poolQuery', 'portfolio', 'general_conversation'
        ];
        return validIntents.includes(intent) ? intent : 'general_conversation';
    };
    /**
     * Normalize token symbols
     */
    AIParser.prototype.normalizeToken = function (token) {
        if (!token)
            return undefined;
        var upperToken = token.toUpperCase();
        // Direct match
        if (AVAILABLE_TOKENS.includes(upperToken)) {
            return upperToken;
        }
        // Common aliases
        var aliases = {
            'PULSE': 'PLS',
            'PULSECHAIN': 'PLS',
            'ETHEREUM': 'WETH',
            'ETH': 'WETH',
            'WRAPPED_PLS': 'WPLS',
            'WRAPPEDPLS': 'WPLS',
            'USD_COIN': 'USDC',
            'USDCOIN': 'USDC',
            'TETHER': 'USDT',
            'DAI_STABLECOIN': 'DAI',
            'PULSEX': 'PLSX',
            'NINE_MM': '9MM',
            'NINEMM': '9MM'
        };
        return aliases[upperToken] || upperToken;
    };
    /**
     * Check if AI parsing is available
     */
    AIParser.prototype.isAvailable = function () {
        return this.isEnabled;
    };
    return AIParser;
}());
exports.AIParser = AIParser;
/**
 * Convenience function to parse with AI
 */
function parseWithAI(input) {
    return __awaiter(this, void 0, void 0, function () {
        var parser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parser = AIParser.getInstance();
                    return [4 /*yield*/, parser.parseCommand(input)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
