#!/usr/bin/env node

/**
 * ElizaOS DEX Agent - Global Multi-Platform Entry Point
 * 
 * This is the MAIN entry point that works with ALL ElizaOS platforms:
 * - Telegram (native ElizaOS client)
 * - Discord (native ElizaOS client) 
 * - Web (native ElizaOS client)
 * - Terminal (for testing)
 * 
 * Uses proper ElizaOS patterns with fixed database connectivity.
 */

import { AgentRuntime } from '@elizaos/core';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { PostgresDatabaseAdapter } from '@elizaos/adapter-postgres';
import { elizaLogger } from '@elizaos/core';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import { WalletService } from './src/services/walletService.js';
import { DatabaseService } from './src/services/databaseService.js';
import { actions } from './src/actions/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Extended runtime interface for our services
export interface ExtendedRuntime extends AgentRuntime {
    customServices?: {
        database: DatabaseService;
        wallet: WalletService;
    };
}

/**
 * Global ElizaOS Agent Configuration
 * This creates a runtime that works with ALL ElizaOS clients
 */
export async function createGlobalElizaOSRuntime(): Promise<ExtendedRuntime> {
    try {
        elizaLogger.info('🚀 Creating Global ElizaOS Runtime...');

        // Load character
        const characterPath = path.join(__dirname, 'characters/dex-master.character.json');
        let character;
        
        try {
            character = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
            elizaLogger.info(`👤 Loaded character: ${character.name}`);
        } catch (error) {
            elizaLogger.error('❌ Failed to load character file:', error);
            throw new Error(`Character file not found: ${characterPath}`);
        }

        // Database setup - PostgreSQL or SQLite
        let databaseAdapter: any;
        if (process.env.POSTGRES_URL) {
            elizaLogger.info('🗄️ Using PostgreSQL database (Production)');
            databaseAdapter = new PostgresDatabaseAdapter({
                connectionString: process.env.POSTGRES_URL,
            });
        } else {
            elizaLogger.info('🗄️ Using SQLite database (Development)');
            const dataDir = process.env.SQLITE_DATA_DIR || './data';
            const dbPath = path.join(dataDir, 'elizaos_dex.db');
            
            // Ensure data directory exists
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            
            elizaLogger.info(`📊 Database: ${dbPath}`);
            const sqliteDb = new Database(dbPath);
            databaseAdapter = new SqliteDatabaseAdapter(sqliteDb);
        }

        // Create runtime
        const runtime = new AgentRuntime({
            character,
            adapter: databaseAdapter,
        }) as ExtendedRuntime;

        elizaLogger.info('✅ ElizaOS Runtime created');

        // Initialize our services with proper error handling
        try {
            const databaseService = new DatabaseService(runtime as any);
            await databaseService.initializeDatabase();
            elizaLogger.info('📊 Database service initialized');

            const walletService = new WalletService(runtime as any);
            await walletService.initializeDatabase();
            elizaLogger.info('💼 Wallet service initialized');

            // Attach services to runtime for action access
            runtime.customServices = {
                database: databaseService,
                wallet: walletService
            };
            elizaLogger.info('🔗 Services attached to runtime');
        } catch (error) {
            elizaLogger.error('❌ Failed to initialize services:', error);
            throw error;
        }

        // Load all actions
        const actionList = await actions();
        elizaLogger.info(`🎯 Loaded ${actionList.length} trading actions`);

        // Actions are automatically available through the runtime
        elizaLogger.info('📝 Actions loaded and ready for use');

        elizaLogger.info('🎉 Global ElizaOS Runtime created successfully!');
        
        return runtime;

    } catch (error) {
        elizaLogger.error('💥 Failed to create Global ElizaOS Runtime:', error);
        throw error;
    }
}

/**
 * Main entry point for ElizaOS DEX Agent
 * This can be used by ANY ElizaOS client (Telegram, Discord, Web, etc.)
 */
export async function startGlobalElizaOSAgent() {
    try {
        const runtime = await createGlobalElizaOSRuntime();
        
        elizaLogger.info('🌐 Global ElizaOS DEX Agent Runtime Ready!');
        elizaLogger.info('🔥 This runtime can be used by:');
        elizaLogger.info('  📱 Telegram: elizaos start --characters=characters/dex-master.character.json --client=telegram');
        elizaLogger.info('  💬 Discord: elizaos start --characters=characters/dex-master.character.json --client=discord');
        elizaLogger.info('  🌐 Web: elizaos start --characters=characters/dex-master.character.json --client=web');
        elizaLogger.info('  🖥️ Terminal: elizaos start --characters=characters/dex-master.character.json --client=terminal');
        
        return runtime;
        
    } catch (error) {
        elizaLogger.error('💥 Failed to start Global ElizaOS Agent:', error);
        process.exit(1);
    }
}

// If this file is run directly, start the agent
if (import.meta.url === `file://${process.argv[1]}`) {
    startGlobalElizaOSAgent().catch((error) => {
        elizaLogger.error('💥 Fatal error:', error);
        process.exit(1);
    });
} 