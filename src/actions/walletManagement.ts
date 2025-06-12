import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { parseCommand } from "../utils/parser.js";
import { WalletService, createPlatformUser } from "../services/walletService.js";

const walletManagementAction: Action = {
    name: "WALLET_MANAGEMENT",
    similes: [
        "WALLET_SWITCH",
        "WALLET_LIST", 
        "WALLET_RENAME",
        "WALLET_CREATE",
        "WALLET_DELETE",
        "WALLET_INFO"
    ],
    description: "Manage multiple named wallets - switch, create, rename, delete, and view wallet information",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        
        const walletKeywords = [
            'wallet', 'switch wallet', 'list wallets', 'create wallet', 
            'rename wallet', 'delete wallet', 'wallet info', 'my wallets',
            'change wallet', 'new wallet', 'wallet settings', 'active wallet'
        ];
        
        return walletKeywords.some(keyword => text.includes(keyword));
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            const text = message.content.text.toLowerCase();
            const walletStorage = WalletStorage.getInstance();
            
            // Determine action type
            let action = 'list';
            if (text.includes('switch') || text.includes('change wallet')) action = 'switch';
            else if (text.includes('rename')) action = 'rename';
            else if (text.includes('delete') || text.includes('remove')) action = 'delete';
            else if (text.includes('create') || text.includes('new wallet')) action = 'create';
            else if (text.includes('info') || text.includes('details')) action = 'info';
            else if (text.includes('active') || text.includes('current')) action = 'active';

            const wallets = walletStorage.getWalletList();
            const activeWallet = walletStorage.getActiveWallet();
            
            let responseText = '';

            switch (action) {
                case 'list':
                    responseText = `👛 **Wallet Management Dashboard**

**Active Wallet:** ${activeWallet ? `🟢 ${activeWallet.name}` : '❌ None'}
${activeWallet ? `• Address: ${activeWallet.address}\n• Last Used: ${new Date(activeWallet.lastUsed).toLocaleString()}` : ''}

**All Wallets (${wallets.length}/${walletStorage.getAllWallets().maxWallets || 3}):**
${wallets.map((wallet, i) => {
    const isActive = activeWallet?.id === wallet.id;
    const indicator = isActive ? '🟢 Active' : '⚫ Inactive';
    return `${i + 1}. **${wallet.name}** ${indicator}
   Address: ${wallet.address}
   Last Used: ${new Date(wallet.lastUsed).toLocaleString()}
   ID: ${wallet.id}`;
}).join('\n')}

**💡 Available Actions:**
• "Switch to [wallet name]" - Change active wallet
• "Rename [wallet name] to [new name]" - Update wallet name
• "Create new wallet named [name]" - Add wallet (max 3)
• "Delete wallet [name]" - Remove wallet
• "Show wallet info" - Detailed current wallet info

**⚙️ Per-Wallet Settings:**
Each wallet has its own slippage settings, MEV protection, and trading preferences.`;
                    break;

                case 'switch':
                    // Parse wallet name or address from command
                    const switchMatch = text.match(/(?:switch|change).*?(?:to|wallet)\s+(.+?)(?:\s|$)/i);
                    const targetName = switchMatch?.[1]?.trim();
                    
                    if (!targetName) {
                        responseText = `❌ **Wallet Switch Failed**

Please specify which wallet to switch to.

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}

**Try:** "Switch to [wallet name]"`;
                        break;
                    }

                    // Find wallet by name or partial address
                    const targetWallet = wallets.find(w => 
                        w.name.toLowerCase().includes(targetName.toLowerCase()) ||
                        w.address.toLowerCase().includes(targetName.toLowerCase())
                    );

                    if (!targetWallet) {
                        responseText = `❌ **Wallet Not Found**

No wallet found matching "${targetName}".

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name} (${w.address})`).join('\n')}`;
                        break;
                    }

                    const switched = walletStorage.switchWallet(targetWallet.id);
                    if (switched) {
                        const settings = walletStorage.getWalletSettings(targetWallet.id);
                        responseText = `✅ **Wallet Switched Successfully**

**Now Active:** ${targetWallet.name}
• Address: ${targetWallet.address}
• Slippage: ${settings?.slippagePercentage || 0.5}%
• MEV Protection: ${settings?.mevProtection ? 'Enabled' : 'Disabled'}
• Auto Slippage: ${settings?.autoSlippage ? 'Enabled' : 'Disabled'}
• Deadline: ${settings?.transactionDeadline || 20} minutes

**Ready for trading with this wallet!**
All transactions will now use these settings.`;
                    } else {
                        responseText = `❌ Failed to switch to wallet "${targetName}"`;
                    }
                    break;

                case 'rename':
                    const renameMatch = text.match(/rename\s+(.+?)\s+to\s+(.+?)(?:\s|$)/i);
                    if (!renameMatch) {
                        responseText = `❌ **Rename Format Incorrect**

Please use: "Rename [current name] to [new name]"

**Example:** "Rename Wallet 1 to Trading Wallet"`;
                        break;
                    }

                    const currentName = renameMatch[1].trim();
                    const newName = renameMatch[2].trim();
                    
                    const walletToRename = wallets.find(w => 
                        w.name.toLowerCase().includes(currentName.toLowerCase())
                    );

                    if (!walletToRename) {
                        responseText = `❌ **Wallet Not Found**

No wallet found with name containing "${currentName}".

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`;
                        break;
                    }

                    const renamed = walletStorage.renameWallet(walletToRename.id, newName);
                    if (renamed) {
                        responseText = `✅ **Wallet Renamed Successfully**

**Old Name:** ${currentName}
**New Name:** ${newName}
**Address:** ${walletToRename.address}

The wallet name has been updated and saved.`;
                    } else {
                        responseText = `❌ Failed to rename wallet "${currentName}"`;
                    }
                    break;

                case 'create':
                    const createMatch = text.match(/(?:create|new).*?(?:named|called)\s+(.+?)(?:\s|$)/i);
                    const walletName = createMatch?.[1]?.trim() || `Wallet ${wallets.length + 1}`;
                    
                    try {
                        // This would need to integrate with the actual wallet creation logic
                        responseText = `⚠️ **Wallet Creation**

To create a new wallet named "${walletName}":

**Option 1: Generate New Wallet**
• "Generate new wallet" - Create fresh wallet with new keys

**Option 2: Import Existing**  
• "Import wallet with mnemonic" - Use existing seed phrase
• "Import wallet with private key" - Use existing private key

**Current Status:**
• Wallets: ${wallets.length}/${walletStorage.getAllWallets().maxWallets || 3} (max allowed)
• ${wallets.length >= 3 ? '❌ Maximum wallets reached' : '✅ Can create more wallets'}

**Note:** Each wallet will have independent slippage settings and trading preferences.`;
                    } catch (error) {
                        responseText = `❌ **Cannot Create Wallet**

${error instanceof Error ? error.message : 'Unknown error occurred'}

**Current Status:**
• Wallets: ${wallets.length}/${walletStorage.getAllWallets().maxWallets || 3}`;
                    }
                    break;

                case 'delete':
                    const deleteMatch = text.match(/delete\s+(?:wallet\s+)?(.+?)(?:\s|$)/i);
                    const nameToDelete = deleteMatch?.[1]?.trim();
                    
                    if (!nameToDelete) {
                        responseText = `❌ **Delete Format Incorrect**

Please specify which wallet to delete.

**Format:** "Delete wallet [name]"
**Example:** "Delete wallet Trading"

**⚠️ Warning:** This action cannot be undone!`;
                        break;
                    }

                    const walletToDelete = wallets.find(w => 
                        w.name.toLowerCase().includes(nameToDelete.toLowerCase())
                    );

                    if (!walletToDelete) {
                        responseText = `❌ **Wallet Not Found**

No wallet found with name containing "${nameToDelete}".

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}`;
                        break;
                    }

                    if (wallets.length === 1) {
                        responseText = `❌ **Cannot Delete Last Wallet**

