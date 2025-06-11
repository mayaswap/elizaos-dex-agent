import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { createPlatformUser } from "../services/walletService.js";
import { DatabaseService } from "../services/databaseService.js";

const watchlistsAction: Action = {
    name: "WATCHLISTS",
    similes: [
        "CREATE_WATCHLIST",
        "MY_WATCHLIST",
        "TOKEN_LIST",
        "WATCH_TOKENS",
        "FAVORITE_TOKENS",
        "TRACK_TOKENS"
    ],
    description: "Create and manage token watchlists for easy price monitoring",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        const keywords = [
            'watchlist', 'watch list', 'my tokens', 'favorite tokens',
            'create watchlist', 'add to watchlist', 'track tokens',
            'token list', 'my list', 'watchlists', 'favorites'
        ];
        
        return keywords.some(keyword => text.includes(keyword));
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
            const platformUser = createPlatformUser(runtime, message);
            const dbService = new DatabaseService(runtime);
            await dbService.initializeDatabase();
            
            const userPlatformId = `${platformUser.platform}:${platformUser.platformUserId}`;
            let responseText = '';

            if (text.includes('create') || text.includes('new')) {
                // Create new watchlist
                const nameMatch = text.match(/(?:create|new).*?watchlist.*?(?:named|called)\s+(.+?)(?:\s|$)/i);
                const tokensMatch = text.match(/(?:with|containing|tokens?)\s+(.+?)(?:\s|$)/i);
                
                if (!nameMatch) {
                    responseText = `📋 **Create New Watchlist**

Please specify a name for your watchlist:

**Examples:**
• "Create watchlist named DeFi Gems"
• "New watchlist called My Favorites with HEX WPLS USDC"
• "Create watchlist named High Risk with tokens PLSX DAI"

**Format:** \`create watchlist named [NAME] with [TOKEN1] [TOKEN2] [TOKEN3]\`

**Popular Watchlist Ideas:**
• **DeFi Blue Chips** - Established DeFi tokens
• **PulseChain Native** - WPLS, HEX, PLSX
• **Stablecoins** - USDC, USDT, DAI
• **Gaming Tokens** - Gaming and NFT projects
• **High Beta** - Volatile tokens for active trading

Ready to create your watchlist!`;
                } else {
                    const watchlistName = nameMatch[1]?.trim() || '';
                    const tokensString = tokensMatch?.[1]?.trim() || '';
                    const tokens = tokensString ? tokensString.split(/[\s,]+/).map(t => t.toUpperCase()).filter(t => t.length > 0) : [];
                    
                    if (!watchlistName) {
                        responseText = `❌ **Missing Watchlist Name**

Please provide a name for your watchlist.

**Example:** "Create watchlist named DeFi Favorites"`;
                    } else {
                        try {
                            const watchlistId = await dbService.createWatchlist({
                                userPlatformId,
                                name: watchlistName,
                                tokenSymbols: tokens,
                                description: `Custom watchlist created on ${platformUser.platform}`,
                                createdAt: new Date().toISOString(),
                                platform: platformUser.platform,
                                isDefault: false
                            });

                            responseText = `📋 **Watchlist Created Successfully!**

**Name:** ${watchlistName}
**Tokens:** ${tokens.length > 0 ? tokens.join(', ') : 'None (can add later)'}
**Platform:** ${platformUser.platform.toUpperCase()}
**Watchlist ID:** ${watchlistId}

**🎯 What's Next:**
${tokens.length > 0 ? 
    `• Your watchlist is ready with ${tokens.length} tokens\n• Check prices: "show prices for ${watchlistName}"\n• Add more tokens: "add PLSX to ${watchlistName}"` : 
    `• Add tokens: "add HEX WPLS USDC to ${watchlistName}"\n• Import from favorites: "add my favorite tokens to ${watchlistName}"`
}

**📱 Management:**
• "show my watchlists" - View all lists
• "edit ${watchlistName}" - Modify this list
• "delete ${watchlistName}" - Remove this list

**💡 Pro Tips:**
• Organize tokens by category (DeFi, Gaming, etc.)
• Create separate lists for different risk levels
• Use watchlists for quick price checks

*Your watchlist "${watchlistName}" is ready for monitoring!*`;

                        } catch (error) {
                            responseText = `❌ **Failed to Create Watchlist**

Could not create watchlist: ${error instanceof Error ? error.message : 'Unknown error'}

**Please Try Again:**
• Check the watchlist name is valid
• Ensure token symbols are correct
• Example: "create watchlist named DeFi Tokens with HEX WPLS USDC"`;
                        }
                    }
                }

            } else if (text.includes('show') || text.includes('list') || text.includes('my')) {
                // Show user's watchlists
                const watchlists = await dbService.getUserWatchlists(userPlatformId);

                if (watchlists.length === 0) {
                    responseText = `📋 **Your Token Watchlists**

You don't have any watchlists yet.

**Create Your First Watchlist:**
• "Create watchlist named DeFi Gems with HEX WPLS USDC"
• "New watchlist called Stablecoins with USDC USDT DAI"
• "Create watchlist named PulseChain with WPLS HEX PLSX"

**Benefits:**
• Quick price checks for multiple tokens
• Organized token monitoring
• Easy portfolio planning
• Custom categories and themes

**Popular Watchlist Ideas:**
🔵 **Blue Chip DeFi** - Established tokens
🟢 **PulseChain Native** - WPLS, HEX, PLSX
🟡 **Stablecoins** - USDC, USDT, DAI
🔴 **High Risk/Reward** - Volatile tokens
⚫ **Gaming & NFTs** - Gaming ecosystem

**Get Started:** "create watchlist named [NAME] with [TOKENS]"`;
                } else {
                    responseText = `📋 **Your Token Watchlists**

**Platform:** ${platformUser.platform.toUpperCase()}
**Total Lists:** ${watchlists.length}

${watchlists.map((list, i) => {
    const defaultBadge = list.isDefault ? '⭐ Default' : '';
    const tokenCount = list.tokenSymbols.length;
    return `**${i + 1}. ${list.name}** ${defaultBadge}
📊 **Tokens:** ${tokenCount > 0 ? `${tokenCount} tokens` : 'Empty'}
${tokenCount > 0 ? `🔗 **Symbols:** ${list.tokenSymbols.slice(0, 5).join(', ')}${tokenCount > 5 ? ` +${tokenCount - 5} more` : ''}` : ''}
📅 **Created:** ${new Date(list.createdAt).toLocaleDateString()}
🆔 **ID:** ${list.id.slice(-8)}
${list.description ? `💬 **Note:** ${list.description}` : ''}`;
}).join('\n\n')}

**📱 Quick Actions:**
• "show prices for [LIST_NAME]" - Check all prices
• "add HEX to [LIST_NAME]" - Add token to list
• "remove USDC from [LIST_NAME]" - Remove token
• "edit [LIST_NAME]" - Modify list

**🎯 Bulk Actions:**
• "check all watchlists" - Prices for all lists
• "export watchlists" - Get list data
• "merge lists" - Combine watchlists

**💡 Management Tips:**
• Keep lists organized by theme or strategy
• Regularly review and update token selections
• Use descriptive names for easy identification

*Your watchlists help you stay on top of the markets!*`;
                }

            } else if (text.includes('add') || text.includes('remove')) {
                // Add or remove tokens from watchlist
                const action = text.includes('add') ? 'add' : 'remove';
                const actionMatch = text.match(new RegExp(`${action}\\s+(.+?)\\s+(?:to|from)\\s+(.+?)(?:\\s|$)`, 'i'));
                
                if (!actionMatch) {
                    responseText = `📝 **${action === 'add' ? 'Add' : 'Remove'} Tokens**

Please specify tokens and watchlist:

**Format:** "${action} [TOKENS] ${action === 'add' ? 'to' : 'from'} [WATCHLIST_NAME]"

**Examples:**
• "${action} HEX WPLS ${action === 'add' ? 'to' : 'from'} DeFi Favorites"
• "${action} USDC ${action === 'add' ? 'to' : 'from'} Stablecoins"

**Find Your Watchlists:**
• "show my watchlists" - View all lists

Which tokens would you like to ${action}?`;
                } else {
                    responseText = `🔧 **Token Management**

Watchlist token management will be implemented.

**For Now:**
• Create new watchlists with tokens included
• "show my watchlists" - View current lists

**Coming Soon:**
• Add/remove individual tokens
• Bulk token operations
• Token reorganization

**Current Workaround:**
• Create a new watchlist with your desired tokens
• Delete old watchlist if needed

This feature is in development!`;
                }

            } else if (text.includes('delete') || text.includes('remove')) {
                // Delete entire watchlist
                responseText = `🗑️ **Delete Watchlist**

Watchlist deletion will be implemented.

**For Now:**
• "show my watchlists" - View current lists
• Contact support for manual deletion

**Coming Soon:**
• Delete individual watchlists
• Bulk watchlist management
• Watchlist archiving

**Safety Note:**
• Deletion will be permanent
• Consider exporting before deleting
• Default watchlists may have special protection

This feature is in development!`;

            } else if (text.includes('prices') || text.includes('check')) {
                // Show prices for watchlist tokens
                const nameMatch = text.match(/(?:prices|check).*?(?:for|of)\s+(.+?)(?:\s|$)/i);
                
                if (!nameMatch) {
                    responseText = `💰 **Check Watchlist Prices**

Please specify which watchlist to check:

**Format:** "show prices for [WATCHLIST_NAME]"
**Example:** "check prices for DeFi Favorites"

**Find Your Watchlists:**
• "show my watchlists" - View all lists

**Quick Checks:**
• "prices for all watchlists" - Check everything
• "check my favorites" - Default watchlist prices

Which watchlist would you like to check?`;
                } else {
                    responseText = `💰 **Watchlist Price Check**

Price checking for watchlists will be implemented.

**For Now:**
• "price HEX" - Check individual token prices
• "show my portfolio" - Portfolio overview

**Coming Soon:**
• Bulk price checks for watchlists
• Price change highlights
• Performance summaries
• Alert integration

**Current Workaround:**
• Check tokens individually: "price [TOKEN]"
• Use portfolio view for owned tokens

This feature is in development!`;
                }

            } else {
                // General help for watchlists
                responseText = `📋 **Token Watchlist System**

**🎯 Available Commands:**

**📝 Create Watchlists:**
• "Create watchlist named DeFi Gems with HEX WPLS USDC"
• "New watchlist called Stablecoins with USDC USDT DAI"
• "Create watchlist named Gaming with token symbols"

**📋 Manage Watchlists:**
• "show my watchlists" - View all lists
• "list watchlists" - Same as above
• "add HEX to DeFi Gems" - Add token to list
• "remove USDC from Stablecoins" - Remove token

**💰 Price Monitoring:**
• "show prices for DeFi Gems" - Check list prices
• "check all watchlists" - All list prices
• "prices for [NAME]" - Specific list prices

**🎯 Watchlist Features:**
✅ **Organized Monitoring** - Group tokens by theme
✅ **Multi-Platform** - Works on all platforms
✅ **Quick Access** - Fast price checks
✅ **Unlimited Lists** - Create as many as needed
✅ **Custom Categories** - Organize your way

**💡 Watchlist Ideas:**

**📊 By Strategy:**
• **Long-term Holds** - Blue chip DeFi tokens
• **Trading Targets** - High volatility tokens
• **Income Tokens** - Yield-bearing assets
• **Moonshots** - High-risk, high-reward

**🏗️ By Ecosystem:**
• **PulseChain Native** - WPLS, HEX, PLSX
• **Ethereum DeFi** - UNI, AAVE, COMP
• **Stablecoins** - USDC, USDT, DAI
• **Layer 2s** - MATIC, ARB, OP

**📈 By Market Cap:**
• **Large Cap** - Established projects
• **Mid Cap** - Growing projects  
• **Small Cap** - Early stage tokens

**🚀 Get Started:**
"Create watchlist named [NAME] with [TOKEN1] [TOKEN2] [TOKEN3]"

*Example: "Create watchlist named DeFi Blue Chips with HEX WPLS USDC"*`;
            }

            if (callback) {
                callback({ text: responseText });
            }
            return true;

        } catch (error) {
            console.error('Watchlists error:', error);
            if (callback) {
                callback({
                    text: `❌ **Watchlist Error**

Failed to process watchlist request: ${error instanceof Error ? error.message : 'Unknown error'}

**Try Again:**
• "create watchlist named DeFi Tokens with HEX WPLS USDC"
• "show my watchlists"
• "watchlist help"

**Common Issues:**
• Check watchlist name is valid
• Ensure token symbols are correct
• Database connection may be unavailable

If the problem persists, please check your database connection.`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "create watchlist named DeFi Favorites with HEX WPLS USDC" }
            },
            {
                user: "{{user2}}",
                content: { text: "Watchlist 'DeFi Favorites' created with HEX, WPLS, and USDC for easy monitoring!" }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "show my watchlists" }
            },
            {
                user: "{{user2}}",
                content: { text: "Here are all your token watchlists with their contents and management options." }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "check prices for DeFi Favorites" }
            },
            {
                user: "{{user2}}",
                content: { text: "Current prices for all tokens in your DeFi Favorites watchlist." }
            }
        ]
    ]
};

export default watchlistsAction; 