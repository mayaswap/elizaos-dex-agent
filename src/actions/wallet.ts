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
import { WalletService, createPlatformUser } from '../services/walletService.js';
import { IExtendedRuntime } from '../types/extended.js';

const walletAction: Action = {
    name: "WALLET_LEGACY",
    similes: [
        "CREATE_WALLET",
        "GENERATE_WALLET", 
        "NEW_WALLET",
        "WALLET_BALANCE",
        "CHECK_BALANCE",
        "CONNECT_WALLET",
        "MY_WALLET"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            if (!message.content?.text) return false;
            
            const parsed = await parseCommand(message.content.text);
            return parsed.intent === 'wallet';  // Only handle wallet intent, not balance
        } catch (error) {
            console.error('Wallet validation error:', error);
            return false;
        }
    },
    description: "Generate new wallets, check balances, and manage wallet connections",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        try {
            const userMessage = message.content?.text || "";
            const parsed = await parseCommand(userMessage);
            
            let responseText = "";
            
            if (parsed.intent === 'wallet') {
                // Check for specific wallet commands
                const lowerText = userMessage.toLowerCase();
                
                // Create platform user and check for existing wallets
                const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
                const walletService = new WalletService(runtime as IExtendedRuntime);
                
                let existingWallet: any = null;
                try {
                    const activeWallet = await walletService.getActiveWallet(platformUser);
                    if (activeWallet) {
                        existingWallet = activeWallet;
                    }
                } catch (error) {
                    console.log('No existing wallet found:', error);
                }
                
                if (lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('new')) {
                    // Create new wallet using the new WalletService
                    try {
                        const newWallet = await walletService.createWallet(platformUser);
                        
                        responseText = `🎉 **New Wallet Created Successfully!**

📋 **Full Address (Tap to Copy):**
${newWallet.address}

**Wallet Details:**
• Name: ${newWallet.name}
• Platform: ${newWallet.platform}

⚠️ **IMPORTANT SECURITY NOTES:**
• Your private key is encrypted with AES-256 and stored securely
• Use the telegram bot to manage your wallet safely
• This wallet is ready for real transactions
• Never share your wallet access with anyone

🚀 **Next Steps:**
1. Fund your wallet by sending tokens to the address above
2. Use "check my balance" to see your tokens
3. Start trading with natural language commands

*This wallet works across PulseChain, Base Chain, and other EVM networks.*
*✅ Your wallet is securely stored with military-grade encryption!*

**Recovery:** Your wallet is safely stored in our encrypted database system.`;
                    } catch (error: any) {
                        responseText = `❌ **Wallet Creation Failed**

${error.message || 'Unknown error occurred'}

Please try again or use the telegram bot for reliable wallet creation.`;
                    }

                } else if (lowerText.includes('connect')) {
                    responseText = `🔗 **Wallet Connection Guide**

To connect your existing wallet, you have a few options:

**Option 1: Use Your Private Key**
• Tell me: "Import wallet with private key [your-key]"
• I can help you access your existing wallet

**Option 2: Generate New Wallet**
• Say: "Create a new wallet for me"
• Get a fresh wallet address and private key

**Option 3: Check Existing Balance**
• Tell me: "Check balance of [wallet-address]"
• I can query any public wallet address

💡 **What would you like to do?**`;

                } else {
                    // Check if they're asking about their wallet
                    if (existingWallet && (lowerText.includes('my wallet') || lowerText.includes('what is my') || lowerText.includes('show my'))) {
                        responseText = `💼 **Your Active Wallet**

📋 **Full Address (Tap to Copy):**
${existingWallet.address}

**Wallet Details:**
• Name: ${existingWallet.name}
• Created: ${new Date(existingWallet.createdAt).toLocaleString()}

🔐 **Security:** AES-256 encrypted database storage

✅ Your wallet is safely stored and will persist across sessions!

**Options:**
• "What's my balance" - Check your token balances
• "Create a new wallet" - Add another wallet
• Use the telegram bot for full wallet management

⚠️ **Note:** Your private key is encrypted and secure in our database.`;
                    } else {
                        responseText = `💼 **Wallet Management Options**

I can help you with:

🆕 **Create New Wallet:** "Create a wallet for me"
🔗 **Connect Existing:** "Connect my wallet" 
💰 **Check Balance:** "What's my balance" or "Check balance of [address]"
📝 **Import Wallet:** "Import wallet with private key [key]"

**What would you like to do?**`;
                    }
                }
            }

            if (callback) {
                callback({
                    text: responseText,
                    content: { text: responseText }
                } as Content);
            }

            return true;

        } catch (error) {
            console.error('Wallet action error:', error);
            const errorText = `❌ **Wallet Error**
            
Sorry, I encountered an error while handling your wallet request. Please try again or ask for help with:

• "Create a new wallet"
• "Check my balance" 
• "Connect wallet help"`;

            if (callback) {
                callback({
                    text: errorText,
                    content: { text: errorText }
                } as Content);
            }
            
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Create a wallet for me"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "🎉 New wallet created! Address: 0x... Private Key: 0x... Keep your private key safe!"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: {
                    text: "What's my balance?"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "To check your balance, I need your wallet address. Create a wallet first if you don't have one!"
                }
            }
        ]
    ]
};

export default walletAction; 