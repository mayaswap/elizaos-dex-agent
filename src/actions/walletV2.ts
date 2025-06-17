import { ethers } from 'ethers';
import type { 
    Action,
    IAgentRuntime, 
    Memory, 
    State,
    HandlerCallback,
    Content
} from '@elizaos/core';
import { parseCommand } from '../utils/smartParser.js';
import { WalletService, createPlatformUser, PlatformUser } from '../services/walletService.js';
import { sessionService } from '../services/sessionService.js';
import { IExtendedRuntime } from '../types/extended.js';

const walletV2Action: Action = {
    name: "WALLET_V2",
    similes: [
        "CREATE_WALLET",
        "GENERATE_WALLET", 
        "NEW_WALLET",
        "IMPORT_WALLET",
        "WALLET_INFO",
        "MY_WALLET",
        "WALLET_LIST",
        "SWITCH_WALLET",
        "LIST_WALLETS",
        "SHOW_WALLET",
        "WALLET_DASHBOARD",
        "WALLET_SETTINGS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            if (!message.content?.text) return false;
            
            const text = message.content.text.toLowerCase();
            
            // Check for wallet-related keywords
            const walletKeywords = [
                'wallet', 'create', 'generate', 'new wallet', 'import wallet',
                'list wallet', 'show wallet', 'my wallet', 'wallet info',
                'wallet settings', 'switch to', 'wallet dashboard'
            ];
            
            const hasWalletKeyword = walletKeywords.some(keyword => text.includes(keyword));
            
            if (hasWalletKeyword) {
                return true;
            }
            
            // Fallback to AI parsing
            const parsed = await parseCommand(message.content.text);
            return parsed.intent === 'wallet';
        } catch (error) {
            console.error('Wallet V2 validation error:', error);
            return false;
        }
    },
    description: "Advanced multi-platform wallet management with database storage and encryption",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const userMessage = message.content?.text || "";
            const lowerText = userMessage.toLowerCase();
            
            // Get the shared wallet service from runtime
            let walletService: WalletService;
            if ((runtime as IExtendedRuntime).customServices?.wallet) {
                walletService = (runtime as IExtendedRuntime).customServices.wallet;
                console.log('✅ Using shared WalletService from runtime');
            } else {
                // Fallback: create new instance if not available
                console.warn("⚠️ Shared wallet service not available, creating new WalletService instance");
                walletService = new WalletService(runtime as IExtendedRuntime);
                await walletService.initializeDatabase();
            }
            
            // Create platform user from message
            const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
            
            let responseText = "";

            // Determine the wallet operation
            if (lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('new')) {
                // Extract wallet name if provided
                const nameMatch = lowerText.match(/(?:named|called)\s+(.+?)(?:\s|$)/i);
                const walletName = nameMatch?.[1]?.trim();
                
                try {
                    const newWallet = await walletService.createWallet(platformUser, walletName);
                    
                    // Update session with new wallet status
                    await sessionService.updateWalletStatus(platformUser, true, newWallet.id);
                    
                    responseText = `🎉 **New Wallet Created Successfully!**

**Platform:** ${platformUser.platform.toUpperCase()}
**Wallet Name:** ${newWallet.name}

📋 **Full Address (Tap to Copy):**
\`${newWallet.address}\`

⚠️ **IMPORTANT SECURITY NOTES:**
• Your wallet is securely encrypted and stored in the database
• Each platform account has its own isolated wallet storage
• Maximum 5 wallets per platform account
• Wallet is automatically set as active

🚀 **Next Steps:**
1. Fund your wallet with tokens from another wallet or exchange
2. Start trading with commands like "swap 100 USDC for WPLS"
3. Check your balance with "show my balance"

**📱 Platform Benefits:**
• **Terminal**: Direct command-line access
• **Database**: Persistent storage with encryption
• **Multi-Platform**: Ready for Telegram, Discord, Web

**🔒 Security Features:**
• AES-256 encryption for private keys
• Platform-isolated storage
• Database-backed persistence
• Secure key derivation

*Ready to start trading on PulseChain, Base, and other EVM networks!*`;

                } catch (error) {
                    responseText = `❌ **Failed to Create Wallet**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Possible Issues:**
• Maximum wallet limit reached (5 per platform)
• Database connection error
• Encryption key not available

**Try Again:** "create new wallet" or contact support if the issue persists.`;
                }
                
            } else if (lowerText.includes('import')) {
                responseText = `🔐 **Import Existing Wallet**

To import your existing wallet, I need either:

**Option 1: Private Key Import**
Send: "import wallet with private key: YOUR_PRIVATE_KEY"

**Option 2: Mnemonic Phrase Import**  
Send: "import wallet with mnemonic: YOUR_SEED_PHRASE"

**⚠️ SECURITY WARNING:**
• Only import wallets in secure, private conversations
• Never share private keys or seed phrases publicly
• Double-check you're talking to the official bot
• Consider using a dedicated trading wallet with limited funds

**🔒 What Happens:**
• Your private key/mnemonic is immediately encrypted
• Original key material is never stored in plain text
• Wallet is added to your platform account
• You can name it during import: "import wallet named MyWallet with private key: ..."

**Ready to import?** Send your private key or mnemonic phrase.`;
                
            } else if (lowerText.includes('list') || lowerText.includes('show') || lowerText.includes('my wallet') || lowerText.includes('what is my wallet')) {
                // Show wallet list
                try {
                    const wallets = await walletService.getUserWallets(platformUser);
                    const summary = await walletService.getUserSummary(platformUser);
                    
                    if (wallets.length === 0) {
                        responseText = `👛 **No Wallets Found**

You don't have any wallets yet on ${platformUser.platform.toUpperCase()}.

**Get Started:**
• "create new wallet" - Generate a fresh wallet
• "import wallet" - Import existing wallet from private key/mnemonic

**Platform:** ${platformUser.platform.toUpperCase()}
**User ID:** ${platformUser.platformUserId}`;
                    } else {
                        responseText = `👛 **Your Wallet Dashboard**

**Platform:** ${platformUser.platform.toUpperCase()} (@${platformUser.platformUsername || platformUser.platformUserId})
**Total Wallets:** ${summary.totalWallets}/5
**Member Since:** ${summary.createdAt.toLocaleDateString()}

**🟢 Active Wallet:** ${summary.activeWallet?.name || 'None'}
${summary.activeWallet ? `• Address: \`${summary.activeWallet.address}\`\n• Created: ${summary.activeWallet.createdAt.toLocaleDateString()}\n• Last Used: ${summary.activeWallet.lastUsed.toLocaleString()}` : ''}

**📋 All Wallets:**
${wallets.map((wallet, i) => {
    const indicator = wallet.isActive ? '🟢 Active' : '⚫ Inactive';
    return `${i + 1}. **${wallet.name}** ${indicator}
   📍 \`${wallet.address}\`
   📅 Created: ${wallet.createdAt.toLocaleDateString()}
   ⚙️ Slippage: ${wallet.settings.slippagePercentage}%
   🛡️ MEV Protection: ${wallet.settings.mevProtection ? 'ON' : 'OFF'}`;
}).join('\n\n')}

**💡 Wallet Actions:**
• "switch to [wallet name]" - Change active wallet
• "wallet settings" - Configure trading preferences
• "create new wallet" - Add another wallet (max 5)
• "import wallet" - Import from private key/mnemonic

**🔒 Security Status:**
✅ Private keys encrypted with AES-256
✅ Platform-isolated storage
✅ Database backup & recovery`;
                    }
                } catch (error) {
                    responseText = `❌ **Error retrieving wallets**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Try:** "create new wallet" to get started.`;
                }
                
            } else if (lowerText.includes('switch')) {
                // Parse wallet name to switch to
                const switchMatch = lowerText.match(/switch\s+to\s+(.+?)(?:\s|$)/i);
                const targetName = switchMatch?.[1]?.trim();
                
                if (!targetName) {
                    responseText = `❌ **Wallet Switch Failed**

Please specify which wallet to switch to.

**Usage:** "switch to [wallet name]"
**Example:** "switch to MyTradingWallet"

Use "list wallets" to see available wallets.`;
                } else {
                    const wallets = await walletService.getUserWallets(platformUser);
                    const targetWallet = wallets.find(w => 
                        w.name.toLowerCase().includes(targetName.toLowerCase()) ||
                        w.address.toLowerCase().includes(targetName.toLowerCase())
                    );
                    
                    if (!targetWallet) {
                        responseText = `❌ **Wallet Not Found**

No wallet found matching "${targetName}".

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}

**Try:** "switch to [exact wallet name]"`;
                    } else {
                        const success = await walletService.switchWallet(platformUser, targetWallet.id);
                        
                        if (success) {
                            // Update session with the switched wallet
                            await sessionService.updateWalletStatus(platformUser, true, targetWallet.id);
                            responseText = `✅ **Wallet Switched Successfully**

**New Active Wallet:** ${targetWallet.name}
**Address:** \`${targetWallet.address}\`
**Settings:**
• Slippage: ${targetWallet.settings.slippagePercentage}%
• MEV Protection: ${targetWallet.settings.mevProtection ? 'ON' : 'OFF'}
• Auto Slippage: ${targetWallet.settings.autoSlippage ? 'ON' : 'OFF'}

**Ready for Trading!** Your commands will now use this wallet.

**Quick Actions:**
• "show my balance" - Check token balances
• "swap 100 USDC for WPLS" - Execute trades
• "wallet settings" - Modify trading preferences`;
                        } else {
                            responseText = `❌ **Failed to Switch Wallet**

Could not switch to "${targetWallet.name}". This might be due to:
• Database connection error
• Wallet synchronization issue

**Try Again:** "switch to ${targetWallet.name}"`;
                        }
                    }
                }
                
            } else if (lowerText.includes('settings')) {
                // Show current wallet settings
                const activeWallet = await walletService.getActiveWallet(platformUser);
                
                if (!activeWallet) {
                    responseText = `❌ **No Active Wallet**

You need to have an active wallet to view settings.

**Get Started:**
• "create new wallet" - Generate a fresh wallet
• "list wallets" - View existing wallets`;
                } else {
                    responseText = `⚙️ **Wallet Settings: ${activeWallet.name}**

**🎯 Trading Settings:**
• **Slippage Tolerance:** ${activeWallet.settings.slippagePercentage}%
• **MEV Protection:** ${activeWallet.settings.mevProtection ? '✅ Enabled' : '❌ Disabled'}
• **Auto Slippage:** ${activeWallet.settings.autoSlippage ? '✅ Enabled' : '❌ Disabled'}
• **Transaction Deadline:** ${activeWallet.settings.transactionDeadline} minutes
• **Gas Price Preference:** ${activeWallet.settings.preferredGasPrice || 'standard'}

**🔔 Notification Settings:**
• **Price Alerts:** ${activeWallet.settings.notifications.priceAlerts ? '✅ ON' : '❌ OFF'}
• **Transaction Updates:** ${activeWallet.settings.notifications.transactionUpdates ? '✅ ON' : '❌ OFF'}
• **Portfolio Changes:** ${activeWallet.settings.notifications.portfolioChanges ? '✅ ON' : '❌ OFF'}

**📊 Wallet Info:**
• **Address:** \`${activeWallet.address}\`
• **Created:** ${activeWallet.createdAt.toLocaleDateString()}
• **Last Used:** ${activeWallet.lastUsed.toLocaleString()}

**💡 Update Settings:**
• "set slippage to 1%" - Change slippage tolerance
• "enable MEV protection" - Toggle MEV protection
• "disable auto slippage" - Toggle auto slippage
• "set gas to fast" - Change gas preference (slow/standard/fast)

**Each wallet has independent settings!**`;
                }
                
            } else {
                // General wallet help
                responseText = `👛 **Multi-Platform Wallet System**

**Platform:** ${platformUser.platform.toUpperCase()}

**🚀 Available Commands:**

**💰 Wallet Management:**
• "create new wallet" - Generate fresh wallet
• "list wallets" - Show all your wallets
• "switch to [name]" - Change active wallet
• "wallet settings" - View/modify trading preferences

**🔐 Import/Export:**
• "import wallet" - Import from private key/mnemonic
• "import wallet named MyWallet with private key: 0x..." - Import with name

**⚙️ Configuration:**
• "set slippage to X%" - Update slippage tolerance
• "enable MEV protection" - Toggle MEV protection
• "wallet settings" - View current configuration

**🎯 Features:**
✅ **Terminal Access:** Direct command-line interface
✅ **Secure Storage:** AES-256 encrypted private keys
✅ **Multiple Wallets:** Up to 5 wallets per platform
✅ **Independent Settings:** Each wallet has its own preferences
✅ **Database Persistence:** All data stored securely

**📱 Current Status:**
• Platform: ${platformUser.platform.toUpperCase()}
• User: ${platformUser.platformUsername || platformUser.platformUserId}

**Get Started:** "create new wallet" or "list wallets"`;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Wallet V2 action error:', error);
            if (callback) {
                callback({
                    text: `❌ **Wallet System Error**

An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}

**Possible Solutions:**
• Try again in a few moments
• Check if the database is accessible
• Verify your platform permissions

**For Support:** Please report this error with the timestamp: ${new Date().toISOString()}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "create new wallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "I'll create a new wallet for you with secure encryption and database storage." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "list my wallets" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here are all your wallets with their current settings and activity status." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "what is my wallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here's your current wallet information and dashboard." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "switch to MyTradingWallet" }
            },
            {
                name: "{{user2}}",
                content: { text: "Successfully switched to MyTradingWallet. All trading commands will now use this wallet." }
            }
        ]
    ]
};

export default walletV2Action; 