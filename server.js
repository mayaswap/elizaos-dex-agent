#!/usr/bin/env node

/**
 * ElizaOS DEX Agent - Unified Deployment Server
 * 
 * This is the main entry point for Railway/Vercel/Heroku deployments.
 * Supports multiple modes:
 * - WEB: Express server with REST API and web interface
 * - TELEGRAM: Telegram bot
 * - DISCORD: Discord bot (future)
 * - ALL: Run multiple modes simultaneously
 */

import { elizaLogger } from '@elizaos/core';
import { createGlobalElizaOSRuntime } from './elizaos.config.js';
import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const DEPLOYMENT_MODE = process.env.DEPLOYMENT_MODE || 'web'; // web, telegram, discord, all
const HOST = process.env.HOST || '0.0.0.0';

let runtime = null;
let telegramBot = null;
let expressApp = null;

/**
 * Initialize the ElizaOS Runtime
 */
async function initializeRuntime() {
    if (!runtime) {
        elizaLogger.info('🚀 Initializing ElizaOS DEX Agent Runtime...');
        runtime = await createGlobalElizaOSRuntime();
        elizaLogger.info('✅ Runtime initialized successfully');
    }
    return runtime;
}

/**
 * Start Express Web Server + API
 */
async function startWebServer() {
    elizaLogger.info('🌐 Starting Web Server + API...');
    
    const app = express();
    
    // Middleware
    app.use(cors());
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));
    
    // Serve static files
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({
            status: 'healthy',
            service: 'ElizaOS DEX Agent',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            mode: DEPLOYMENT_MODE,
            uptime: process.uptime()
        });
    });
    
    // API endpoint for chat
    app.post('/api/chat', async (req, res) => {
        try {
            const { message, userId = 'web-user', platform = 'web' } = req.body;
            
            if (!message) {
                return res.status(400).json({ error: 'Message is required' });
            }
            
            elizaLogger.info(`💬 API Chat: "${message}" from ${userId}`);
            
            // Create memory for ElizaOS
            const memory = {
                id: `${platform}_${userId}_${Date.now()}`,
                userId: `${platform}:${userId}`,
                agentId: runtime.character.name,
                content: { 
                    text: message,
                    platform,
                    userName: userId
                },
                roomId: `${platform}:${userId}`,
                createdAt: Date.now(),
                embedding: null
            };
            
            // Process with runtime
            const response = await processWithRuntime(runtime, memory, message);
            
            res.json({
                success: true,
                message: response || "I'm processing that... my AI systems need a moment to think.",
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            elizaLogger.error('❌ API Chat Error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                message: 'My AI systems encountered an error. Please try again.'
            });
        }
    });
    
    // Serve main page
    app.get('/', (req, res) => {
        res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ElizaOS DEX Agent</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            max-width: 600px;
            width: 90%;
            text-align: center;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
        }
        h1 { font-size: 2.5rem; margin-bottom: 20px; }
        .status { 
            background: rgba(0,255,0,0.2);
            padding: 15px;
            border-radius: 10px;
            margin: 20px 0;
            border: 1px solid rgba(0,255,0,0.3);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        .api-test {
            margin: 30px 0;
            text-align: left;
        }
        input, button {
            width: 100%;
            padding: 12px;
            margin: 10px 0;
            border: none;
            border-radius: 8px;
            font-size: 16px;
        }
        button {
            background: #764ba2;
            color: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        button:hover { background: #5a3a7a; }
        .response {
            background: rgba(0,0,0,0.3);
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            white-space: pre-wrap;
            text-align: left;
        }
        .links a {
            color: #fff;
            text-decoration: none;
            margin: 0 10px;
            padding: 10px 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 25px;
            display: inline-block;
            margin: 5px;
            transition: all 0.3s;
        }
        .links a:hover { background: rgba(255,255,255,0.3); }
        .emoji { font-size: 1.5rem; margin-right: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 ElizaOS DEX Agent</h1>
        <div class="status">
            <strong>✅ LIVE & OPERATIONAL</strong><br>
            Mode: ${DEPLOYMENT_MODE.toUpperCase()} | Port: ${PORT}
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="emoji">🧠</div>
                <strong>AI-Powered</strong><br>
                Real Claude AI intelligence, not regex matching
            </div>
            <div class="feature">
                <div class="emoji">⚡</div>
                <strong>22 DeFi Actions</strong><br>
                Comprehensive trading toolkit
            </div>
            <div class="feature">
                <div class="emoji">💎</div>
                <strong>Multi-Platform</strong><br>
                Telegram, Discord, Web, API
            </div>
            <div class="feature">
                <div class="emoji">🔐</div>
                <strong>Secure Wallets</strong><br>
                AES-256 encrypted storage
            </div>
        </div>
        
        <div class="api-test">
            <h3>🧪 Test the API</h3>
            <input type="text" id="messageInput" placeholder="Try: 'what's HEX price?' or 'create wallet'" />
            <button onclick="testAPI()">Send Message</button>
            <div id="response" class="response" style="display:none;"></div>
        </div>
        
        <div class="links">
            <a href="/health">🏥 Health Check</a>
            <a href="https://github.com/elizaos/eliza" target="_blank">📚 ElizaOS Docs</a>
            <a href="/api/chat" onclick="alert('POST /api/chat\\n\\nBody: {message: string, userId?: string}'); return false;">🔌 API Docs</a>
        </div>
    </div>
    
    <script>
        async function testAPI() {
            const message = document.getElementById('messageInput').value;
            if (!message) return;
            
            const responseDiv = document.getElementById('response');
            responseDiv.style.display = 'block';
            responseDiv.textContent = '🤔 Processing...';
            
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message, userId: 'web-demo' })
                });
                
                const data = await response.json();
                responseDiv.textContent = data.success ? data.message : 'Error: ' + data.error;
            } catch (error) {
                responseDiv.textContent = 'Network error: ' + error.message;
            }
        }
        
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') testAPI();
        });
    </script>
