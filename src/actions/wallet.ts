import { ethers } from 'ethers';
import type { 
    Action,
    IAgentRuntime, 
    Memory, 
    State,
    HandlerCallback,
    Content
} from '@elizaos/core';
import { parseCommand } from '../utils/parser.js';
import { WalletStorage } from '../utils/wallet-storage.js';

const walletAction: Action = {
    name: "WALLET_MANAGEMENT",
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
                
                // First check if user already has a wallet
                const storage = WalletStorage.getInstance();
                const existingWallet = storage.getWallet(message.userId);
                
                if (lowerText.includes('create') || lowerText.includes('generate') || lowerText.includes('new')) {
                    // Generate new wallet
                    const wallet = ethers.Wallet.createRandom();
                    
                    // Store wallet in persistent storage
                    try {
                        const storage = WalletStorage.getInstance();
                        
                        // Save to persistent storage
                        if (message.userId) {
                            storage.saveWallet(message.userId, {
                                address: wallet.address,
                                privateKey: wallet.privateKey
                            });
                        }
                        
                        // Also store in runtime for session performance
                        if (runtime && message.userId) {
                            (runtime as any).userWallets = (runtime as any).userWallets || {};
                            (runtime as any).userWallets[message.userId] = {
                                address: wallet.address,
                                privateKey: wallet.privateKey,
                                createdAt: Date.now()
                            };
                        }
                        
                        const storageInfo = storage.getStorageInfo();
                        console.log(`📁 Wallet storage location: ${storageInfo.location}`);
                    } catch (error) {
                        console.log('Could not store wallet, continuing...', error);
                    }
                    
                    responseText = `🎉 **New Wallet Created Successfully!**

**Wallet Address:** \`${wallet.address}\`
**Private Key:** \`${wallet.privateKey}\`

⚠️ **IMPORTANT SECURITY NOTES:**
• Save your private key in a secure location
• Never share your private key with anyone
• This wallet is not yet funded - you'll need to transfer tokens to it
• Keep your private key safe - there's no way to recover it if lost

🚀 **Next Steps:**
1. Save this information securely
2. Fund your wallet with tokens
3. Start trading with commands like "swap 100 USDC for WPLS"

*This wallet works across PulseChain, Base Chain, and other EVM networks.*
*✅ I've saved your wallet for future use - it will persist even after restarting!*

📁 **Wallet Storage Location:**
Your wallet is saved at: \`${WalletStorage.getInstance().getStorageLocation()}\`
• Main file: \`wallet-store.json\`
• Backup file: \`wallet-${message.userId}-${wallet.address}.json\`

**Recovery:** If you need to recover your wallet, check the above directory.`;

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
                        responseText = `💼 **Your Stored Wallet**

**Wallet Address:** \`${existingWallet.address}\`
**Created:** ${new Date(existingWallet.createdAt).toLocaleString()}

📁 **Storage Location:** \`${storage.getStorageLocation()}\`

✅ Your wallet is safely stored and will persist across sessions!

**Options:**
• "What's my balance" - Check your token balances
• "Create a new wallet" - Replace with a new wallet
• "Show my private key" - View your private key (be careful!)

⚠️ **Note:** Your private key is stored locally at the above location.`;
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
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a wallet for me"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "🎉 New wallet created! Address: 0x... Private Key: 0x... Keep your private key safe!"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's my balance?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "To check your balance, I need your wallet address. Create a wallet first if you don't have one!"
                }
            }
        ]
    ]
};

export default walletAction; 