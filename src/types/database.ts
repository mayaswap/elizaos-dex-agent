/**
 * Database type definitions
 */

export interface DatabaseRow {
    [key: string]: string | number | boolean | null | Date;
}

export interface QueryResult {
    rows: DatabaseRow[];
    rowCount: number;
}

export interface DatabaseAdapter {
    query(sql: string, params?: (string | number | boolean | null)[]): Promise<QueryResult>;
    execute(sql: string): Promise<void>;
    close?(): Promise<void>;
}

export interface PostgreSQLAdapter {
    query(sql: string, params?: (string | number | boolean | null)[]): Promise<{
        rows: DatabaseRow[];
        rowCount: number;
    }>;
}

export interface SQLiteAdapter {
    db: {
        prepare(sql: string): {
            run(...params: (string | number | boolean | null)[]): {
                changes: number;
                lastInsertRowid?: number;
            };
            all(...params: (string | number | boolean | null)[]): DatabaseRow[];
            get(...params: (string | number | boolean | null)[]): DatabaseRow | undefined;
        };
        exec(sql: string): void;
        transaction?: (fn: () => any) => any;
    };
}

export type ElizaOSAdapter = PostgreSQLAdapter | SQLiteAdapter;

/**
 * Type guards
 */
export function isPostgreSQLAdapter(adapter: ElizaOSAdapter): adapter is PostgreSQLAdapter {
    return 'query' in adapter && typeof adapter.query === 'function';
}

export function isSQLiteAdapter(adapter: ElizaOSAdapter): adapter is SQLiteAdapter {
    return 'db' in adapter && adapter.db && typeof adapter.db.prepare === 'function';
}