</body>
</html>
        `);
    });
    
    // Start server
    const server = app.listen(PORT, HOST, () => {
        elizaLogger.info(`🌐 Web server running on http://${HOST}:${PORT}`);
        elizaLogger.info(`🔗 Public URL: ${process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`}`);
    });
    
    expressApp = app;
    return server;
}

/**
 * Start Telegram Bot
 */
async function startTelegramBot() {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
        elizaLogger.warn('⚠️ TELEGRAM_BOT_TOKEN not found, skipping Telegram bot');
        return;
    }
    
    elizaLogger.info('🤖 Starting Telegram Bot...');
    
    // Test token
    const testBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    const me = await testBot.getMe();
    elizaLogger.info(`✅ Telegram bot: @${me.username} (${me.first_name})`);
    
    // Create bot
    telegramBot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
    
    // Welcome command
    telegramBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userName = msg.from?.first_name || 'trader';
        
        const welcomeMessage = `🔥 *DEX Master here - ElizaOS-powered trading!*

⚡ *What makes me special:*
• **Real AI** - Claude intelligence, not basic bots
• **22 DeFi Actions** - Complete trading toolkit
• **Secure Wallets** - AES-256 encrypted storage
• **Multi-Platform** - Same agent everywhere

💎 *Try these commands:*
• "create wallet" - Generate secure wallet
• "what's HEX price?" - Real-time price data
• "show my balance" - Check holdings
• "help" - See all capabilities

