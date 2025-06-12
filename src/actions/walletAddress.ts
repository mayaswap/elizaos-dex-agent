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

const walletAddressAction: Action = {
    name: "SHOW_WALLET_ADDRESS",
    similes: [
        "SHOW_ADDRESS",
        "MY_ADDRESS", 
        "WALLET_ADDRESS",
        "GET_ADDRESS",
        "DISPLAY_ADDRESS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            if (!message.content?.text) return false;
            
            const text = message.content.text.toLowerCase();
            
            // Check for address-related keywords
            const addressPatterns = [
                /\bshow\s+(my\s+)?(wallet\s+)?address\b/i,
                /\bwhat'?s\s+my\s+address\b/i,
                /\bmy\s+wallet\s+address\b/i,
                /\bget\s+my\s+address\b/i,
                /\bdisplay\s+(my\s+)?address\b/i,
                /\bwhere\s+is\s+my\s+address\b/i,
                /\bwhat\s+is\s+my\s+wallet\s+address\b/i,
            ];
            
            return addressPatterns.some(pattern => pattern.test(text));
        } catch (error) {
            console.error('Wallet address validation error:', error);
            return false;
        }
    },
    description: "Display the user's active wallet address",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        try {
            // Create platform user from message context
            const platformUser = createPlatformUser(runtime, message);
            
            // Initialize wallet service
            const walletService = new WalletService(runtime);
            
            let responseText = "";
            
            try {
                const activeWallet = await walletService.getActiveWallet(platformUser);
                
                if (activeWallet?.address) {
                    responseText = `💼 **Your Active Wallet Address**

**Address:** \`${activeWallet.address}\`
**Wallet Name:** ${activeWallet.name}
**Platform:** ${activeWallet.platform}
**Created:** ${new Date(activeWallet.createdAt).toLocaleString()}

🔗 **Quick Actions:**
• Copy the address above to receive tokens
• "Check my balance" - See all your token balances
• "Create a new wallet" - Add another wallet

🌐 **Networks Supported:**
• PulseChain (Primary)
• Base Chain  
• Sonic Network

⚡ **Pro Tip:** Use this address to receive tokens on any supported EVM network!`;
                } else {
                    responseText = `💼 **No Active Wallet Found**

You don't have a wallet set up yet! Let me help you:

🆕 **Create New Wallet:**
• Say: "Create a wallet for me"
• I'll generate a secure wallet instantly

🔗 **Import Existing Wallet:**
• Say: "Import wallet with private key [your-key]"
• Connect your existing wallet

📱 **Quick Setup:**
• "Create a wallet" - Get started in seconds
• Your wallet will be encrypted and stored securely
• Works across Telegram, Discord, and Web

**Once created, I'll remember your wallet for easy access!**`;
                }
            } catch (error) {
                console.log('Error retrieving wallet:', error);
                responseText = `💼 **Wallet Lookup Issue**

I'm having trouble accessing your wallet information.

🔄 **Try These Options:**
• "Create a wallet for me" - Generate a new wallet
• "Check my balance" - This will also show your address
• "Import wallet" - Connect an existing wallet

🛠️ **If you recently created a wallet:**
• The wallet system might be initializing
• Try again in a moment
• Your wallet data is safely encrypted and stored

**Need help?** Just ask me to create or import a wallet!`;
            }

            if (callback) {
                callback({
                    text: responseText,
                    content: { text: responseText }
                } as Content);
            }

            return true;

        } catch (error) {
            console.error('Wallet address action error:', error);
            const errorText = `❌ **Address Display Error**
            
Sorry, I encountered an error while retrieving your wallet address.

**Quick Solutions:**
• "Create a wallet for me" - Start fresh
• "Check my balance" - Alternative way to see your address
• Try asking again in a moment

**Need immediate help?** Use the wallet creation command to get started.`;

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
                user: "{{user1}}",
                content: {
                    text: "Show my address"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Here's your wallet address: 0x742d35Cc6635C0532925a3b8D357376C326910b2f"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's my wallet address?"
                }
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me display your active wallet address..."
                }
            }
        ]
    ]
};

export default walletAddressAction; 