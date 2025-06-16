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
exports.smartParser = exports.SmartParser = void 0;
exports.parseCommand = parseCommand;
var ai_parser_js_1 = require("./ai-parser.js");
var parser_js_1 = require("./parser.js");
/**
 * Smart Parser - AI-first with regex fallback
 * Uses AI for natural language understanding, falls back to regex if needed
 */
var SmartParser = /** @class */ (function () {
    function SmartParser() {
        this.aiParser = ai_parser_js_1.AIParser.getInstance();
    }
    SmartParser.getInstance = function () {
        if (!SmartParser.instance) {
            SmartParser.instance = new SmartParser();
        }
        return SmartParser.instance;
    };
    /**
     * Parse command using AI-first approach with regex fallback
     */
    SmartParser.prototype.parseCommand = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, aiResult, error_1, regexResult, oldestKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = SmartParser.parseCache.get(input);
                        if (cached && Date.now() - cached.timestamp < SmartParser.CACHE_DURATION) {
                            console.log("\uD83D\uDCCB Using cached result for \"".concat(input, "\""));
                            return [2 /*return*/, cached.result];
                        }
                        if (!this.aiParser.isAvailable()) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, ai_parser_js_1.parseWithAI)(input)];
                    case 2:
                        aiResult = _a.sent();
                        // If AI is confident, use its result
                        if (aiResult.confidence >= 0.7) {
                            console.log("\uD83E\uDD16 Using AI parsing: \"".concat(input, "\" \u2192 ").concat(aiResult.intent, " (").concat((aiResult.confidence * 100).toFixed(0), "%)"));
                            // Cache the AI result
                            SmartParser.parseCache.set(input, { result: aiResult, timestamp: Date.now() });
                            return [2 /*return*/, aiResult];
                        }
                        // If AI confidence is very low (0.05), it's likely general conversation - skip retries
                        if (aiResult.confidence <= 0.1) {
                            console.log("\uD83E\uDD16 AI detected general conversation - skipping retries");
                            return [2 /*return*/, aiResult];
                        }
                        // If AI is moderately uncertain, try regex fallback
                        console.log("\uD83E\uDD16 AI uncertain (".concat((aiResult.confidence * 100).toFixed(0), "%), trying regex fallback..."));
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.log("\uD83E\uDD16 AI parsing failed, falling back to regex:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, (0, parser_js_1.parseCommand)(input)];
                    case 5:
                        regexResult = _a.sent();
                        console.log("\uD83D\uDCDD Using regex parsing: \"".concat(input, "\" \u2192 ").concat(regexResult.intent, " (").concat((regexResult.confidence * 100).toFixed(0), "%)"));
                        // Cache the result
                        SmartParser.parseCache.set(input, { result: regexResult, timestamp: Date.now() });
                        // Keep cache size manageable
                        if (SmartParser.parseCache.size > 50) {
                            oldestKey = SmartParser.parseCache.keys().next().value;
                            SmartParser.parseCache.delete(oldestKey);
                        }
                        return [2 /*return*/, regexResult];
                }
            });
        });
    };
    /**
     * Check if AI parsing is available
     */
    SmartParser.prototype.isAIAvailable = function () {
        return this.aiParser.isAvailable();
    };
    /**
     * Simple cache to prevent multiple API calls for the same input
     */
    SmartParser.parseCache = new Map();
    SmartParser.CACHE_DURATION = 10000; // 10 seconds
    return SmartParser;
}());
exports.SmartParser = SmartParser;
/**
 * Convenience function for smart parsing
 */
function parseCommand(input) {
    return __awaiter(this, void 0, void 0, function () {
        var parser;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    parser = SmartParser.getInstance();
                    return [4 /*yield*/, parser.parseCommand(input)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
// Export the instance for direct access if needed
exports.smartParser = SmartParser.getInstance();