You cannot delete your only remaining wallet.
Create another wallet first before deleting this one.`;
                        break;
                    }

                    responseText = `⚠️ **Confirm Wallet Deletion**

**Wallet to Delete:** ${walletToDelete.name}
**Address:** ${walletToDelete.address}
**Warning:** This action is PERMANENT and cannot be undone!

**⚠️ IMPORTANT:**
• Make sure you have the private key/mnemonic saved elsewhere
• Any funds in this wallet will become inaccessible through this app
• This only removes the wallet from the app, not from the blockchain

**To confirm:** "Yes, delete wallet ${walletToDelete.name}"
**To cancel:** "Cancel deletion"`;
                    break;

                case 'active':
                case 'info':
                    if (!activeWallet) {
                        responseText = `❌ **No Active Wallet**

No wallet is currently active. Please switch to a wallet first.

**Available wallets:**
${wallets.map((w, i) => `${i + 1}. ${w.name}`).join('\n')}

**Use:** "Switch to [wallet name]"`;
                        break;
                    }

                    const settings = walletStorage.getWalletSettings();
                    responseText = `🔍 **Active Wallet Information**

**📋 Wallet Details:**
• Name: ${activeWallet.name}
• Address: ${activeWallet.address}
• Created: ${new Date(activeWallet.createdAt).toLocaleString()}
• Last Used: ${new Date(activeWallet.lastUsed).toLocaleString()}

**⚙️ Current Settings:**
• Slippage Tolerance: ${settings?.slippagePercentage || 0.5}%
• MEV Protection: ${settings?.mevProtection ? '✅ Enabled' : '❌ Disabled'}
• Auto Slippage: ${settings?.autoSlippage ? '✅ Enabled' : '❌ Disabled'}
• Transaction Deadline: ${settings?.transactionDeadline || 20} minutes

**📊 Wallet Management:**
• Total Wallets: ${wallets.length}/${walletStorage.getAllWallets().maxWallets || 3}
• Storage Location: ${walletStorage.getStorageLocation()}

**💡 Quick Actions:**
• "Change slippage to X%" - Update slippage for this wallet
• "Switch to [wallet name]" - Change active wallet
• "List wallets" - View all wallets`;
                    break;

                default:
                    responseText = `👛 **Wallet Management Help**

**Available Commands:**

**📋 View & Switch:**
• "List wallets" - Show all wallets
• "Switch to [name]" - Change active wallet
• "Show wallet info" - Current wallet details

**✏️ Manage:**
• "Rename [old] to [new]" - Update wallet name
• "Create new wallet named [name]" - Add wallet
• "Delete wallet [name]" - Remove wallet

**Current Status:**
• Active: ${activeWallet?.name || 'None'}
• Total: ${wallets.length}/${walletStorage.getAllWallets().maxWallets || 3} wallets

Each wallet has independent trading settings!`;
                    break;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Wallet management action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to manage wallets: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "List my wallets" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll show you all your wallets with their names, addresses, and which one is currently active.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Switch to Trading Wallet" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll switch to your Trading Wallet and show you its current settings and configuration.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Rename Wallet 1 to DeFi Wallet" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll rename your wallet from 'Wallet 1' to 'DeFi Wallet' for easier identification.",
                    action: "WALLET_MANAGEMENT"
                }
            }
        ]
    ] as ActionExample[][],
};

export default walletManagementAction; 