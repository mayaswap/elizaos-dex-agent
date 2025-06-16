"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceMonitor = exports.PriceMonitorService = void 0;
var graphql_request_1 = require("graphql-request");
var events_1 = require("events");
var PriceMonitorService = /** @class */ (function (_super) {
    __extends(PriceMonitorService, _super);
    function PriceMonitorService() {
        var _this = _super.call(this) || this;
        _this.alerts = new Map();
        _this.priceCache = new Map();
        _this.monitoringInterval = null;
        _this.POLL_INTERVAL = 60000; // 1 minute
        _this.subgraphClient = new graphql_request_1.GraphQLClient("https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest");
        return _this;
    }
    /**
     * Add a price alert for monitoring
     */
    PriceMonitorService.prototype.addAlert = function (alert) {
        var id = "alert_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var fullAlert = __assign(__assign({}, alert), { id: id, created: new Date() });
        this.alerts.set(id, fullAlert);
        // Start monitoring if this is the first alert
        if (this.alerts.size === 1) {
            this.startMonitoring();
        }
        console.log("\uD83D\uDCCB Price alert added: ".concat(alert.token, " ").concat(alert.condition, " $").concat(alert.targetPrice));
        return id;
    };
    /**
     * Remove a price alert
     */
    PriceMonitorService.prototype.removeAlert = function (alertId) {
        var removed = this.alerts.delete(alertId);
        // Stop monitoring if no alerts remain
        if (this.alerts.size === 0) {
            this.stopMonitoring();
        }
        return removed;
    };
    /**
     * Get all active alerts
     */
    PriceMonitorService.prototype.getAlerts = function () {
        return Array.from(this.alerts.values());
    };
    /**
     * Start the monitoring service
     */
    PriceMonitorService.prototype.startMonitoring = function () {
        var _this = this;
        if (this.monitoringInterval)
            return;
        console.log('🚀 Starting price monitoring service...');
        this.monitoringInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkPrices()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        }); }, this.POLL_INTERVAL);
        // Initial check
        this.checkPrices();
    };
    /**
     * Stop the monitoring service
     */
    PriceMonitorService.prototype.stopMonitoring = function () {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            console.log('⏹️ Price monitoring service stopped');
        }
    };
    /**
     * Check current prices and trigger alerts
     */
    PriceMonitorService.prototype.checkPrices = function () {
        return __awaiter(this, void 0, void 0, function () {
            var uniqueTokens, _i, uniqueTokens_1, token, currentPrice, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        uniqueTokens = __spreadArray([], new Set(Array.from(this.alerts.values()).map(function (alert) { return alert.token; })), true);
                        _i = 0, uniqueTokens_1 = uniqueTokens;
                        _a.label = 1;
                    case 1:
                        if (!(_i < uniqueTokens_1.length)) return [3 /*break*/, 5];
                        token = uniqueTokens_1[_i];
                        return [4 /*yield*/, this.fetchTokenPrice(token)];
                    case 2:
                        currentPrice = _a.sent();
                        if (!(currentPrice !== null)) return [3 /*break*/, 4];
                        this.priceCache.set(token, currentPrice);
                        return [4 /*yield*/, this.checkAlertsForToken(token, currentPrice)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_1 = _a.sent();
                        console.error('Error checking prices:', error_1);
                        this.emit('error', error_1);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Fetch current price for a token from subgraph
     */
    PriceMonitorService.prototype.fetchTokenPrice = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAddresses, tokenAddress, query, result, priceInETH, ethPriceUSD, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        tokenAddresses = {
                            'HEX': '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
                            'PLS': '0x70499adEBB11Efd915E3b69E700c331778628707', // WPLS
                            'PLSX': '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
                            'USDC': '0x15D38573d2feeb82e7ad5187aB8c1D52'
                        };
                        tokenAddress = tokenAddresses[token];
                        if (!tokenAddress)
                            return [2 /*return*/, null];
                        query = (0, graphql_request_1.gql)(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n                query GetTokenPrice($tokenAddress: String!) {\n                    token(id: $tokenAddress) {\n                        derivedETH\n                        symbol\n                    }\n                    bundle(id: \"1\") {\n                        ethPriceUSD\n                    }\n                }\n            "], ["\n                query GetTokenPrice($tokenAddress: String!) {\n                    token(id: $tokenAddress) {\n                        derivedETH\n                        symbol\n                    }\n                    bundle(id: \"1\") {\n                        ethPriceUSD\n                    }\n                }\n            "])));
                        return [4 /*yield*/, this.subgraphClient.request(query, { tokenAddress: tokenAddress.toLowerCase() })];
                    case 1:
                        result = _a.sent();
                        if (result.token && result.bundle) {
                            priceInETH = parseFloat(result.token.derivedETH);
                            ethPriceUSD = parseFloat(result.bundle.ethPriceUSD);
                            return [2 /*return*/, priceInETH * ethPriceUSD];
                        }
                        return [2 /*return*/, null];
                    case 2:
                        error_2 = _a.sent();
                        console.error("Error fetching price for ".concat(token, ":"), error_2);
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check alerts for a specific token
     */
    PriceMonitorService.prototype.checkAlertsForToken = function (token, currentPrice) {
        return __awaiter(this, void 0, void 0, function () {
            var tokenAlerts, _i, tokenAlerts_1, alert_1, triggered, _a, _b, _c, id, alert_2;
            return __generator(this, function (_d) {
                tokenAlerts = Array.from(this.alerts.values()).filter(function (alert) {
                    return alert.token === token && alert.active;
                });
                for (_i = 0, tokenAlerts_1 = tokenAlerts; _i < tokenAlerts_1.length; _i++) {
                    alert_1 = tokenAlerts_1[_i];
                    triggered = false;
                    if (alert_1.condition === 'above' && currentPrice >= alert_1.targetPrice) {
                        triggered = true;
                    }
                    else if (alert_1.condition === 'below' && currentPrice <= alert_1.targetPrice) {
                        triggered = true;
                    }
                    if (triggered) {
                        console.log("\uD83D\uDEA8 PRICE ALERT TRIGGERED: ".concat(token, " ").concat(alert_1.condition, " $").concat(alert_1.targetPrice, " (current: $").concat(currentPrice.toFixed(6), ")"));
                        // Trigger the callback
                        try {
                            alert_1.callback(currentPrice);
                        }
                        catch (error) {
                            console.error('Error executing alert callback:', error);
                        }
                        // Emit event
                        this.emit('alertTriggered', {
                            alert: alert_1,
                            currentPrice: currentPrice,
                            triggeredAt: new Date()
                        });
                        // Deactivate the alert (one-time trigger)
                        alert_1.active = false;
                    }
                }
                // Clean up inactive alerts
                for (_a = 0, _b = this.alerts.entries(); _a < _b.length; _a++) {
                    _c = _b[_a], id = _c[0], alert_2 = _c[1];
                    if (!alert_2.active) {
                        this.alerts.delete(id);
                    }
                }
                // Stop monitoring if no active alerts
                if (this.alerts.size === 0) {
                    this.stopMonitoring();
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get cached price for a token
     */
    PriceMonitorService.prototype.getCachedPrice = function (token) {
        return this.priceCache.get(token) || null;
    };
    /**
     * Cleanup and stop monitoring
     */
    PriceMonitorService.prototype.destroy = function () {
        this.stopMonitoring();
        this.alerts.clear();
        this.priceCache.clear();
        this.removeAllListeners();
    };
    return PriceMonitorService;
}(events_1.EventEmitter));
exports.PriceMonitorService = PriceMonitorService;
// Global instance
exports.priceMonitor = new PriceMonitorService();
var templateObject_1;
// Example usage:
/*
priceMonitor.addAlert({
    token: 'HEX',
    targetPrice: 0.005,
    condition: 'below',
    active: true,
    callback: (price) => {
        console.log(`🔔 HEX hit $${price}! Time to buy!`);
        // Send notification, execute trade, etc.
    }
});
*/ 
