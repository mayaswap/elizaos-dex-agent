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
exports.parseCommand = parseCommand;
exports.getTokenAddress = getTokenAddress;
exports.validateCommand = validateCommand;
exports.formatCommand = formatCommand;
exports.getExampleCommands = getExampleCommands;
var chains_js_1 = require("../config/chains.js");
// Simple cache to avoid multiple AI calls for the same input
var parseCache = new Map();
var CACHE_DURATION = 5000; // 5 seconds
var MAX_CACHE_SIZE = 100; // Maximum cache entries to prevent memory leaks
/**
 * Enhanced token symbol variations and aliases with fuzzy matching
 */
var TOKEN_ALIASES = {
    // Native tokens with variations
    'pulse': 'PLS',
    'pls': 'PLS',
    'pulsechain': 'PLS',
    // Ethereum mappings
    'ethereum': 'WETH',
    'eth': 'WETH',
    'ether': 'WETH',
    // Wrapped tokens
    'wrapped pulse': 'WPLS',
    'wpls': 'WPLS',
    'wrapped ethereum': 'WETH',
    'weth': 'WETH',
    // Stablecoins with variations
    'usdc': 'USDC',
    'usd coin': 'USDC',
    'usd-c': 'USDC',
    'usdt': 'USDT',
    'tether': 'USDT',
    'tether usd': 'USDT',
    'dai': 'DAI',
    'makerdao': 'DAI',
    // Popular tokens with variations
    'hex': 'HEX',
    'hexicans': 'HEX',
    'plsx': 'PLSX',
    'pulsex': 'PLSX',
    'pulse x': 'PLSX',
    'pulsex token': 'PLSX',
    '9mm': '9MM',
    'nine mm': '9MM',
    'ninemm': '9MM',
    '9 mm': '9MM',
    'nine millimeter': '9MM',
};
/**
 * Enhanced intent patterns with more comprehensive matching
 */
