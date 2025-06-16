import {
    AgentRuntime,
    elizaLogger,
    Character,
} from "@elizaos/core";
import { TelegramClientInterface } from "@elizaos/client-telegram";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

// Import our actions and services
import { actions } from "./actions/index.js";
import { WalletService } from './services/walletService.js';
import { DatabaseService } from './services/databaseService.js';

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

/**
 * ElizaOS DEX Trading Agent - Production Telegram Deployment
 * 
 * This is the production agent runner that starts the ElizaOS runtime
 * with proper Telegram integration using TelegramClientInterface.
 */

async function createAgent(): Promise<ExtendedRuntime> {
    elizaLogger.info("🚀 Starting ElizaOS DEX Trading Agent - Production Deployment");

    try {
        // Load character configuration
        const characterPath = path.join(__dirname, "../characters/dex-master.character.json");
        
        let character: Character;
        try {
            if (fs.existsSync(characterPath)) {
                const characterData = JSON.parse(fs.readFileSync(characterPath, "utf8"));
                character = characterData;
                elizaLogger.info(`✅ Loaded character: ${character.name}`);
            } else {
                elizaLogger.warn("Character file not found, using default character");
                throw new Error("Character file not found");
            }
        } catch (error) {
            elizaLogger.warn("Failed to load character file, using default");
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
                    secrets: {
                        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
                    },
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
            } as Character;
        }

        // Validate required environment variables
        const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Database setup - PostgreSQL or SQLite
        let databaseAdapter: any;
        if (process.env.POSTGRES_URL) {
            elizaLogger.info('🗄️ Using PostgreSQL database (Supabase)');
            databaseAdapter = new PostgresDatabaseAdapter({
                connectionString: process.env.POSTGRES_URL,
            });
        } else {
            elizaLogger.info('🗄️ Using SQLite database (development)');
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
            adapter: databaseAdapter as any,
            plugins: [
                bootstrapPlugin,
            ],
        }) as ExtendedRuntime;

        elizaLogger.info('✅ ElizaOS Runtime created');

        // Initialize our services
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

        // Get all actions
        const actionList = await actions();
        elizaLogger.info(`📊 Loaded ${actionList.length} trading actions`);

        elizaLogger.info("✅ Agent runtime created successfully");
        return runtime;

    } catch (error) {
        elizaLogger.error("❌ Failed to create agent:", error);
        throw error;
    }
}

async function startTelegramBot(): Promise<void> {
    try {
        elizaLogger.info("🤖 Starting Telegram bot with ElizaOS TelegramClientInterface...");

        // Create the agent runtime with database services
        const runtime = await createAgent();

        // Create Telegram client - Follow official ElizaOS pattern
        elizaLogger.info("🔧 Creating TelegramClientInterface...");
        elizaLogger.info(`📱 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing'}`);
        elizaLogger.info(`📱 Bot Token (first 20 chars): ${process.env.TELEGRAM_BOT_TOKEN?.substring(0, 20)}...`);
        
        const telegramClient = TelegramClientInterface;

        elizaLogger.info("✅ Telegram client created");

        // Start the client - ElizaOS standard pattern
        elizaLogger.info("🚀 Starting Telegram client...");
        await telegramClient.start(runtime as any);

        elizaLogger.info("🎉 DEX Trading Agent is live on Telegram!");
        elizaLogger.info("📱 Bot is ready to receive commands");
        elizaLogger.info("💡 Try sending: 'create new wallet'");

        // Log available commands
        elizaLogger.info("🎯 Available Commands:");
        elizaLogger.info("  • Wallet: 'create new wallet', 'list wallets'");
        elizaLogger.info("  • Price checks: 'price of HEX', 'What's PLS worth?'");
        elizaLogger.info("  • Trading: 'swap 100 PLS for HEX'");
        elizaLogger.info("  • Balance: 'show my balance'");
        elizaLogger.info("  • Analytics: 'show trading history'");

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            elizaLogger.info("🛑 Shutting down Telegram bot...");
            await telegramClient.stop(runtime as any);
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            elizaLogger.info("🛑 Received SIGTERM, shutting down gracefully...");
            await telegramClient.stop(runtime as any);
            process.exit(0);
        });

        // Keep the process alive
        process.on('uncaughtException', (error) => {
            elizaLogger.error("💥 Uncaught exception:", error);
        });

        process.on('unhandledRejection', (reason, promise) => {
            elizaLogger.error("💥 Unhandled rejection at:", promise, 'reason:', reason);
        });

    } catch (error) {
        elizaLogger.error("💥 Failed to start Telegram bot:", error);
        process.exit(1);
    }
}

// Start the bot if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startTelegramBot().catch((error) => {
        elizaLogger.error("💥 Fatal error:", error);
        process.exit(1);
    });
}

export { createAgent, startTelegramBot };
export default startTelegramBot; 