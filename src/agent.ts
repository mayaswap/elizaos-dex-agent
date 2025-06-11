import {
    AgentRuntime,
    CacheManager,
    DbCacheAdapter,
    elizaLogger,
    FsCacheAdapter,
    Character,
    defaultCharacter,
    ModelProviderName,
} from "@elizaos/core";
import { TelegramClientInterface } from "@elizaos/client-telegram";
import { PostgresDatabaseAdapter } from "@elizaos/adapter-postgres";
import { SqliteDatabaseAdapter } from "@elizaos/adapter-sqlite";
import { bootstrapPlugin } from "@elizaos/plugin-bootstrap";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

// Import our actions
import { actions } from "./actions/index.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * ElizaOS DEX Trading Agent - Production Telegram Deployment
 * 
 * This is the production agent runner that starts the ElizaOS runtime
 * with proper Telegram integration using TelegramClientInterface.
 */

async function createAgent(): Promise<AgentRuntime> {
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
                ...defaultCharacter,
                name: "DEX Master",
                username: "dexmaster",
                bio: [
                    "I am the DEX Master, your AI trading assistant specialized in decentralized exchange operations.",
                    "I can help you with token swaps, price checks, portfolio management, and advanced trading strategies.",
                    "I support PulseChain and 9mm DEX with comprehensive analytics and wallet management."
                ],
                system: "You are DEX Master, an expert AI trading assistant. Help users with DeFi trading, token analysis, and portfolio management.",
                modelProvider: ModelProviderName.ANTHROPIC,
                settings: {
                    secrets: {},
                    voice: {
                        model: "en_US-hfc_female-medium"
                    }
                }
            };
        }

        // Validate required environment variables
        const requiredEnvVars = ['TELEGRAM_BOT_TOKEN'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
        }

        // Configure database adapter - Follow ElizaOS patterns
        let db;
        if (process.env.POSTGRES_URL) {
            elizaLogger.info("🗄️ Using PostgreSQL database (Supabase)");
            db = new PostgresDatabaseAdapter({
                connectionString: process.env.POSTGRES_URL,
            });
        } else {
            elizaLogger.info("🗄️ Using SQLite database (development)");
            const dataDir = process.env.SQLITE_DATA_DIR || "./data";
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }
            db = new SqliteDatabaseAdapter(path.join(dataDir, "elizaos.db"));
        }

        // Configure cache manager - Follow ElizaOS patterns
        let cache: CacheManager;
        if (db) {
            cache = new CacheManager(new DbCacheAdapter(db));
        } else {
            cache = new CacheManager(new FsCacheAdapter("./cache"));
        }

        // Get all actions
        const actionList = await actions();
        elizaLogger.info(`📊 Loaded ${actionList.length} trading actions`);

        // Create agent runtime - Follow ElizaOS architecture
        const runtime = new AgentRuntime({
            databaseAdapter: db,
            token: process.env.TELEGRAM_BOT_TOKEN!,
            modelProvider: ModelProviderName.ANTHROPIC, // Use Anthropic as primary
            character,
            plugins: [
                bootstrapPlugin,
            ],
            providers: [],
            actions: actionList,
            services: [],
            managers: [],
            cacheManager: cache,
        });

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

        // Create the agent runtime
        const runtime = await createAgent();

        // Create Telegram client - Follow official ElizaOS pattern
        elizaLogger.info("🔧 Creating TelegramClientInterface...");
        elizaLogger.info(`📱 Bot Token: ${process.env.TELEGRAM_BOT_TOKEN ? 'Present' : 'Missing'}`);
        
        const telegramClient = new TelegramClientInterface(runtime, process.env.TELEGRAM_BOT_TOKEN!);

        elizaLogger.info("✅ Telegram client created");

        // Start the client - ElizaOS standard pattern
        elizaLogger.info("🚀 Starting Telegram client...");
        await telegramClient.start();

        elizaLogger.info("🎉 DEX Trading Agent is live on Telegram!");
        elizaLogger.info("📱 Bot is ready to receive commands");
        elizaLogger.info("💡 Try sending: 'What's the price of HEX?'");

        // Log available commands
        elizaLogger.info("🎯 Available Commands:");
        elizaLogger.info("  • Price checks: 'HEX price', 'What's PLS worth?'");
        elizaLogger.info("  • Wallet: 'show balance', 'create wallet'");
        elizaLogger.info("  • Trading: 'swap 100 PLS for HEX'");
        elizaLogger.info("  • Analytics: 'show trading history'");
        elizaLogger.info("  • Alerts: 'create price alert for PLS at $0.0001'");

        // Graceful shutdown handling
        process.on('SIGINT', async () => {
            elizaLogger.info("🛑 Shutting down Telegram bot...");
            await telegramClient.stop();
            process.exit(0);
        });

        process.on('SIGTERM', async () => {
            elizaLogger.info("🛑 Received SIGTERM, shutting down gracefully...");
            await telegramClient.stop();
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