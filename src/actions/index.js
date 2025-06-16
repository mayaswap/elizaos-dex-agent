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
exports.actions = exports.allActions = exports.walletAddressAction = exports.walletManagementAction = exports.startMonitoringAction = exports.advancedOrdersAction = exports.positionTrackingAction = exports.tokenAllowanceAction = exports.defiAnalyticsAction = exports.slippageManagementAction = exports.multiChainAction = exports.transactionHistoryAction = exports.gasPriceAction = exports.queryPoolsAction = exports.removeLiquidityAction = exports.addLiquidityAction = exports.walletAction = exports.portfolioAction = exports.balanceAction = exports.priceAction = exports.swapAction = void 0;
// Export all individual actions
var swap_js_1 = require("./swap.js");
Object.defineProperty(exports, "swapAction", { enumerable: true, get: function () { return swap_js_1.default; } });
var price_js_1 = require("./price.js");
Object.defineProperty(exports, "priceAction", { enumerable: true, get: function () { return price_js_1.default; } });
var balance_js_1 = require("./balance.js");
Object.defineProperty(exports, "balanceAction", { enumerable: true, get: function () { return balance_js_1.default; } });
var portfolio_js_1 = require("./portfolio.js");
Object.defineProperty(exports, "portfolioAction", { enumerable: true, get: function () { return portfolio_js_1.default; } });
var wallet_js_1 = require("./wallet.js");
Object.defineProperty(exports, "walletAction", { enumerable: true, get: function () { return wallet_js_1.default; } });
var addLiquidity_js_1 = require("./addLiquidity.js");
Object.defineProperty(exports, "addLiquidityAction", { enumerable: true, get: function () { return addLiquidity_js_1.default; } });
var removeLiquidity_js_1 = require("./removeLiquidity.js");
Object.defineProperty(exports, "removeLiquidityAction", { enumerable: true, get: function () { return removeLiquidity_js_1.default; } });
var queryPools_js_1 = require("./queryPools.js");
Object.defineProperty(exports, "queryPoolsAction", { enumerable: true, get: function () { return queryPools_js_1.default; } });
var gasPrice_js_1 = require("./gasPrice.js");
Object.defineProperty(exports, "gasPriceAction", { enumerable: true, get: function () { return gasPrice_js_1.default; } });
var transactionHistory_js_1 = require("./transactionHistory.js");
Object.defineProperty(exports, "transactionHistoryAction", { enumerable: true, get: function () { return transactionHistory_js_1.default; } });
var multiChain_js_1 = require("./multiChain.js");
Object.defineProperty(exports, "multiChainAction", { enumerable: true, get: function () { return multiChain_js_1.default; } });
var slippageManagement_js_1 = require("./slippageManagement.js");
Object.defineProperty(exports, "slippageManagementAction", { enumerable: true, get: function () { return slippageManagement_js_1.default; } });
var defiAnalytics_js_1 = require("./defiAnalytics.js");
Object.defineProperty(exports, "defiAnalyticsAction", { enumerable: true, get: function () { return defiAnalytics_js_1.default; } });
var tokenAllowance_js_1 = require("./tokenAllowance.js");
Object.defineProperty(exports, "tokenAllowanceAction", { enumerable: true, get: function () { return tokenAllowance_js_1.default; } });
var positionTracking_js_1 = require("./positionTracking.js");
Object.defineProperty(exports, "positionTrackingAction", { enumerable: true, get: function () { return positionTracking_js_1.default; } });
var advancedOrders_js_1 = require("./advancedOrders.js");
Object.defineProperty(exports, "advancedOrdersAction", { enumerable: true, get: function () { return advancedOrders_js_1.default; } });
var startMonitoring_js_1 = require("./startMonitoring.js");
Object.defineProperty(exports, "startMonitoringAction", { enumerable: true, get: function () { return startMonitoring_js_1.default; } });
var walletManagement_js_1 = require("./walletManagement.js");
Object.defineProperty(exports, "walletManagementAction", { enumerable: true, get: function () { return walletManagement_js_1.default; } });
var walletAddress_js_1 = require("./walletAddress.js");
Object.defineProperty(exports, "walletAddressAction", { enumerable: true, get: function () { return walletAddress_js_1.default; } });
// Export all actions as an array for easy registration with ElizaOS runtime
var allActions = function () { return __awaiter(void 0, void 0, void 0, function () {
    var swapAction, priceAction, balanceAction, portfolioAction, walletV2Action, addLiquidityAction, removeLiquidityAction, queryPoolsAction, gasPriceAction, transactionHistoryAction, multiChainAction, slippageManagementAction, defiAnalyticsAction, tokenAllowanceAction, positionTrackingAction, advancedOrdersAction, startMonitoringAction, tradingAnalyticsAction, priceAlertsAction, watchlistsAction, walletAddressAction;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, Promise.resolve().then(function () { return require('./swap.js'); })];
            case 1:
                swapAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./price.js'); })];
            case 2:
                priceAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./balance.js'); })];
            case 3:
                balanceAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./portfolio.js'); })];
            case 4:
                portfolioAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./walletV2.js'); })];
            case 5:
                walletV2Action = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./addLiquidity.js'); })];
            case 6:
                addLiquidityAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./removeLiquidity.js'); })];
            case 7:
                removeLiquidityAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./queryPools.js'); })];
            case 8:
                queryPoolsAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./gasPrice.js'); })];
            case 9:
                gasPriceAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./transactionHistory.js'); })];
            case 10:
                transactionHistoryAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./multiChain.js'); })];
            case 11:
                multiChainAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./slippageManagement.js'); })];
            case 12:
                slippageManagementAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./defiAnalytics.js'); })];
            case 13:
                defiAnalyticsAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./tokenAllowance.js'); })];
            case 14:
                tokenAllowanceAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./positionTracking.js'); })];
            case 15:
                positionTrackingAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./advancedOrders.js'); })];
            case 16:
                advancedOrdersAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./startMonitoring.js'); })];
            case 17:
                startMonitoringAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./tradingAnalytics.js'); })];
            case 18:
                tradingAnalyticsAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./priceAlerts.js'); })];
            case 19:
                priceAlertsAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./watchlists.js'); })];
            case 20:
                watchlistsAction = (_a.sent()).default;
                return [4 /*yield*/, Promise.resolve().then(function () { return require('./walletAddress.js'); })];
            case 21:
                walletAddressAction = (_a.sent()).default;
                return [2 /*return*/, [
                        // Wallet system - PRIORITIZED FIRST
                        walletV2Action, // Primary database-backed wallet system
                        // Trading actions
                        swapAction,
                        priceAction,
                        balanceAction,
                        portfolioAction,
                        addLiquidityAction,
                        removeLiquidityAction,
                        queryPoolsAction,
                        gasPriceAction,
                        transactionHistoryAction,
                        multiChainAction,
                        slippageManagementAction,
                        defiAnalyticsAction,
                        tokenAllowanceAction,
                        positionTrackingAction,
                        advancedOrdersAction,
                        startMonitoringAction,
                        // Display actions
                        walletAddressAction, // Wallet address display
                        // Analytics actions
                        tradingAnalyticsAction,
                        priceAlertsAction,
                        watchlistsAction
                    ]];
        }
    });
}); };
exports.allActions = allActions;
// For convenience - export as named export too
exports.actions = exports.allActions;
