#!/usr/bin/env node

import { AgentRuntime } from '@elizaos/core';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import { PostgresDatabaseAdapter } from '@elizaos/adapter-postgres';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import readline from 'readline';
import { WalletService } from './services/walletService.js';
import { DatabaseService } from './services/databaseService.js';
import { actions } from './actions/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service registry attached to runtime
export interface ExtendedRuntime extends AgentRuntime {
    customServices?: {
        database: DatabaseService;
        wallet: WalletService;
    };
}

class TerminalElizaOSAgent {
    private runtime: ExtendedRuntime;
    private actionList: any[];
    private rl: readline.Interface;

    async initialize() {
        try {
            console.log('🚀 Starting ElizaOS DEX Agent (Terminal Mode)...');

            // Load character
            const characterPath = path.join(__dirname, '../characters/dex-master.character.json');
            let character;
            
            try {
                character = JSON.parse(fs.readFileSync(characterPath, 'utf8'));
            } catch (error) {
                console.warn('Character file not found, using default character');
                character = {
                    name: "DEX Master",
                    username: "dexmaster",
                    bio: [
                        "I am the DEX Master, your AI trading assistant specialized in decentralized exchange operations.",
                        "I can help you with token swaps, price checks, portfolio management, and advanced trading strategies.",
                        "I support PulseChain and 9mm DEX with comprehensive analytics and wallet management."
                    ],
                    system: "You are DEX Master, an expert AI trading assistant. Help users with DeFi trading, token analysis, and portfolio management.",
                    settings: {
                        secrets: {},
                        voice: {
                            model: "en_US-hfc_female-medium"
                        }
                    },
                    lore: [],
                    messageExamples: [],
                    postExamples: [],
                    style: {
                        all: ["professional", "helpful", "technical"],
                        chat: ["friendly", "informative"],
                        post: ["analytical", "insightful"]
                    },
                    topics: ["defi", "trading", "cryptocurrency", "blockchain"]
                };
            }

            // Database setup - PostgreSQL or SQLite
            let databaseAdapter: any;
            if (process.env.POSTGRES_URL) {
                console.log('🗄️ Using PostgreSQL database (Supabase)');
                databaseAdapter = new PostgresDatabaseAdapter({
                    connectionString: process.env.POSTGRES_URL,
                });
            } else {
                console.log('🗄️ Using SQLite database (development)');
                const dataDir = process.env.SQLITE_DATA_DIR || './data';
                const dbPath = path.join(dataDir, 'elizaos_dex.db');
                
                // Ensure data directory exists
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }
                
                console.log(`📊 Database: ${dbPath}`);
                const sqliteDb = new Database(dbPath);
                databaseAdapter = new SqliteDatabaseAdapter(sqliteDb);
            }

            // Create runtime
            this.runtime = new AgentRuntime({
                character,
                adapter: databaseAdapter as any,
            }) as ExtendedRuntime;

            console.log('✅ ElizaOS Runtime created');

            // Initialize our services
            const databaseService = new DatabaseService(this.runtime as any);
            await databaseService.initializeDatabase();
            console.log('📊 Database service initialized');

            const walletService = new WalletService(this.runtime as any);
            await walletService.initializeDatabase();
            console.log('💼 Wallet service initialized');

            // Attach services to runtime for action access
            this.runtime.customServices = {
                database: databaseService,
                wallet: walletService
            };
            console.log('🔗 Services attached to runtime');

            // Load all actions
            this.actionList = await actions();
            console.log(`🎯 Loaded ${this.actionList.length} trading actions`);

            console.log('\n🎉 Terminal Agent initialized successfully!\n');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize agent:', error);
            return false;
        }
    }

    async processMessage(userInput: string): Promise<string> {
        try {
            // Create a mock memory object for the message
            const memory = {
                id: `msg_${Date.now()}`,
                userId: 'terminal:user',
                agentId: this.runtime.character.name,
                content: { text: userInput },
                roomId: 'terminal:room',
                createdAt: Date.now(),
                embedding: null
            };

            console.log(`\n📋 Processing: "${userInput}"`);

            // Try to match actions
            let matchedActions = [];
            for (const action of this.actionList) {
                try {
                    if (await action.validate(this.runtime, memory)) {
                        matchedActions.push(action);
                    }
                } catch (error) {
                    // Skip actions that fail validation
                }
            }

            if (matchedActions.length === 0) {
                return `❌ No matching actions found for: "${userInput}"

🎯 Available commands:
• "create new wallet" - Generate a new wallet
• "list wallets" - Show all wallets  
• "check price of HEX" - Get token prices
• "swap 100 USDC for HEX" - Execute token swaps
• "show my balance" - Check wallet balances
• "help" - Show all available commands`;
            }

            console.log(`✅ Found ${matchedActions.length} matching action(s): ${matchedActions.map(a => a.name).join(', ')}`);

            // Execute the first matching action
            const action = matchedActions[0];
            console.log(`🚀 Executing action: ${action.name}`);

            let result = '';
            
            // Execute the action with a callback to capture the response
            await action.handler(
                this.runtime,
                memory,
                undefined, // state
                {}, // options
                (response: any) => {
                    if (response && response.text) {
                        result = response.text;
                    }
                }
            );

            return result || '✅ Action completed successfully';

        } catch (error) {
            console.error('❌ Error processing message:', error);
            return `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }

    startTerminalInterface() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '🤖 DEX Master > '
        });

        console.log('🎯 ElizaOS DEX Agent Terminal Interface');
        console.log('═'.repeat(50));
        console.log('💡 Try these commands:');
        console.log('  • "create new wallet" - Generate a new wallet');
        console.log('  • "list wallets" - Show all your wallets');
        console.log('  • "check price of HEX" - Get token prices');
        console.log('  • "swap 100 USDC for HEX" - Execute swaps');
        console.log('  • "show my balance" - Check balances');
        console.log('  • "help" - Show all commands');
        console.log('  • "exit" - Quit the agent');
        console.log('═'.repeat(50));
        console.log();

        this.rl.prompt();

        this.rl.on('line', async (input) => {
            const trimmedInput = input.trim();
            
            if (trimmedInput.toLowerCase() === 'exit' || trimmedInput.toLowerCase() === 'quit') {
                console.log('\n👋 Goodbye! DEX Master signing off...');
                this.rl.close();
                process.exit(0);
            }

            if (trimmedInput === '') {
                this.rl.prompt();
                return;
            }

            try {
                const response = await this.processMessage(trimmedInput);
                console.log('\n📝 Response:');
                console.log(response);
                console.log('\n' + '─'.repeat(50));
            } catch (error) {
                console.error('\n❌ Error:', error);
                console.log('─'.repeat(50));
            }

            this.rl.prompt();
        });

        this.rl.on('close', () => {
            console.log('\n👋 DEX Master Terminal closed. See you next time!');
            process.exit(0);
        });

        // Handle graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n\n🛑 Shutting down DEX Master...');
            this.rl.close();
        });
    }
}

async function startTerminalAgent() {
    const agent = new TerminalElizaOSAgent();
    
    const initialized = await agent.initialize();
    if (!initialized) {
        console.error('❌ Failed to initialize agent');
        process.exit(1);
    }

    agent.startTerminalInterface();
}

// Start the terminal agent
startTerminalAgent().catch(console.error); 