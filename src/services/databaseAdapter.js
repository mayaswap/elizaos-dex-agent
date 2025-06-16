"use strict";
/**
 * ElizaOS Database Adapter Wrapper
 *
 * This fixes all database connectivity issues by providing a unified interface
 * that works with both PostgreSQL and SQLite adapters from ElizaOS.
 */
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
exports.ElizaOSDatabaseAdapter = void 0;
exports.createDatabaseAdapter = createDatabaseAdapter;
var core_1 = require("@elizaos/core");
/**
 * Wraps ElizaOS database adapters to provide consistent interface
 */
var ElizaOSDatabaseAdapter = /** @class */ (function () {
    function ElizaOSDatabaseAdapter(elizaosAdapter) {
        this.adapter = elizaosAdapter;
        // Detect adapter type
        this.isPostgreSQL = this.detectAdapterType();
        core_1.elizaLogger.info("\uD83D\uDDC4\uFE0F Database adapter initialized: ".concat(this.isPostgreSQL ? 'PostgreSQL' : 'SQLite'));
    }
    ElizaOSDatabaseAdapter.prototype.detectAdapterType = function () {
        // PostgreSQL adapter has query method directly
        if (typeof this.adapter.query === 'function') {
            return true;
        }
        // SQLite adapter has db.prepare method
        if (this.adapter.db && typeof this.adapter.db.prepare === 'function') {
            return false;
        }
        throw new Error('Unknown database adapter type');
    };
    ElizaOSDatabaseAdapter.prototype.convertSQLForSQLite = function (sql, params) {
        if (params === void 0) { params = []; }
        if (this.isPostgreSQL) {
            return { sql: sql, params: params };
        }
        // Convert PostgreSQL $1, $2, etc. to SQLite ?
        var convertedSQL = sql;
        var paramIndex = 1;
        while (convertedSQL.includes("$".concat(paramIndex))) {
            convertedSQL = convertedSQL.replace("$".concat(paramIndex), '?');
            paramIndex++;
        }
        return { sql: convertedSQL, params: params };
    };
    ElizaOSDatabaseAdapter.prototype.query = function (sql_1) {
        return __awaiter(this, arguments, void 0, function (sql, params) {
            var result, _a, convertedSQL, convertedParams, stmt, rows, error_1;
            if (params === void 0) { params = []; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 4, , 5]);
                        if (!this.isPostgreSQL) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.adapter.query(sql, params)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, {
                                rows: result.rows || result,
                                rowCount: result.rowCount || (result.rows ? result.rows.length : 0)
                            }];
                    case 2:
                        _a = this.convertSQLForSQLite(sql, params), convertedSQL = _a.sql, convertedParams = _a.params;
                        stmt = this.adapter.db.prepare(convertedSQL);
                        rows = convertedParams.length > 0 ? stmt.all.apply(stmt, convertedParams) : stmt.all();
                        return [2 /*return*/, {
                                rows: rows || [],
                                rowCount: rows ? rows.length : 0
                            }];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        core_1.elizaLogger.error("Database query error: ".concat(error_1.message));
                        core_1.elizaLogger.error("SQL: ".concat(sql));
                        core_1.elizaLogger.error("Params:", params);
                        throw error_1;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ElizaOSDatabaseAdapter.prototype.execute = function (sql) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        if (!this.isPostgreSQL) return [3 /*break*/, 2];
                        // PostgreSQL adapter
                        return [4 /*yield*/, this.adapter.query(sql)];
                    case 1:
                        // PostgreSQL adapter
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        // SQLite adapter
                        this.adapter.db.exec(sql);
                        _a.label = 3;
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        core_1.elizaLogger.error("Database execute error: ".concat(error_2.message));
                        core_1.elizaLogger.error("SQL: ".concat(sql));
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ElizaOSDatabaseAdapter.prototype.insert = function (sql_1) {
        return __awaiter(this, arguments, void 0, function (sql, params) {
            var result, _a, convertedSQL, convertedParams, stmt, result, error_3;
            var _b, _c, _d;
            if (params === void 0) { params = []; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 4, , 5]);
                        if (!this.isPostgreSQL) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.adapter.query(sql, params)];
                    case 1:
                        result = _e.sent();
                        return [2 /*return*/, {
                                changes: result.rowCount || 0,
                                insertId: (_c = (_b = result.rows) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.id
                            }];
                    case 2:
                        _a = this.convertSQLForSQLite(sql, params), convertedSQL = _a.sql, convertedParams = _a.params;
                        stmt = this.adapter.db.prepare(convertedSQL);
                        result = convertedParams.length > 0 ? stmt.run.apply(stmt, convertedParams) : stmt.run();
                        return [2 /*return*/, {
                                changes: result.changes || 0,
                                insertId: (_d = result.lastInsertRowid) === null || _d === void 0 ? void 0 : _d.toString()
                            }];
                    case 3: return [3 /*break*/, 5];
                    case 4:
                        error_3 = _e.sent();
                        core_1.elizaLogger.error("Database insert error: ".concat(error_3.message));
                        throw error_3;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    ElizaOSDatabaseAdapter.prototype.transaction = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4, transaction;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isPostgreSQL) return [3 /*break*/, 8];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 7]);
                        return [4 /*yield*/, this.adapter.query('BEGIN')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, fn()];
                    case 3:
                        result = _a.sent();
                        return [4 /*yield*/, this.adapter.query('COMMIT')];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 5:
                        error_4 = _a.sent();
                        return [4 /*yield*/, this.adapter.query('ROLLBACK')];
                    case 6:
                        _a.sent();
                        throw error_4;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        transaction = this.adapter.db.transaction(fn);
                        return [2 /*return*/, transaction()];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    // Helper method to get a single row
    ElizaOSDatabaseAdapter.prototype.queryOne = function (sql_1) {
        return __awaiter(this, arguments, void 0, function (sql, params) {
            var result;
            if (params === void 0) { params = []; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.query(sql, params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.rows[0] || null];
                }
            });
        });
    };
    // Helper method for simple updates
    ElizaOSDatabaseAdapter.prototype.update = function (sql_1) {
        return __awaiter(this, arguments, void 0, function (sql, params) {
            var result;
            if (params === void 0) { params = []; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.insert(sql, params)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.changes];
                }
            });
        });
    };
    return ElizaOSDatabaseAdapter;
}());
exports.ElizaOSDatabaseAdapter = ElizaOSDatabaseAdapter;
/**
 * Factory function to create the unified adapter from ElizaOS runtime
 */
function createDatabaseAdapter(runtime) {
    var adapter = runtime.adapter || runtime.databaseAdapter;
    if (!adapter) {
        throw new Error('No database adapter found in runtime');
    }
    return new ElizaOSDatabaseAdapter(adapter);
}
