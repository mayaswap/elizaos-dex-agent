/**
 * ElizaOS Database Adapter Wrapper
 * 
 * This fixes all database connectivity issues by providing a unified interface
 * that works with both PostgreSQL and SQLite adapters from ElizaOS.
 */

import { elizaLogger } from '@elizaos/core';

// Unified query result interface
export interface QueryResult {
    rows: any[];
    rowCount: number;
}

// Unified database adapter interface
export interface UnifiedDatabaseAdapter {
    query(sql: string, params?: any[]): Promise<QueryResult>;
    execute(sql: string): Promise<void>;
    close?(): Promise<void>;
}

/**
 * Wraps ElizaOS database adapters to provide consistent interface
 */
export class ElizaOSDatabaseAdapter implements UnifiedDatabaseAdapter {
    private adapter: any;
    private isPostgreSQL: boolean;

    constructor(elizaosAdapter: any) {
        this.adapter = elizaosAdapter;
        
        // Detect adapter type
        this.isPostgreSQL = this.detectAdapterType();
        
        elizaLogger.info(`🗄️ Database adapter initialized: ${this.isPostgreSQL ? 'PostgreSQL' : 'SQLite'}`);
    }

    private detectAdapterType(): boolean {
        // PostgreSQL adapter has query method directly
        if (typeof this.adapter.query === 'function') {
            return true;
        }
        
        // SQLite adapter has db.prepare method
        if (this.adapter.db && typeof this.adapter.db.prepare === 'function') {
            return false;
        }
        
        throw new Error('Unknown database adapter type');
    }

    private convertSQLForSQLite(sql: string, params: any[] = []): { sql: string; params: any[] } {
        if (this.isPostgreSQL) {
            return { sql, params };
        }
        
        // Convert PostgreSQL $1, $2, etc. to SQLite ?
        let convertedSQL = sql;
        let paramIndex = 1;
        
        while (convertedSQL.includes(`$${paramIndex}`)) {
            convertedSQL = convertedSQL.replace(`$${paramIndex}`, '?');
            paramIndex++;
        }
        
        return { sql: convertedSQL, params };
    }

    async query(sql: string, params: any[] = []): Promise<QueryResult> {
        try {
            if (this.isPostgreSQL) {
                // PostgreSQL adapter
                const result = await this.adapter.query(sql, params);
                return {
                    rows: result.rows || result,
                    rowCount: result.rowCount || (result.rows ? result.rows.length : 0)
                };
            } else {
                // SQLite adapter
                const { sql: convertedSQL, params: convertedParams } = this.convertSQLForSQLite(sql, params);
                const stmt = this.adapter.db.prepare(convertedSQL);
                const rows = convertedParams.length > 0 ? stmt.all(...convertedParams) : stmt.all();
                
                return {
                    rows: rows || [],
                    rowCount: rows ? rows.length : 0
                };
            }
        } catch (error) {
            elizaLogger.error(`Database query error: ${error.message}`);
            elizaLogger.error(`SQL: ${sql}`);
            elizaLogger.error(`Params:`, params);
            throw error;
        }
    }

    async execute(sql: string): Promise<void> {
        try {
            if (this.isPostgreSQL) {
                // PostgreSQL adapter
                await this.adapter.query(sql);
            } else {
                // SQLite adapter
                this.adapter.db.exec(sql);
            }
        } catch (error) {
            elizaLogger.error(`Database execute error: ${error.message}`);
            elizaLogger.error(`SQL: ${sql}`);
            throw error;
        }
    }

    async insert(sql: string, params: any[] = []): Promise<{ insertId?: string; changes: number }> {
        try {
            if (this.isPostgreSQL) {
                // PostgreSQL adapter
                const result = await this.adapter.query(sql, params);
                return {
                    changes: result.rowCount || 0,
                    insertId: result.rows?.[0]?.id
                };
            } else {
                // SQLite adapter
                const { sql: convertedSQL, params: convertedParams } = this.convertSQLForSQLite(sql, params);
                const stmt = this.adapter.db.prepare(convertedSQL);
                const result = convertedParams.length > 0 ? stmt.run(...convertedParams) : stmt.run();
                
                return {
                    changes: result.changes || 0,
                    insertId: result.lastInsertRowid?.toString()
                };
            }
        } catch (error) {
            elizaLogger.error(`Database insert error: ${error.message}`);
            throw error;
        }
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        if (this.isPostgreSQL) {
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
        } else {
            // SQLite transactions
            const transaction = this.adapter.db.transaction(fn);
            return transaction();
        }
    }

    // Helper method to get a single row
    async queryOne(sql: string, params: any[] = []): Promise<any | null> {
        const result = await this.query(sql, params);
        return result.rows[0] || null;
    }

    // Helper method for simple updates
    async update(sql: string, params: any[] = []): Promise<number> {
        const result = await this.insert(sql, params);
        return result.changes;
    }
}

/**
 * Factory function to create the unified adapter from ElizaOS runtime
 */
export function createDatabaseAdapter(runtime: any): ElizaOSDatabaseAdapter {
    const adapter = runtime.adapter || runtime.databaseAdapter;
    
    if (!adapter) {
        throw new Error('No database adapter found in runtime');
    }
    
    return new ElizaOSDatabaseAdapter(adapter);
} 