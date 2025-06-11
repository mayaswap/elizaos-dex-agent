#!/usr/bin/env node

import { AgentRuntime } from '@elizaos/core';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { TelegramClientInterface } from '@elizaos/client-telegram';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WalletService } from './services/walletService.js';
import { DatabaseService } from './services/databaseService.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startElizaOSAgent() {
    try {
        console.log('🚀 Starting ElizaOS DEX Agent...');

        // Load character
        const characterPath = path.join(__dirname, '../characters/dex-master.character.json');
        const character = JSON.parse(fs.readFileSync(characterPath, 'utf8'));

        // Database setup
        const dataDir = process.env.SQLITE_DATA_DIR || './data';
        const dbPath = path.join(dataDir, 'elizaos_dex.db');
        
        // Ensure data directory exists
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        const databaseAdapter = new SqliteDatabaseAdapter(dbPath);

        // Create runtime
        const runtime = new AgentRuntime({
            token: process.env.ANTHROPIC_API_KEY!,
            character,
            databaseAdapter,
        });

        console.log('✅ ElizaOS Runtime created');

        // Initialize our services
        const databaseService = new DatabaseService(runtime);
        await databaseService.initializeDatabase();
        console.log('📊 Database service initialized');

        const walletService = new WalletService(runtime);
        await walletService.initializeDatabase();
        console.log('💼 Wallet service initialized');

        // Setup Telegram client
        if (process.env.TELEGRAM_BOT_TOKEN) {
            const telegramClient = new TelegramClientInterface();
            await telegramClient.start(runtime);
            console.log('📱 Telegram client started');
        }

        console.log('🎯 ElizaOS DEX Agent is now running!');
        console.log('💬 Telegram Bot: @ninemmmbot');
        console.log('🔧 All 22 trading actions loaded');
        console.log('💼 Real wallet system active');
        console.log('📊 Database persistence enabled');

        // Keep the process running
        process.on('SIGINT', async () => {
            console.log('\n🛑 Gracefully shutting down...');
            await runtime.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Gracefully shutting down...');
            await runtime.stop();
            process.exit(0);
        });

    } catch (error) {
        console.error('❌ Failed to start ElizaOS Agent:', error);
        process.exit(1);
    }
}

// Start the agent
startElizaOSAgent().catch(console.error); 