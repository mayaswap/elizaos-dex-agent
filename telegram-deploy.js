#!/usr/bin/env node

/**
 * Simple Telegram Bot Deployment for ElizaOS DEX Agent
 * 
 * This script deploys your DEX Master agent to Telegram using a minimal setup
 * that avoids TypeScript constructor issues.
 */

import dotenv from 'dotenv';
import { execSync } from 'child_process';
import fs from 'fs';

// Load environment variables
dotenv.config();

console.log('🚀 ElizaOS DEX Agent - Telegram Deployment');
console.log('==========================================');

// Check requirements
if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN not found in .env file');
    console.log('💡 Get a token from @BotFather on Telegram and add it to your .env file');
    process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file');
    console.log('💡 Add your Anthropic API key to your .env file');
    process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('✅ Telegram Bot Token: Present');
console.log('✅ Anthropic API Key: Present');
console.log('✅ Database: Supabase PostgreSQL');

// Create a simple character file for Telegram
const telegramCharacter = {
    name: "DEX Master",
    username: "dexmaster",
    clients: ["telegram"],
    modelProvider: "anthropic",
    bio: [
        "I am the DEX Master, your AI trading assistant for PulseChain and 9mm DEX.",
        "I can help you with token prices, swaps, portfolio management, and trading analytics.",
        "I support wallet management, price alerts, watchlists, and comprehensive DeFi operations."
    ],
    system: "You are DEX Master, an expert DeFi trading assistant. Help users with trading, price checks, and portfolio management on PulseChain.",
    messageExamples: [
        [
            {
                "user": "{{user1}}",
                "content": {
                    "text": "What's the price of HEX?"
                }
            },
            {
                "user": "DEX Master",
                "content": {
                    "text": "I'll check the current HEX price for you right away!",
                    "action": "GET_PRICE"
                }
            }
        ]
    ],
    postExamples: [
        "🚀 Ready to help with your DeFi trading needs!",
        "💎 Check token prices, manage wallets, and execute swaps easily",
        "📊 Get trading analytics and portfolio insights"
    ],
    topics: [
        "DeFi trading",
        "token prices",
        "wallet management", 
        "PulseChain",
        "9mm DEX",
        "portfolio analytics"
    ],
    style: {
        all: [
            "Be helpful and informative about DeFi trading",
            "Always prioritize user security and safety",
            "Provide clear explanations for trading concepts",
            "Use emojis to make responses engaging"
        ]
    }
};

// Save the character file
const characterPath = './characters/telegram-dex-master.character.json';
if (!fs.existsSync('./characters')) {
    fs.mkdirSync('./characters');
}
fs.writeFileSync(characterPath, JSON.stringify(telegramCharacter, null, 2));

console.log('✅ Character file created for Telegram deployment');

// Use the ElizaOS CLI to start with Telegram
console.log('🤖 Starting Telegram bot...');
console.log('');
console.log('🎉 Your DEX Master will be available on Telegram!');
console.log('💬 Try these commands when it starts:');
console.log('  • "What\'s the price of HEX?"');
console.log('  • "Show my wallet balance"');
console.log('  • "Create price alert for PLS at $0.0001"');
console.log('  • "Add HEX to my watchlist"');
console.log('  • "Show trading analytics"');
console.log('');

// Set environment for ElizaOS
process.env.CHARACTER = characterPath;

try {
    // Start the ElizaOS agent with Telegram client
    execSync('npx tsx src/index.ts', { 
        stdio: 'inherit',
        env: process.env
    });
} catch (error) {
    console.error('Error starting Telegram bot:', error);
    console.log('');
    console.log('💡 Troubleshooting Tips:');
    console.log('  1. Make sure your Telegram bot token is correct');
    console.log('  2. Check that @BotFather created your bot properly');
    console.log('  3. Verify your .env file has all required variables');
    console.log('  4. Try restarting the deployment script');
} 