var INTENT_PATTERNS = {
    swap: [
        /\b(swap|exchange|trade|convert|change|turn)\b/i,
        /\b(buy|sell|purchase)\b/i,
        /\bfor\b/i,
        /\bto\b/i,
        /\binto\b/i,
        /\bwith\b/i,
        /→|->|=>|→/,
        /\bi\s+(want|need|would like)\s+to\s+(swap|exchange|trade|convert|buy|sell)/i,
        /\bcan\s+you\s+(swap|exchange|trade|convert)/i,
        /\bget\s+me\s+(some|a)\b/i,
        /\blooking\s+to\s+(buy|sell|swap|trade)/i,
        /\d+.*?(for|to|into|→)/i,
    ],
    price: [
        /\b(price|cost|rate|value|worth)\b/i,
        /\btrading\s+at\b/i,
        /\bquote\s+(for|on)\b/i,
        /\bwhat'?s\s+(the\s+)?(price|cost|rate|value)\b/i,
        /\bhow\s+much\s+(is|does|for)\b/i,
        /\bcurrent\s+price\b/i,
        /\bprice\s+check\b/i,
        /\bcheck\s+price\b/i,
        /\b\w+\s+(price|value|rate|cost)\b/i,
        /\bprice\s+of\s+\w+/i,
        /\bwhat'?s\s+\w+\s+trading\s+at/i,
        /\b\w+\s+to\s+usd\s+price/i,
        /\bwhat\s+about\s+\w+/i,
        /\btell\s+me\s+about\s+\w+/i,
        /\binfo\s+on\s+\w+/i,
        /\b(check|show)\s+\w+/i,
    ],
    balance: [
        /\b(balance|holdings?|amount)\b/i,
        /\bhow\s+much\s+(do\s+i\s+have|have\s+i\s+got|\w+\s+do\s+i\s+have)/i,
        /\bshow\s+(my|me)\s+\w+/i,
        /\bmy\s+\w+\s+(balance|holdings?|amount)/i,
        /\bcheck\s+my\s+\w+/i,
        /\bwhat'?s\s+my\s+\w+/i,
        /\bwhat\s+is\s+my\s+balance\b/i,
        /\bwhat'?s\s+my\s+balance\b/i,
        /\bshow\s+my\s+balance\b/i,
        /\bcheck\s+my\s+balance\b/i,
        /\bmy\s+balance\b/i,
    ],
    portfolio: [
        /\b(portfolio|assets)\b/i,
        /\ball\s+(my\s+)?(tokens|assets|balances|holdings)/i,
        /\btotal\s+(value|worth|assets)/i,
        /\bnet\s+worth\b/i,
        /\bmy\s+holdings\b/i,
        /\bshow\s+my\s+portfolio\b/i,
        /\bportfolio\s+overview\b/i,
    ],
    help: [
        /\b(help|commands?|instructions?)\b/i,
        /\bwhat\s+can\s+you\s+do\b/i,
        /\bhow\s+(to|do\s+i)\b/i,
        /\bguide\b/i,
    ],
    address: [
        /\bshow\s+(my\s+)?(wallet\s+)?address\b/i,
        /\bwhat'?s\s+my\s+address\b/i,
        /\bmy\s+wallet\s+address\b/i,
        /\bget\s+my\s+address\b/i,
        /\bdisplay\s+(my\s+)?address\b/i,
        /\bwhere\s+is\s+my\s+address\b/i,
        /\bwhat\s+is\s+my\s+wallet\s+address\b/i,
    ],
};
function extractTokensEnhanced(input) {
    var _a;
    var normalizedInput = input.toLowerCase();
    var tokens = [];
    var positions = [];
    // Enhanced token detection with context awareness
    var tokenRegex = /\b([a-z]{2,8}|\d+[a-z]{2,8}|[a-z]+\d+[a-z]*)\b/gi;
    var match;
    while ((match = tokenRegex.exec(input)) !== null) {
        var candidate = (_a = match[1]) === null || _a === void 0 ? void 0 : _a.toLowerCase();
        if (candidate) {
            var normalizedToken = normalizeTokenEnhanced(candidate);
            if (normalizedToken && normalizedToken !== 'UNKNOWN') {
                tokens.push(normalizedToken);
                positions.push(match.index);
            }
        }
    }
    return { tokens: tokens, positions: positions };
}
function detectIntentEnhanced(input) {
    var normalizedInput = input.toLowerCase();
    var bestIntent = 'unknown';
    var bestScore = 0;
    for (var _i = 0, _a = Object.entries(INTENT_PATTERNS); _i < _a.length; _i++) {
        var _b = _a[_i], intent = _b[0], patterns = _b[1];
        var score = 0;
        for (var _c = 0, patterns_1 = patterns; _c < patterns_1.length; _c++) {
            var pattern = patterns_1[_c];
            if (pattern.test(normalizedInput)) {
                score += 1;
            }
        }
        if (score > bestScore) {
            bestScore = score;
            bestIntent = intent;
        }
    }
    return { intent: bestIntent, score: bestScore };
}
function extractAmountEnhanced(input) {
    var amountPatterns = [
        /(\d+(?:\.\d+)?)\s*(?:million|m)\b/i,
        /(\d+(?:\.\d+)?)\s*(?:thousand|k)\b/i,
        /(\d+(?:\.\d+)?)\b/,
    ];
    for (var _i = 0, amountPatterns_1 = amountPatterns; _i < amountPatterns_1.length; _i++) {
        var pattern = amountPatterns_1[_i];
        var match = input.match(pattern);
        if (match && match[1]) {
            var amount = parseFloat(match[1]);
            if (input.toLowerCase().includes('million') || input.toLowerCase().includes('m')) {
                amount *= 1000000;
            }
            else if (input.toLowerCase().includes('thousand') || input.toLowerCase().includes('k')) {
                amount *= 1000;
            }
            return amount.toString();
        }
    }
    return undefined;
}
function normalizeTokenEnhanced(token) {
    var lowerToken = token.toLowerCase();
    // Direct mapping
    if (TOKEN_ALIASES[lowerToken]) {
        return TOKEN_ALIASES[lowerToken];
    }
    // Check if it's already a valid token
    var upperToken = token.toUpperCase();
    if (chains_js_1.POPULAR_TOKENS.pulsechain[upperToken]) {
        return upperToken;
    }
    return 'UNKNOWN';
}
function parseSwapEnhanced(input) {
    var tokens = extractTokensEnhanced(input).tokens;
    var amount = extractAmountEnhanced(input);
    // Enhanced directional analysis
    var directionIndicators = ['for', 'to', 'into', '→', '->', '=>'];
    var fromToken;
    var toToken;
    if (tokens.length >= 2) {
        var inputLower = input.toLowerCase();
        // Find directional indicators
        for (var _i = 0, directionIndicators_1 = directionIndicators; _i < directionIndicators_1.length; _i++) {
            var indicator = directionIndicators_1[_i];
            var index = inputLower.indexOf(indicator);
            if (index !== -1) {
                // Token before indicator is fromToken, after is toToken
                var beforeText = input.substring(0, index);
                var afterText = input.substring(index + indicator.length);
                var beforeTokens = extractTokensEnhanced(beforeText).tokens;
                var afterTokens = extractTokensEnhanced(afterText).tokens;
                if (beforeTokens.length > 0 && beforeTokens[beforeTokens.length - 1]) {
                    fromToken = beforeTokens[beforeTokens.length - 1];
                }
                if (afterTokens.length > 0 && afterTokens[0]) {
                    toToken = afterTokens[0];
                }
                break;
            }
        }
        // Fallback: first token is from, last is to
        if (!fromToken || !toToken) {
            if (tokens[0])
                fromToken = tokens[0];
            if (tokens[tokens.length - 1])
                toToken = tokens[tokens.length - 1];
        }
    }
    var confidence = (fromToken && toToken && amount) ? 0.9 : 0.6;
    return {
        intent: 'swap',
        fromToken: fromToken,
        toToken: toToken,
        amount: amount,
        confidence: confidence,
        rawInput: input,
    };
}
function parsePriceEnhanced(input) {
    var tokens = extractTokensEnhanced(input).tokens;
    // For price queries, we typically want the first valid token mentioned
    var fromToken = tokens[0];
    var confidence = fromToken ? 0.8 : 0.4;
    return {
        intent: 'price',
        fromToken: fromToken,
        confidence: confidence,
        rawInput: input,
    };
}
function parseBalanceEnhanced(input) {
    var tokens = extractTokensEnhanced(input).tokens;
    // For balance queries, look for the token after "my" or before "balance"
    var fromToken = tokens[0];
    var confidence = fromToken ? 0.8 : 0.6;
    return {
        intent: 'balance',
        fromToken: fromToken,
        confidence: confidence,
        rawInput: input,
    };
}
function parseCommand(input) {
    return __awaiter(this, void 0, void 0, function () {
        var cached, result, now, _i, _a, _b, key, value, entries, toRemove;
        return __generator(this, function (_c) {
            cached = parseCache.get(input);
            if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
                return [2 /*return*/, cached.result];
            }
            result = parseWithRegex(input);
            // Cache cleanup to prevent memory leaks
            if (parseCache.size >= MAX_CACHE_SIZE) {
                now = Date.now();
                // Remove expired entries first
                for (_i = 0, _a = parseCache.entries(); _i < _a.length; _i++) {
                    _b = _a[_i], key = _b[0], value = _b[1];
                    if (now - value.timestamp > CACHE_DURATION) {
                        parseCache.delete(key);
                    }
                }
                // If still over limit, remove oldest entries
                if (parseCache.size >= MAX_CACHE_SIZE) {
                    entries = Array.from(parseCache.entries());
                    entries.sort(function (a, b) { return a[1].timestamp - b[1].timestamp; });
                    toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
                    toRemove.forEach(function (_a) {
                        var key = _a[0];
                        return parseCache.delete(key);
                    });
                }
            }
            // Cache the result
            parseCache.set(input, { result: result, timestamp: Date.now() });
            return [2 /*return*/, result];
        });
    });
}
function parseWithRegex(input) {
    var _a = detectIntentEnhanced(input), intent = _a.intent, score = _a.score;
    if (score === 0) {
        return {
            intent: 'unknown',
            confidence: 0.1,
            rawInput: input,
        };
    }
    switch (intent) {
        case 'swap':
            return parseSwapEnhanced(input);
        case 'price':
            return parsePriceEnhanced(input);
        case 'balance':
            return parseBalanceEnhanced(input);
        case 'portfolio':
            return {
                intent: 'portfolio',
                confidence: 0.8,
                rawInput: input,
            };
        case 'help':
            return {
                intent: 'help',
                confidence: 0.9,
                rawInput: input,
            };
        case 'address':
            return {
                intent: 'address',
                confidence: 0.9,
                rawInput: input,
            };
        default:
            return {
                intent: 'unknown',
                confidence: 0.2,
                rawInput: input,
            };
    }
}
function getTokenAddress(symbol) {
    return chains_js_1.POPULAR_TOKENS.pulsechain[symbol] || null;
}
function validateCommand(command) {
    var errors = [];
    if (command.intent === 'swap') {
        if (!command.fromToken)
            errors.push('Source token is required');
        if (!command.toToken)
            errors.push('Destination token is required');
        if (!command.amount)
            errors.push('Amount is required');
    }
    if (command.intent === 'price') {
        if (!command.fromToken)
            errors.push('Token symbol is required');
    }
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
}
function formatCommand(command) {
    switch (command.intent) {
        case 'swap':
            return "Swap ".concat(command.amount, " ").concat(command.fromToken, " for ").concat(command.toToken);
        case 'price':
            return "Get price of ".concat(command.fromToken);
        case 'balance':
            return "Check balance of ".concat(command.fromToken || 'all tokens');
        case 'portfolio':
            return 'Show portfolio overview';
        default:
            return command.rawInput;
    }
}
function getExampleCommands() {
    return {
        swap: [
            'Swap 100 USDC for HEX',
            'Trade 50 PLS to USDT',
            'Exchange 0.5 WETH for PLSX',
        ],
        price: [
            'What\'s the price of HEX?',
            'PLS price',
            'How much is PLSX worth?',
        ],
        balance: [
            'What\'s my HEX balance?',
            'Check my USDC',
            'My PLS balance',
        ],
        portfolio: [
            'Show my portfolio',
            'Total assets',
            'Net worth',
        ],
    };
}
