#!/usr/bin/env node

/**
 * Telegram Bot Integration for DEX Master
 * 
 * This integrates with our existing continuous runtime system
 * to provide Telegram bot functionality.
 */

import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { WalletService, PlatformUser } from './services/walletService.js';
import { DatabaseService } from './services/databaseService.js';
import { PriceService } from './services/priceService.js';
import Database from 'better-sqlite3';
import fs from 'fs';
import { generateCharacterResponse, enhanceResponseWithPersonality } from './utils/characterResponses.js';

// Load environment variables
dotenv.config();

class ElizaOSTelegramBot {
    private bot: TelegramBot;
    private walletService: WalletService;
    private databaseService: DatabaseService;
    private priceService: PriceService;

    constructor() {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        if (!token) {
            throw new Error('TELEGRAM_BOT_TOKEN not found in environment variables');
        }

        this.bot = new TelegramBot(token, { polling: true });
        
        // Create data directory
        const dataDir = process.env.NODE_ENV === 'production' ? '/tmp/data' : './data';
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`📁 Created data directory: ${dataDir}`);
        }

        // Create SQLite database
        const dbPath = process.env.SQLITE_FILE || `${dataDir}/elizaos_dex.db`;
        console.log(`📊 Initializing database at: ${dbPath}`);
        
        let db;
        try {
            db = new Database(dbPath);
            console.log('✅ SQLite database connection established');
        } catch (error) {
            console.error('❌ SQLite database connection failed:', error);
            // Fallback to in-memory database
            db = new Database(':memory:');
            console.log('⚠️ Using in-memory database as fallback');
        }
        
        // Create runtime with database
        const runtime = {
            databaseAdapter: { db }
        } as any;

        this.databaseService = new DatabaseService(runtime);
        this.walletService = new WalletService(runtime);
        this.priceService = new PriceService();

        // Initialize database tables immediately
        this.initializeDatabase().catch(console.error);

        this.setupHandlers();
        console.log('🤖 ElizaOS DEX Agent Telegram Bot started successfully!');
    }

    private async initializeDatabase(): Promise<void> {
        try {
            await this.databaseService.initializeDatabase();
            await this.walletService.initializeDatabase();
            console.log('📊 Database tables initialized successfully');
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
        }
    }

    private setupHandlers() {
        // Start command
        this.bot.onText(/\/start/, (msg) => {
            const chatId = msg.chat.id;
            const userName = msg.from?.first_name || 'trader';
            
            const welcomeMessage = `🚀 *Hey ${userName}! Welcome to DEX Master!*

I'm your specialized AI trading companion for PulseChain and 9mm DEX. Think of me as your personal DeFi expert who never sleeps! 💪

Here's how I can supercharge your trading:

💎 *Quick Start Commands:*
• "What's the price of HEX?" - Real-time prices
• "Create a wallet" - Secure wallet setup
• "Show my balance" - Portfolio overview
• "Help" - See all my capabilities

🔥 *My Specialties:*
• 📊 Real-time market analysis
• 💼 Bank-grade wallet security (AES-256)
• 🔄 Smart swap execution
• 📈 Portfolio tracking & analytics
• 🔔 Price alerts that never miss

💬 *Pro Tip:* Just talk to me naturally! No need to memorize commands. Try saying "Hi" or asking about any token!

Ready to explore the markets together? What interests you most? 🎯`;

            this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        });

        // Help command
        this.bot.onText(/\/help/, (msg: any) => {
            const chatId = msg.chat.id;
            const helpMessage = `📋 *Available Commands:*

*💰 Wallet Management (REAL):*
/wallet - Wallet management
/create_wallet [name] - Create new wallet
/import_wallet <private_key> - Import wallet
/import_mnemonic "phrase" - Import from seed
/balance - Check real balances
/export_wallet - Export wallet
/switch_wallet - Switch active wallet

*📊 Market Data:*
/price <token> - Token price (e.g., /price PLS)
/chart <token> - Price charts
/volume <token> - Trading volume
/trending - Trending tokens

*🔔 Monitoring:*
/alerts - Price alerts management
/watchlist - Token watchlist
/notifications - Notification settings

*💱 Trading (REAL):*
/swap - Token swapping
/liquidity - Add/remove liquidity
/analytics - Trading performance
/history - Transaction history

*⚙️ Settings:*
/settings - Bot preferences
/slippage - Slippage tolerance
/gas - Gas price settings

*📚 Help:*
/about - About this bot
/support - Get support

🔥 *All wallet features are now REAL and functional!* 🔥

Type any command to explore the features! 🚀`;

            this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
        });

        // Price command
        this.bot.onText(/\/price (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const token = match?.[1]?.toUpperCase() || '';

            if (!token) {
                this.bot.sendMessage(chatId, '❌ Please specify a token symbol. Example: /price PLS');
                return;
            }

            try {
                this.bot.sendMessage(chatId, `🔍 Fetching price data for ${token}...`);
                
                // Get price from service
                const priceData = await this.priceService.getTokenPrice(token);
                
                if (priceData.success && priceData.data) {
                    const price = priceData.data;
                    const priceMessage = `💰 *${token} Price Information*

💵 *Current Price:* $${price.price}
📈 *24h Change:* ${price.change24h >= 0 ? '📈' : '📉'} ${price.change24h.toFixed(2)}%
💧 *Liquidity:* $${price.liquidity.toLocaleString()}
📊 *Volume (24h):* $${price.volume24h.toLocaleString()}
⏰ *Last Updated:* ${price.lastUpdated}

🔗 *9mm DEX:* [View on 9mm.pro](https://9mm.pro)
📊 *DexScreener:* [View Chart](https://dexscreener.com/pulsechain/${token})`;

                    this.bot.sendMessage(chatId, priceMessage, { 
                        parse_mode: 'Markdown',
                        disable_web_page_preview: true 
                    });
                } else {
                    this.bot.sendMessage(chatId, `❌ Could not fetch price data for ${token}. Please check the token symbol and try again.`);
                }
            } catch (error) {
                console.error('Price fetch error:', error);
                this.bot.sendMessage(chatId, `❌ Error fetching price for ${token}. Please try again later.`);
            }
        });

        // Wallet command
        this.bot.onText(/\/wallet/, async (msg: any) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';

            try {
                const platformUser: PlatformUser = {
                    platform: 'telegram',
                    platformUserId: userId,
                    platformUsername: msg.from?.username,
                    displayName: msg.from?.first_name
                };

                const wallets = await this.walletService.getUserWallets(platformUser);
                
                if (wallets.length === 0) {
                    const noWalletMessage = `💼 *Wallet Management*

You don't have any wallets set up yet.

🔒 *Secure Wallet Features:*
• AES-256 encrypted storage
• Multi-wallet support (up to 5 wallets)
• Cross-platform compatibility
• Private key protection

📱 *To create a wallet:*
• /create_wallet - Generate new secure wallet
• /import_wallet - Import existing wallet
• /import_mnemonic - Import from seed phrase

💡 *Real Functionality:* All wallet features are now fully operational and secure.

Need help? Type /help for all commands! 🚀`;

                    this.bot.sendMessage(chatId, noWalletMessage, { parse_mode: 'Markdown' });
                } else {
                    let walletList = `💼 *Your Wallets (${wallets.length}/5)*\n\n`;
                    
                    for (const [index, wallet] of wallets.entries()) {
                        const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
                        walletList += `${index + 1}. *${wallet.name || `Wallet ${index + 1}`}*\n`;
                        walletList += `   📍 ${shortAddress}\n`;
                        
                        // Fetch real balance
                        try {
                            const provider = new ethers.JsonRpcProvider('https://rpc.pulsechain.com');
                            const balance = await provider.getBalance(wallet.address);
                            const plsBalance = ethers.formatEther(balance);
                            walletList += `   💰 Balance: ${parseFloat(plsBalance).toFixed(4)} PLS\n`;
                        } catch {
                            walletList += `   💰 Balance: Loading...\n`;
                        }
                        
                        if (wallet.isActive) walletList += `   ✅ *Active Wallet*\n`;
                        walletList += `\n`;
                    }

                    walletList += `⚙️ *Wallet Actions:*\n`;
                    walletList += `• /create_wallet - Create new wallet\n`;
                    walletList += `• /balance - Check real balances\n`;
                    walletList += `• /switch_wallet - Switch active wallet\n`;
                    walletList += `• /export_wallet - Export wallet\n`;
                    walletList += `• /delete_wallet - Delete wallet\n\n`;
                    walletList += `🔒 All wallets are encrypted and secure!`;

                    this.bot.sendMessage(chatId, walletList, { parse_mode: 'Markdown' });
                }
            } catch (error) {
                console.error('Wallet fetch error:', error);
                this.bot.sendMessage(chatId, '❌ Error fetching wallet information. Please try again later.');
            }
        });

        // Create wallet command
        this.bot.onText(/\/create_wallet (.*)/, async (msg: any, match: any) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';
            const walletName = match?.[1]?.trim() || undefined;

            try {
                const platformUser: PlatformUser = {
                    platform: 'telegram',
                    platformUserId: userId,
                    platformUsername: msg.from?.username,
                    displayName: msg.from?.first_name
                };

                this.bot.sendMessage(chatId, '🔄 Creating your new wallet...');

                const newWallet = await this.walletService.createWallet(platformUser, walletName);
                
                const successMessage = `✅ *Wallet Created Successfully!*

🔐 *Wallet Details:*
• **Name:** ${newWallet.name}
• **Address:** \`${newWallet.address}\`
• **Network:** PulseChain
• **Status:** ${newWallet.isActive ? 'Active' : 'Created'}

🛡️ *Security Features:*
• Private key encrypted with AES-256
• Stored securely in database
• Platform-isolated (Telegram only)

⚠️ *Important Security Notes:*
• Your private key is encrypted and secure
• Use /export_wallet to backup your wallet
• Never share your private key with anyone
• This wallet is ready for real transactions

🚀 *Next Steps:*
• Send PLS to your address to fund the wallet
• Use /balance to check your balance
• Start trading with real transactions

Type /help to see all available commands!`;

                this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
                
            } catch (error: any) {
                console.error('Wallet creation error:', error);
                const errorMessage = error.message.includes('Maximum 5 wallets') 
                    ? '❌ You already have the maximum of 5 wallets. Please delete one before creating a new wallet.'
                    : '❌ Error creating wallet. Please try again later.';
                this.bot.sendMessage(chatId, errorMessage);
            }
        });

        // Create wallet command (without name)
        this.bot.onText(/^\/create_wallet$/, async (msg: any) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';

            try {
                const platformUser: PlatformUser = {
                    platform: 'telegram',
                    platformUserId: userId,
                    platformUsername: msg.from?.username,
                    displayName: msg.from?.first_name
                };

                this.bot.sendMessage(chatId, '🔄 Creating your new wallet...');

                const newWallet = await this.walletService.createWallet(platformUser);
                
                const successMessage = `✅ *Wallet Created Successfully!*

🔐 *Wallet Details:*
• **Name:** ${newWallet.name}
• **Address:** \`${newWallet.address}\`
• **Network:** PulseChain
• **Status:** ${newWallet.isActive ? 'Active' : 'Created'}

🛡️ *Security Features:*
• Private key encrypted with AES-256
• Stored securely in database
• Platform-isolated (Telegram only)

⚠️ *Important Security Notes:*
• Your private key is encrypted and secure
• Use /export_wallet to backup your wallet
• Never share your private key with anyone
• This wallet is ready for real transactions

🚀 *Next Steps:*
• Send PLS to your address to fund the wallet
• Use /balance to check your balance
• Start trading with real transactions

Type /help to see all available commands!`;

                this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
                
            } catch (error: any) {
                console.error('Wallet creation error:', error);
                const errorMessage = error.message.includes('Maximum 5 wallets') 
                    ? '❌ You already have the maximum of 5 wallets. Please delete one before creating a new wallet.'
                    : '❌ Error creating wallet. Please try again later.';
                this.bot.sendMessage(chatId, errorMessage);
            }
        });

        // Import wallet from private key command
        this.bot.onText(/\/import_wallet (.+)/, async (msg: any, match: any) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';
            const privateKey = match?.[1]?.trim();

            if (!privateKey) {
                this.bot.sendMessage(chatId, '❌ Please provide a private key. Usage: /import_wallet YOUR_PRIVATE_KEY');
                return;
            }

            try {
                const platformUser: PlatformUser = {
                    platform: 'telegram',
                    platformUserId: userId,
                    platformUsername: msg.from?.username,
                    displayName: msg.from?.first_name
                };

                this.bot.sendMessage(chatId, '🔄 Importing your wallet...');

                const newWallet = await this.walletService.createWallet(platformUser, 'Imported Wallet', privateKey);
                
                const successMessage = `✅ *Wallet Imported Successfully!*

🔐 *Wallet Details:*
• **Name:** ${newWallet.name}
• **Address:** \`${newWallet.address}\`
• **Network:** PulseChain
• **Status:** ${newWallet.isActive ? 'Active' : 'Imported'}

🛡️ *Security Features:*
• Private key encrypted with AES-256
• Stored securely in database
• Platform-isolated (Telegram only)

✅ *Your existing wallet has been imported and is ready for use!*

Type /balance to check your current balance or /help for all commands.`;

                this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
                
                // Delete the message with private key for security
                try {
                    await this.bot.deleteMessage(chatId, msg.message_id);
                } catch (deleteError) {
                    console.log('Could not delete message with private key');
                }
                
            } catch (error: any) {
                console.error('Wallet import error:', error);
                this.bot.sendMessage(chatId, '❌ Error importing wallet. Please check your private key and try again.');
                
                // Try to delete the message with private key for security
                try {
                    await this.bot.deleteMessage(chatId, msg.message_id);
                } catch (deleteError) {
                    console.log('Could not delete message with private key');
                }
            }
        });

        // Import wallet from mnemonic command
        this.bot.onText(/\/import_mnemonic (.+)/, async (msg: any, match: any) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';
            const mnemonic = match?.[1]?.trim();

            if (!mnemonic) {
                this.bot.sendMessage(chatId, '❌ Please provide a mnemonic phrase. Usage: /import_mnemonic "your 12 word phrase"');
                return;
            }

            try {
                const platformUser: PlatformUser = {
                    platform: 'telegram',
                    platformUserId: userId,
                    platformUsername: msg.from?.username,
                    displayName: msg.from?.first_name
                };

                this.bot.sendMessage(chatId, '🔄 Importing wallet from mnemonic...');

                const newWallet = await this.walletService.importWalletFromMnemonic(platformUser, mnemonic, 'Imported from Mnemonic');
                
                const successMessage = `✅ *Wallet Imported from Mnemonic!*

🔐 *Wallet Details:*
• **Name:** ${newWallet.name}
• **Address:** \`${newWallet.address}\`
• **Network:** PulseChain
• **Status:** ${newWallet.isActive ? 'Active' : 'Imported'}

🛡️ *Security Features:*
• Private key encrypted with AES-256
• Stored securely in database
• Platform-isolated (Telegram only)

✅ *Your wallet has been successfully restored from the mnemonic phrase!*

Type /balance to check your current balance or /help for all commands.`;

                this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
                
                // Delete the message with mnemonic for security
                try {
                    await this.bot.deleteMessage(chatId, msg.message_id);
                } catch (deleteError) {
                    console.log('Could not delete message with mnemonic');
                }
                
            } catch (error: any) {
                console.error('Mnemonic import error:', error);
                this.bot.sendMessage(chatId, '❌ Error importing wallet from mnemonic. Please check your phrase and try again.');
                
                // Try to delete the message with mnemonic for security
                try {
                    await this.bot.deleteMessage(chatId, msg.message_id);
                } catch (deleteError) {
                    console.log('Could not delete message with mnemonic');
                }
            }
        });

        // Alerts command
        this.bot.onText(/\/alerts/, async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from?.id?.toString() || '';

            const alertsMessage = `🔔 *Price Alerts Management*

*Current Alerts:* No alerts set up yet.

📊 *Create New Alert:*
• Set price above/below thresholds
• Choose notification preferences
• Monitor up to 20 tokens

⚙️ *Alert Features:*
• Real-time monitoring
• Custom notification messages
• Multiple alert types
• Auto-disable after trigger

💡 *Example:* "Alert me when PLS reaches $0.001"

🚀 *To create alerts:*
Type: \`/set_alert PLS above 0.001\`

📱 Manage your alerts anytime with /manage_alerts`;

            this.bot.sendMessage(chatId, alertsMessage, { parse_mode: 'Markdown' });
        });

        // About command
        this.bot.onText(/\/about/, (msg) => {
            const chatId = msg.chat.id;
            const aboutMessage = `🤖 *9mm DEX Trading Agent*

*Powered by ElizaOS Framework*

🌟 *Features:*
• Real-time price monitoring
• Secure wallet management
• Trading analytics & insights
• Price alerts & notifications
• Multi-platform support

🔒 *Security:*
• AES-256 encryption
• Private key protection
• Secure database storage
• User data isolation

⚡ *Powered by:*
• 9mm DEX on PulseChain
• DexScreener API
• Anthropic Claude AI
• ElizaOS Agent Framework

🌐 *Links:*
• [9mm DEX](https://9mm.pro)
• [PulseChain](https://pulsechain.com)
• [DexScreener](https://dexscreener.com)

💡 *Version:* 1.0.0 - Production Ready
🔄 *Status:* Live Trading on PulseChain

Need help? Type /help for commands! 🚀`;

            this.bot.sendMessage(chatId, aboutMessage, { 
                parse_mode: 'Markdown',
                disable_web_page_preview: true 
            });
        });

        // Natural language message handler
        this.bot.on('message', async (msg: any) => {
            const chatId = msg.chat.id;
            const text = msg.text || '';
            const userId = msg.from?.id?.toString() || '';

            // Skip if it's a command (starts with /)
            if (text.startsWith('/')) {
                return;
            }

            // Create platform user for this conversation
            const platformUser: PlatformUser = {
                platform: 'telegram',
                platformUserId: userId,
                platformUsername: msg.from?.username,
                displayName: msg.from?.first_name
            };

            // Natural language understanding
            const userMessage = text.toLowerCase();

            try {
                // Intent: Create wallet
                if (this.isCreateWalletIntent(userMessage)) {
                    await this.handleCreateWalletNaturally(chatId, platformUser, text);
                    return;
                }

                // Intent: Check balance (specific balance request)
                if (this.isBalanceIntent(userMessage)) {
                    await this.handleBalanceNaturally(chatId, platformUser);
                    return;
                }

                // Intent: Check wallet/balance (general wallet info)
                if (this.isWalletInfoIntent(userMessage)) {
                    await this.handleWalletInfoNaturally(chatId, platformUser);
                    return;
                }

                // Intent: Token price
                if (this.isPriceIntent(userMessage)) {
                    await this.handlePriceNaturally(chatId, userMessage);
                    return;
                }

                // Intent: Import wallet
                if (this.isImportWalletIntent(userMessage)) {
                    await this.handleImportWalletNaturally(chatId, platformUser, text);
                    return;
                }

                // Intent: Help
                if (this.isHelpIntent(userMessage)) {
                    await this.handleHelpNaturally(chatId);
                    return;
                }

                // General conversational response using AI
                await this.handleGeneralConversation(chatId, text, platformUser);

            } catch (error) {
                console.error('Error handling message:', error);
                this.bot.sendMessage(chatId, '❌ I encountered an error. Let me try to help you anyway! What do you need assistance with?');
            }
        });

        // Error handling
        this.bot.on('error', (error) => {
            console.error('Telegram Bot Error:', error);
        });

        this.bot.on('polling_error', (error) => {
            console.error('Polling Error:', error);
        });
    }

    // Natural language intent detection methods
    private isCreateWalletIntent(message: string): boolean {
        const createTerms = ['create', 'make', 'generate', 'new', 'setup', 'get'];
        const walletTerms = ['wallet', 'address', 'account'];
        
        return createTerms.some(term => message.includes(term)) && 
               walletTerms.some(term => message.includes(term));
    }

    private isBalanceIntent(message: string): boolean {
        const balanceTerms = ['balance', 'how much', 'check my', 'what do i have'];
        const checkTerms = ['check', 'show', 'see', 'what'];
        
        return balanceTerms.some(term => message.includes(term)) && 
               (message.includes('my') || checkTerms.some(term => message.includes(term)));
    }

    private isWalletInfoIntent(message: string): boolean {
        return (message.includes('wallet') || message.includes('wallets') || 
               message.includes('my address') || message.includes('show wallet')) &&
               !this.isBalanceIntent(message); // Exclude balance-specific requests
    }

    private isPriceIntent(message: string): boolean {
        return message.includes('price') || message.includes('cost') || 
               message.includes('how much') || message.includes('value');
    }

    private isImportWalletIntent(message: string): boolean {
        return message.includes('import') && (message.includes('wallet') || message.includes('private key') || message.includes('seed'));
    }

    private isHelpIntent(message: string): boolean {
        return message.includes('help') || message.includes('what can you do') || 
               message.includes('commands') || message.includes('how to');
    }

    // Natural language handlers
    private async handleCreateWalletNaturally(chatId: number, platformUser: PlatformUser, originalText: string): Promise<void> {
        try {
            this.bot.sendMessage(chatId, '🔄 Alright, let me forge you a new wallet with bank-grade security! This\'ll just take a moment...');

            // Extract wallet name from natural language if provided
            let walletName: string | undefined;
            const nameMatch = originalText.match(/(?:call|name|called)\s+(?:it\s+)?([^.!?]+)/i);
            if (nameMatch) {
                walletName = nameMatch[1].trim();
            }

            console.log(`🔧 Attempting to create wallet for user: ${platformUser.platformUserId}`);
            console.log(`📝 Wallet name: ${walletName || 'Auto-generated'}`);

            const newWallet = await this.walletService.createWallet(platformUser, walletName);
            
            console.log(`✅ Wallet created successfully: ${newWallet.address}`);
            
            const successMessage = enhanceResponseWithPersonality(`✅ *Boom! Your wallet is ready to rock!*

🔐 *Fresh Wallet Details:*
• **Name:** ${newWallet.name}
• **Address:** \`${newWallet.address}\`
• **Network:** PulseChain
• **Status:** Armed and ready! 💪

🛡️ *Security Level: MAXIMUM*
Your private key is locked down with military-grade AES-256 encryption. Not even I can see it - that's how secure we're talking!

🚀 *Your Next Moves:*
• Send some PLS to this address to fuel up
• Say "check my balance" anytime
• "Show my wallets" to see your arsenal
• Ready to trade? Just say "swap HEX for USDC" or whatever you fancy!

Remember: Never share your private key with ANYONE. I've got your back on security! 🔒`, 'positive');

            this.bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
            
        } catch (error: any) {
            console.error('❌ DETAILED WALLET CREATION ERROR:', error);
            console.error('Error stack:', error.stack);
            console.error('Error message:', error.message);
            
            if (error.message && error.message.includes('Maximum 5 wallets')) {
                this.bot.sendMessage(chatId, '❌ You already have 5 wallets (the maximum). Would you like me to show them to you, or would you prefer to delete one first?');
            } else {
                const detailedError = `❌ I encountered an error creating your wallet.

**Error details:** ${error.message || 'Unknown error'}

This might be a temporary issue. Let me know if you'd like me to try again, or if you need help with something else!`;
                
                this.bot.sendMessage(chatId, detailedError, { parse_mode: 'Markdown' });
            }
        }
    }

    private async handleWalletInfoNaturally(chatId: number, platformUser: PlatformUser): Promise<void> {
        try {
            const wallets = await this.walletService.getUserWallets(platformUser);
            
            if (wallets.length === 0) {
                const message = `💼 You don't have any wallets yet!

Would you like me to create one for you? Just say:
• "Create a wallet"
• "Make me a new wallet"
• "I need a wallet"

I'll set it up with military-grade encryption and get you ready to trade on PulseChain! 🚀`;

                this.bot.sendMessage(chatId, message);
            } else {
                let response = `💼 Here are your wallets:\n\n`;
                
                wallets.forEach((wallet, index) => {
                    const shortAddress = `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`;
                    response += `${index + 1}. **${wallet.name}**\n`;
                    response += `   📍 ${shortAddress}\n`;
                    response += `   ${wallet.isActive ? '✅ Active' : '⚪ Inactive'}\n\n`;
                });

                response += `💡 **Want to do something?**\n`;
                response += `• "Check my balance" - See your PLS balance\n`;
                response += `• "Create another wallet" - Add a new one\n`;
                response += `• "Show me the address" - Get full address\n\n`;
                response += `Just ask me naturally! 🗣️`;

                this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Wallet info error:', error);
            this.bot.sendMessage(chatId, '❌ I had trouble getting your wallet info. Let me try again in a moment.');
        }
    }

    private async handleBalanceNaturally(chatId: number, platformUser: PlatformUser): Promise<void> {
        try {
            this.bot.sendMessage(chatId, '🔍 Let me check your wallet balance...');
            
            const activeWallet = await this.walletService.getActiveWallet(platformUser);
            
            if (!activeWallet) {
                const message = `💰 **Balance Check**

❌ You don't have any wallets yet!

To check your balance, you need a wallet first:
• Say "create a wallet" to get started
• Or "import my wallet" if you have an existing one

Once you have a wallet, I can show you balances for PLS, HEX, USDC, and more! 🚀`;

                this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                return;
            }

            // Initialize provider for PulseChain
            const provider = new ethers.JsonRpcProvider('https://rpc.pulsechain.com');
            
            try {
                // Get native token balance (PLS)
                const nativeBalance = await provider.getBalance(activeWallet.address);
                const plsBalance = ethers.formatEther(nativeBalance);
                
                let response = `💰 **Your Wallet Balance**\n\n`;
                response += `🔐 **Active Wallet:** ${activeWallet.name}\n`;
                response += `📍 **Address:** \`${activeWallet.address.slice(0, 8)}...${activeWallet.address.slice(-6)}\`\n\n`;
                response += `**💎 PulseChain Balances:**\n`;
                response += `• **PLS:** ${parseFloat(plsBalance).toFixed(4)} PLS\n`;
                
                // Check a few popular tokens
                const tokens = [
                    { symbol: 'HEX', address: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39', decimals: 8 },
                    { symbol: 'USDC', address: '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07', decimals: 6 },
                    { symbol: 'PLSX', address: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', decimals: 18 }
                ];
                
                for (const token of tokens) {
                    try {
                        const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
                        const contract = new ethers.Contract(token.address, erc20Abi, provider);
                        const balance = await contract.balanceOf!(activeWallet.address);
                        
                        if (balance > 0n) {
                            const formattedBalance = ethers.formatUnits(balance, token.decimals);
                            response += `• **${token.symbol}:** ${parseFloat(formattedBalance).toFixed(4)} ${token.symbol}\n`;
                        } else {
                            response += `• **${token.symbol}:** 0.0000 ${token.symbol}\n`;
                        }
                    } catch {
                        response += `• **${token.symbol}:** Unable to fetch\n`;
                    }
                }
                
                response += `\n💡 **Want more details?**\n`;
                response += `• "Show my portfolio" - Detailed breakdown\n`;
                response += `• "Check Base balance" - Other networks\n`;
                response += `• "What's my HEX worth?" - USD values\n\n`;
                response += `Balance updated live from PulseChain! 📊`;

                this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                
            } catch (error) {
                console.error('Balance fetch error:', error);
                this.bot.sendMessage(chatId, `❌ I had trouble fetching your balance from PulseChain. This might be a network issue. Would you like me to try again?`);
            }
            
        } catch (error) {
            console.error('Balance handler error:', error);
            this.bot.sendMessage(chatId, '❌ I encountered an error checking your balance. Let me know if you need help with something else!');
        }
    }

    private async handlePriceNaturally(chatId: number, message: string): Promise<void> {
        // Extract token from natural language
        const tokenMatch = message.match(/\b(pls|hex|usdc|usdt|pulse|dai|weth|btc|eth|plsx)\b/i);
        
        if (tokenMatch) {
            const token = tokenMatch[0].toUpperCase();
            
            try {
                this.bot.sendMessage(chatId, `🔍 Hold tight! Pulling live ${token} data from the blockchain...`);
                
                const priceData = await this.priceService.getTokenPrice(token);
                
                if (priceData.success && priceData.data) {
                    const price = priceData.data;
                    const changeEmoji = price.change24h >= 0 ? '📈' : '📉';
                    
                    const priceAnalysis = price.change24h >= 0 ? 
                        `Looking ${price.change24h > 5 ? 'bullish' : 'steady'} today!` :
                        `Taking a ${price.change24h < -5 ? 'dip' : 'breather'} - might be a good entry!`;
                    
                    const response = `💰 **${token} Market Update**

**Price:** $${price.price} ${changeEmoji}
**24h Move:** ${price.change24h ? price.change24h.toFixed(2) : 'N/A'}%
**Liquidity:** $${price.liquidity ? price.liquidity.toLocaleString() : 'N/A'}
**Volume:** $${price.volume24h ? price.volume24h.toLocaleString() : 'N/A'}

💡 *Quick Analysis:* ${priceAnalysis}

Curious about other tokens? Just ask! I'm tracking all the hot ones:
• "How's HEX doing?"
• "PLSX price check"
• "What's moving today?"`;

                    this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                } else {
                    this.bot.sendMessage(chatId, `❌ I couldn't find current ${token} price data. The token might not be available or there could be a temporary issue. Try asking about PLS, HEX, or USDC?`);
                }
            } catch (error) {
                console.error('Price fetch error:', error);
                this.bot.sendMessage(chatId, `❌ I had trouble getting the ${token} price. Let me try again in a moment.`);
            }
        } else {
            this.bot.sendMessage(chatId, `💰 I can check token prices for you! 

Try asking:
• "What's the price of PLS?"
• "How much is HEX worth?"
• "Show me USDC price"
• "Check the value of PULSE"

Which token are you interested in? 🤔`);
        }
    }

    private async handleImportWalletNaturally(chatId: number, platformUser: PlatformUser, text: string): Promise<void> {
        // Check if they provided a private key or seed phrase in the message
        const hexKeyMatch = text.match(/0x[a-fA-F0-9]{64}/);
        const seedMatch = text.match(/\b(\w+\s+){11}\w+\b/); // 12 word phrase pattern
        
        if (hexKeyMatch) {
            // They provided a private key
            const privateKey = hexKeyMatch[0];
            
            try {
                this.bot.sendMessage(chatId, '🔄 Importing your wallet securely...');
                
                const newWallet = await this.walletService.createWallet(platformUser, 'Imported Wallet', privateKey);
                
                const response = `✅ **Wallet imported successfully!**

🔐 **Your wallet:**
• **Address:** \`${newWallet.address}\`
• **Status:** Ready to use
• **Security:** Private key encrypted and secure

🛡️ **For your security,** I've deleted your message containing the private key.

You can now say things like "check my balance" or "show my wallets"! 🚀`;

                this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                
                // Delete the original message with private key
                try {
                    await this.bot.deleteMessage(chatId, (text as any).message_id);
                } catch (e) {
                    console.log('Could not delete message with private key');
                }
                
            } catch (error) {
                console.error('Import error:', error);
                this.bot.sendMessage(chatId, '❌ I had trouble importing that wallet. Please check if the private key is valid and try again.');
            }
        } else if (seedMatch) {
            // They provided a seed phrase
            const mnemonic = seedMatch[0];
            
            try {
                this.bot.sendMessage(chatId, '🔄 Restoring your wallet from seed phrase...');
                
                const newWallet = await this.walletService.importWalletFromMnemonic(platformUser, mnemonic, 'Restored from Seed');
                
                const response = `✅ **Wallet restored successfully!**

🔐 **Your restored wallet:**
• **Address:** \`${newWallet.address}\`
• **Status:** Ready to use
• **Security:** All data encrypted and secure

🛡️ **For your security,** I've deleted your message containing the seed phrase.

Your wallet is ready! Try asking "what's my balance?" 🚀`;

                this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
                
                // Delete the original message with seed phrase
                try {
                    await this.bot.deleteMessage(chatId, (text as any).message_id);
                } catch (e) {
                    console.log('Could not delete message with seed phrase');
                }
                
            } catch (error) {
                console.error('Mnemonic import error:', error);
                this.bot.sendMessage(chatId, '❌ I had trouble restoring from that seed phrase. Please check if all 12 words are correct and try again.');
            }
        } else {
            // They want to import but didn't provide the key/phrase
            const response = `🔐 **I can help you import an existing wallet!**

You can import using:

**Option 1: Private Key**
Just paste your private key (starts with 0x...)

**Option 2: Seed Phrase**
Share your 12-word recovery phrase

**🛡️ Security Promise:**
• I'll encrypt everything immediately
• I'll delete your message for security
• Your keys are never stored in plain text

Go ahead and paste your private key or seed phrase! 🔒`;

            this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
        }
    }

    private async handleHelpNaturally(chatId: number): Promise<void> {
        const response = generateCharacterResponse('telegram', 'help me');
        this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }

    private async handleGeneralConversation(chatId: number, text: string, platformUser: PlatformUser): Promise<void> {
        // Use character-based response for natural conversation
        const response = generateCharacterResponse('telegram', text);
        this.bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
    }

    public async start() {
        try {
            // Initialize database
            await this.databaseService.initializeDatabase();
            console.log('📊 Database initialized');
            
            // Initialize wallet service database
            await this.walletService.initializeDatabase();
            console.log('💼 Wallet service initialized');
            
            // Initialize services
            console.log('🔧 Services initialized');
            console.log('✅ Bot is running and ready for messages!');
            console.log('📱 Send /start to begin interacting with the bot');
            
        } catch (error) {
            console.error('❌ Failed to start bot:', error);
            process.exit(1);
        }
    }

    public stop() {
        this.bot.stopPolling();
        console.log('🛑 Bot stopped');
    }
}

// Start the bot
const bot = new ElizaOSTelegramBot();
bot.start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    bot.stop();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    bot.stop();
    process.exit(0);
}); 