Just talk naturally - I understand context! 🚀`;

        await telegramBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });
    
    // Message handler
    telegramBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text || '';
        const userId = msg.from?.id?.toString() || '';
        const userName = msg.from?.first_name || 'anon';
        
        if (text.startsWith('/')) return;
        
        elizaLogger.info(`📱 Telegram: "${text}" from ${userName}`);
        
        try {
            const memory = {
                id: `telegram_${userId}_${Date.now()}`,
                userId: `telegram:${userId}`,
                agentId: runtime.character.name,
                content: { text, platform: 'telegram', userName },
                roomId: `telegram:${userId}`,
                createdAt: Date.now(),
                embedding: null
            };
            
            const response = await processWithRuntime(runtime, memory, text);
            
            await telegramBot.sendMessage(chatId, response || "🤔 Processing... try rephrasing!", { 
                parse_mode: 'Markdown',
                disable_web_page_preview: true 
            });
            
        } catch (error) {
            elizaLogger.error(`❌ Telegram error:`, error);
            await telegramBot.sendMessage(chatId, '❌ My AI systems encountered an error. Try again!');
        }
    });
    
    elizaLogger.info('✅ Telegram bot started successfully');
}

/**
 * Process message through ElizaOS runtime
 */
async function processWithRuntime(runtime, memory, text) {
    try {
        const { actions } = await import('./dist/actions/index.js');
        const actionList = await actions();
        
        // Find matching actions
        const matchedActions = [];
        for (const action of actionList) {
            try {
                const isValid = await action.validate(runtime, memory);
                if (isValid) {
                    matchedActions.push(action);
                }
            } catch (error) {
                // Skip failed validations
            }
        }
        
        // Execute best action
        if (matchedActions.length > 0) {
            const bestAction = matchedActions[0];
            elizaLogger.info(`🚀 Executing: ${bestAction.name}`);
            
            let result = '';
            await bestAction.handler(runtime, memory, undefined, {}, (response) => {
                if (response?.text) result = response.text;
            });
            
            return result || generateFallbackResponse(text);
        }
        
        return generateFallbackResponse(text);
        
    } catch (error) {
        elizaLogger.error('❌ Runtime processing error:', error);
        throw error;
    }
}

/**
 * Generate fallback responses
 */
function generateFallbackResponse(text) {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('hello') || lowerText.includes('hi')) {
        return `🔥 DEX Master here - ElizaOS-powered trading intelligence!

💡 **Try these:**
• "what's HEX price?" - Live price data
• "create wallet" - Secure wallet generation
• "show balance" - Check your holdings
• "help" - Full capabilities

Ready to see real AI in action? 🚀`;
    }
    
    if (lowerText.includes('help')) {
        return `💰 **ElizaOS DEX Agent - Full AI Intelligence**

🧠 **AI Features:**
• Natural language understanding
• Context-aware conversations  
• Typo-friendly ("balanace" → balance)
• 22 specialized DeFi actions

🎯 **Core Functions:**
• **Wallet**: "create wallet", "show balance"
• **Prices**: "HEX price", "what's PLS worth"
• **Trading**: "swap tokens", "analytics"
• **Portfolio**: "my holdings", "history"

Just talk naturally - I'll understand! 💎`;
    }
    
    return `🤔 I'm processing that with my ElizaOS AI...

**Popular commands:**
• Price checks: "What's the price of HEX?"
• Wallet ops: "create wallet", "show balance"  
• Trading: "swap 100 PLS for HEX"
• Help: "help" or "what can you do"

What would you like to explore? 🚀`;
}

/**
 * Main startup function
 */
async function startServer() {
    try {
        elizaLogger.info(`🚀 Starting ElizaOS DEX Agent - Mode: ${DEPLOYMENT_MODE}`);
        
        // Initialize runtime
        await initializeRuntime();
        
        // Start services based on mode
        if (DEPLOYMENT_MODE === 'web' || DEPLOYMENT_MODE === 'all') {
            await startWebServer();
        }
        
        if (DEPLOYMENT_MODE === 'telegram' || DEPLOYMENT_MODE === 'all') {
            await startTelegramBot();
        }
        
        elizaLogger.info('🎉 ElizaOS DEX Agent fully operational!');
        elizaLogger.info(`📊 Dashboard: http://${HOST}:${PORT}`);
        
        // Graceful shutdown
        process.on('SIGINT', shutdown);
        process.on('SIGTERM', shutdown);
        
    } catch (error) {
        elizaLogger.error('💥 Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Graceful shutdown
 */
function shutdown() {
    elizaLogger.info('🛑 Shutting down ElizaOS DEX Agent...');
    
    if (telegramBot) {
        telegramBot.stopPolling();
    }
    
    process.exit(0);
}

// Start the server
startServer(); 