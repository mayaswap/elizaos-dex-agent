import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { parseCommand } from "../utils/parser.js";
import { NineMmV3PositionManager } from "../utils/9mm-v3-position-manager.js";
import { WalletStorage } from "../utils/wallet-storage.js";

const portfolioAction: Action = {
    name: "PORTFOLIO_OVERVIEW",
    similes: [
        "SHOW_PORTFOLIO",
        "MY_PORTFOLIO",
        "PORTFOLIO_SUMMARY",
        "ALL_ASSETS",
        "MY_ASSETS",
        "PORTFOLIO_STATS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        return parsed.intent === 'portfolio' && parsed.confidence > 0.6;
    },
    description: "Show comprehensive portfolio overview including tokens, liquidity positions, and performance metrics",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const positionManager = new NineMmV3PositionManager();
            const walletStorage = WalletStorage.getInstance();
            
            // Get user wallets
            const userWallets = walletStorage.getAllWallets();
            const walletCount = Object.keys(userWallets).length;
            
            if (walletCount === 0) {
                if (callback) {
                    callback({
                        text: `📊 **Portfolio Overview**

❌ **No Wallets Connected**

To view your portfolio, you need to connect a wallet first.

**Quick Setup:**
• Create a wallet: "Create a new wallet"
• Import existing: "Import wallet with private key"
• After setup, your portfolio will show:
  - Token balances across all chains
  - Active liquidity positions
  - Total portfolio value
  - Fee earnings and performance

*Connect a wallet to get started!*`
                    });
                }
                return true;
            }

            // For demo purposes, show portfolio structure
            // In production, this would fetch real data from connected wallets
            const demoPortfolio = {
                totalValue: 12450.75,
                tokenCount: 8,
                activePositions: 3,
                totalFeesEarned: 1250.30,
                avgAPY: 18.7,
                inRangePositions: 2,
                chains: ["Pulsechain", "Base", "Sonic"],
                topTokens: [
                    { symbol: "PLS", balance: "25,000", valueUSD: 4500 },
                    { symbol: "HEX", balance: "150,000", valueUSD: 3200 },
                    { symbol: "USDC", balance: "2,800", valueUSD: 2800 },
                    { symbol: "WPLS", balance: "8,500", valueUSD: 1950 }
                ]
            };

            const responseText = `📊 **Your Portfolio Overview**

💰 **Total Portfolio Value**: $${demoPortfolio.totalValue.toLocaleString()}
🏦 **Connected Wallets**: ${walletCount}
🌐 **Active Chains**: ${demoPortfolio.chains.join(', ')}

💎 **Token Holdings** (${demoPortfolio.tokenCount} tokens)
${demoPortfolio.topTokens.map((token, i) => 
    `${i + 1}. **${token.symbol}**: ${token.balance} (~$${token.valueUSD.toLocaleString()})`
).join('\n')}

🏊 **Liquidity Positions** (${demoPortfolio.activePositions} active)
• Total Positions: ${demoPortfolio.activePositions}
• In Range: ${demoPortfolio.inRangePositions}/${demoPortfolio.activePositions} (${Math.round((demoPortfolio.inRangePositions/demoPortfolio.activePositions)*100)}%)
• Total Fees Earned: $${demoPortfolio.totalFeesEarned.toLocaleString()}
• Average APY: ${demoPortfolio.avgAPY}%

📈 **Performance**
• Fee Earnings: ${((demoPortfolio.totalFeesEarned/demoPortfolio.totalValue)*100).toFixed(2)}% of portfolio
• Risk Level: ${demoPortfolio.inRangePositions >= 2 ? '🟢 LOW' : '🟡 MEDIUM'}
• Management Status: ${demoPortfolio.inRangePositions === demoPortfolio.activePositions ? 'All positions optimal' : `${demoPortfolio.activePositions - demoPortfolio.inRangePositions} position(s) need attention`}

**Quick Actions:**
• "Show my liquidity positions" - Detailed LP analysis
• "Check my HEX balance" - Token-specific info
• "What pools are available" - Find new opportunities

*Note: This is a demo view. Real portfolio data requires wallet connection.*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Portfolio action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to load portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show my portfolio" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll show you a comprehensive overview of your portfolio including tokens, liquidity positions, and performance metrics.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Portfolio summary" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me generate your portfolio summary with total value, active positions, and performance analytics.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "All my assets" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll compile all your assets across tokens and liquidity positions with current values and performance.",
                    action: "PORTFOLIO_OVERVIEW"
                }
            }
        ]
    ] as ActionExample[][],
};

export default portfolioAction; 