/**
 * ElizaOS Database Adapter Wrapper
 * 
 * This fixes all database connectivity issues by providing a unified interface
 * that works with both PostgreSQL and SQLite adapters from ElizaOS.
 */

import { elizaLogger, IAgentRuntime } from '@elizaos/core';
import { 
    DatabaseRow, 
    QueryResult, 
    DatabaseAdapter, 
    ElizaOSAdapter,
    isPostgreSQLAdapter,
    isSQLiteAdapter 
} from '../types/database.js';
import { IExtendedRuntime } from '../types/extended.js';

// Re-export for convenience
export type { QueryResult, DatabaseRow } from '../types/database.js';

/**
 * Wraps ElizaOS database adapters to provide consistent interface
 */
export class ElizaOSDatabaseAdapter implements DatabaseAdapter {
    private adapter: ElizaOSAdapter;
    private isPostgreSQL: boolean;

    constructor(elizaosAdapter: ElizaOSAdapter) {
        this.adapter = elizaosAdapter;
        
        // Detect adapter type
        this.isPostgreSQL = this.detectAdapterType();
        
        elizaLogger.info(`🗄️ Database adapter initialized: ${this.isPostgreSQL ? 'PostgreSQL' : 'SQLite'}`);
    }

    private detectAdapterType(): boolean {
        if (isPostgreSQLAdapter(this.adapter)) {
            return true;
        }
        
        if (isSQLiteAdapter(this.adapter)) {
            return false;
        }
        
        throw new Error('Unknown database adapter type');
    }

    /**
     * Convert PostgreSQL parameterized queries to SQLite format
     * PostgreSQL: $1, $2, $3...
     * SQLite: ?, ?, ?...
     */
    private convertSQLForSQLite(sql: string, params: (string | number | boolean | null)[] = []): { sql: string; params: (string | number | boolean | null)[] } {
        let convertedSQL = sql;
        
        // Replace $1, $2, etc. with ?
        for (let i = params.length; i >= 1; i--) {
            convertedSQL = convertedSQL.replace(new RegExp(`\\$${i}`, 'g'), '?');
        }
        
        return { sql: convertedSQL, params };
    }

    async query(sql: string, params: (string | number | boolean | null)[] = []): Promise<QueryResult> {
        try {
            if (isPostgreSQLAdapter(this.adapter)) {
                // PostgreSQL adapter
                const result = await this.adapter.query(sql, params);
                return {
                    rows: result.rows || [],
                    rowCount: result.rowCount || (result.rows ? result.rows.length : 0)
                };
            } else if (isSQLiteAdapter(this.adapter)) {
                // SQLite adapter
                const { sql: convertedSQL, params: convertedParams } = this.convertSQLForSQLite(sql, params);
                const stmt = this.adapter.db.prepare(convertedSQL);
                const rows = convertedParams.length > 0 ? stmt.all(...convertedParams) : stmt.all();
                
                return {
                    rows: rows || [],
                    rowCount: rows ? rows.length : 0
                };
            } else {
                throw new Error('Unknown adapter type');
            }
        } catch (error) {
            const err = error as Error;
            elizaLogger.error(`Database query error: ${err.message}`);
            elizaLogger.error(`SQL: ${sql}`);
            elizaLogger.error(`Params:`, params);
            throw error;
        }
    }

    async execute(sql: string): Promise<void> {
        try {
            if (isPostgreSQLAdapter(this.adapter)) {
                // PostgreSQL adapter
                await this.adapter.query(sql);
            } else if (isSQLiteAdapter(this.adapter)) {
                // SQLite adapter
                this.adapter.db.exec(sql);
            } else {
                throw new Error('Unknown adapter type');
            }
        } catch (error) {
            const err = error as Error;
            elizaLogger.error(`Database execute error: ${err.message}`);
            elizaLogger.error(`SQL: ${sql}`);
            throw error;
        }
    }

    async insert(sql: string, params: (string | number | boolean | null)[] = []): Promise<{ insertId?: string; changes: number }> {
        try {
            if (isPostgreSQLAdapter(this.adapter)) {
                // PostgreSQL adapter
                const result = await this.adapter.query(sql, params);
                return {
                    changes: result.rowCount || 0,
                    insertId: result.rows?.[0]?.id as string | undefined
                };
            } else if (isSQLiteAdapter(this.adapter)) {
                // SQLite adapter
                const { sql: convertedSQL, params: convertedParams } = this.convertSQLForSQLite(sql, params);
                const stmt = this.adapter.db.prepare(convertedSQL);
                const result = convertedParams.length > 0 ? stmt.run(...convertedParams) : stmt.run();
                
                return {
                    changes: result.changes || 0,
                    insertId: result.lastInsertRowid?.toString()
                };
            } else {
                throw new Error('Unknown adapter type');
            }
        } catch (error) {
            const err = error as Error;
            elizaLogger.error(`Database insert error: ${err.message}`);
            throw error;
        }
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        if (isPostgreSQLAdapter(this.adapter)) {
            // PostgreSQL transactions
            try {
                await this.adapter.query('BEGIN');
                const result = await fn();
                await this.adapter.query('COMMIT');
                return result;
            } catch (error) {
                await this.adapter.query('ROLLBACK');
                throw error;
            }
        } else if (isSQLiteAdapter(this.adapter)) {
            // SQLite transactions
            if (this.adapter.db.transaction) {
                const transaction = this.adapter.db.transaction(fn);
                return transaction();
            } else {
                // Fallback for SQLite without transaction support
                return fn();
            }
        } else {
            throw new Error('Unknown adapter type');
        }
    }

    // Helper method to get a single row
    async queryOne(sql: string, params: (string | number | boolean | null)[] = []): Promise<DatabaseRow | null> {
        const result = await this.query(sql, params);
        return result.rows[0] || null;
    }

    // Helper method for simple updates
    async update(sql: string, params: (string | number | boolean | null)[] = []): Promise<number> {
        const result = await this.insert(sql, params);
        return result.changes;
    }

    async close(): Promise<void> {
        // Most ElizaOS adapters don't expose close methods
        elizaLogger.info("Database adapter close requested (no-op for ElizaOS adapters)");
    }
}

/**
 * Factory function to create the appropriate database adapter
 */
export function createDatabaseAdapter(runtime: IAgentRuntime): ElizaOSDatabaseAdapter {
    const adapter = (runtime as any).databaseAdapter || (runtime as any).adapter;
    
    if (!adapter) {
        throw new Error('No database adapter found in runtime');
    }

    return new ElizaOSDatabaseAdapter(adapter as ElizaOSAdapter);
}

// Export the factory function as default as well
export default createDatabaseAdapter;