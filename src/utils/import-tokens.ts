import { elizaLogger } from '@elizaos/core';
import Database from 'better-sqlite3';
import { DatabaseService } from '../services/databaseService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize a simple runtime object with database adapter
const initializeRuntime = () => {
    const dbPath = process.env.DB_PATH || './data/db.sqlite';
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const db = new Database(dbPath);
    
    return {
        databaseAdapter: {
            db
        }
    };
};

async function importTokens() {
    elizaLogger.info('🚀 Starting token import process...');
    
    try {
        // Initialize runtime and database service
        const runtime = initializeRuntime();
        const databaseService = new DatabaseService(runtime as any);
        
        // Initialize database schema
        await databaseService.initializeDatabase();
        elizaLogger.info('✅ Database initialized');
        
        // Read the token list JSON file
        const tokenListPath = path.join(__dirname, '../../data/token-list-100.json');
        const tokenData = JSON.parse(fs.readFileSync(tokenListPath, 'utf-8'));
        
        elizaLogger.info(`📋 Found ${tokenData.tokens.length} tokens to import`);
        
        // Import tokens
        const imported = await databaseService.importTokensFromJson(tokenData.tokens);
        
        elizaLogger.info(`✨ Successfully imported ${imported} tokens into the database`);
        
        // Verify by querying some tokens
        const hex = await databaseService.getToken('HEX');
        const pls = await databaseService.getToken('PLS');
        const ninemm = await databaseService.getToken('9MM');
        
        elizaLogger.info('📊 Sample verification:');
        if (hex) elizaLogger.info(`  - HEX: ${hex.name} (${hex.address})`);
        if (pls) elizaLogger.info(`  - PLS: ${pls.name} (${pls.address})`);
        if (ninemm) elizaLogger.info(`  - 9MM: ${ninemm.name} (${ninemm.address})`);
        
        // Test search functionality
        const searchResults = await databaseService.searchTokens('pulse');
        elizaLogger.info(`🔍 Search for "pulse" returned ${searchResults.length} results`);
        
        // Close database connection
        runtime.databaseAdapter.db.close();
        
    } catch (error) {
        elizaLogger.error('❌ Error importing tokens:', error);
        process.exit(1);
    }
    
    process.exit(0);
}

// Run the import
importTokens().catch((error) => {
    elizaLogger.error('Fatal error:', error);
    process.exit(1);
}); 