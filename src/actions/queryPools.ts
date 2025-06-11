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
import { NineMmPoolDiscoveryService } from "../utils/9mm-v3-pool-discovery.js";
import { NineMmV3PositionManager } from "../utils/9mm-v3-position-manager.js";
import { NineMmV3FeeTracker } from "../utils/9mm-v3-fee-tracker.js";
import { POPULAR_TOKENS } from "../config/chains.js";

const queryPoolsAction: Action = {
    name: "QUERY_POOLS",
    similes: [
        "SHOW_POOLS",
        "LIST_POOLS",
        "FIND_POOLS",
        "SEARCH_POOLS",
        "POOL_INFO",
        "SHOW_POSITIONS",
        "MY_POSITIONS",
        "LP_POSITIONS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = parseCommand(text);
        
        return parsed.intent === 'poolQuery' && parsed.confidence > 0.6;
    },
    description: "Query 9mm V3 liquidity pools and positions using natural language",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text;
        const parsed = parseCommand(text);
        
        try {
            const poolDiscovery = new NineMmPoolDiscoveryService();
            const positionManager = new NineMmV3PositionManager();
            const feeTracker = new NineMmV3FeeTracker();
            
            // Check if querying specific token pair
            if (parsed.fromToken && parsed.toToken) {
                // Get token addresses
                const pulsechainTokens = POPULAR_TOKENS.pulsechain;
                const token0Address = pulsechainTokens[parsed.fromToken as keyof typeof pulsechainTokens];
                const token1Address = pulsechainTokens[parsed.toToken as keyof typeof pulsechainTokens];
                
                if (!token0Address || !token1Address) {
                    throw new Error(`Token not found: ${parsed.fromToken} or ${parsed.toToken}`);
                }

                // Find pools for specific pair
                const pools = await poolDiscovery.findPools(token0Address, token1Address);
                
                if (pools.length === 0) {
                    if (callback) {
                        callback({
                            text: `❌ No ${parsed.fromToken}/${parsed.toToken} pools found on 9mm V3.`
                        });
                    }
                    return false;
                }

                // Format pool information
                const poolsInfo = pools.map((pool, index) => {
                    const feeTierMap: { [key: string]: string } = {
                        '2500': '0.25%',
                        '10000': '1%',
                        '20000': '2%'
                    };
                    const feeTier = feeTierMap[pool.feeTier] || `${parseInt(pool.feeTier) / 10000}%`;
                    const tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                    const volume24h = parseFloat(pool.volumeUSD).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });

                    // Calculate APY from recent fees
                    const dayData = pool.poolDayData || [];
                    const recentFees = dayData.slice(0, 7).reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
                    const avgDailyFees = recentFees / Math.max(dayData.length, 1);
                    const estimatedAPY = (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;

                    return `${index + 1}. **${parsed.fromToken}/${parsed.toToken} - ${feeTier} Pool**
   • TVL: ${tvl}
   • 24h Volume: ${volume24h}
   • Estimated APY: ${estimatedAPY.toFixed(2)}%
   • Current Price: ${parseFloat(pool.token0Price).toFixed(6)} ${parsed.toToken} per ${parsed.fromToken}`;
                }).join('\n\n');

                const responseText = `🏊 **${parsed.fromToken}/${parsed.toToken} Liquidity Pools on 9mm V3**

${poolsInfo}

💡 **Tips:**
• Higher TVL pools typically have less slippage
• Fee tier affects your earning potential (higher fees = higher returns but less volume)
• Consider APY vs IL risk when choosing pools
• Use "Add liquidity to [pool]" to provide liquidity`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }

                return true;
            }

            // Check if querying user positions
            if (text.toLowerCase().includes('my') || text.toLowerCase().includes('position')) {
                // For demo purposes, show position query info
                const responseText = `📊 **Liquidity Position Management**

To view your positions, I would need access to your wallet address.

**What I can show you:**
• All your active V3 positions
• Position performance and fee earnings
• In-range vs out-of-range status
• P&L analysis vs HODL strategy
• Real-time APY calculations

**Example queries:**
• "Show my liquidity positions"
• "How are my LP positions performing?"
• "Show my PLS/USDC positions"
• "Which of my positions are out of range?"

*Note: Connect your wallet to see actual positions.*`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }

                return true;
            }

            // Default: Show top pools
            const allPools = await poolDiscovery.getAllAvailablePools({
                minimumTVL: 10000,
                sortBy: 'totalValueLockedUSD',
                sortDirection: 'desc'
            });

            if (allPools.length === 0) {
                if (callback) {
                    callback({
                        text: "❌ No pools found with TVL > $10,000. The DEX might be experiencing low liquidity."
                    });
                }
                return false;
            }

            // Format top pools
            const topPoolsInfo = allPools.slice(0, 5).map((pool, index) => {
                const feeTierMap: { [key: string]: string } = {
                    '2500': '0.25%',
                    '10000': '1%',
                    '20000': '2%'
                };
                const feeTier = feeTierMap[pool.feeTier] || `${parseInt(pool.feeTier) / 10000}%`;
                const tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
                const volume24h = parseFloat(pool.volumeUSD).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });

                // Calculate APY
                const dayData = pool.poolDayData || [];
                const recentFees = dayData.slice(0, 7).reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
                const avgDailyFees = recentFees / Math.max(dayData.length, 1);
                const estimatedAPY = (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;

                const recommendation = estimatedAPY > 50 ? '🔥 High Yield' : 
                                     estimatedAPY > 20 ? '✅ Good Returns' : 
                                     '💡 Stable Pool';

                return `${index + 1}. **${pool.token0.symbol}/${pool.token1.symbol} - ${feeTier}** ${recommendation}
   • TVL: ${tvl}
   • 24h Volume: ${volume24h}
   • APY: ${estimatedAPY.toFixed(2)}%`;
            }).join('\n\n');

            const totalPools = allPools.length;

            const responseText = `🏊 **Top Liquidity Pools on 9mm V3**

${topPoolsInfo}

📊 **Pool Statistics:**
• Total Pools Available: ${totalPools}
• Pools with TVL > $10K: ${totalPools}
• Average APY: ${(allPools.slice(0, 5).reduce((sum, pool) => {
    const dayData = pool.poolDayData || [];
    const recentFees = dayData.slice(0, 7).reduce((s, d) => s + parseFloat(d.feesUSD), 0);
    const avgDailyFees = recentFees / Math.max(dayData.length, 1);
    return sum + (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100;
}, 0) / Math.min(allPools.length, 5)).toFixed(2)}%

💡 **Quick Actions:**
• "Show WPLS/USDC pools" - Find specific pairs
• "Add liquidity to [token]/[token]" - Provide liquidity
• "Show my positions" - View your LP positions

*Data refreshed from 9mm V3 subgraph*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Query pools action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to query pools: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show me the best liquidity pools" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll find the top liquidity pools on 9mm V3 sorted by TVL and APY for you.",
                    action: "QUERY_POOLS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What pools are available for WPLS and USDC?" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me search for all WPLS/USDC liquidity pools and show you their current stats and yields.",
                    action: "QUERY_POOLS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show my liquidity positions" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll retrieve all your active liquidity positions with their current performance metrics.",
                    action: "QUERY_POOLS"
                }
            }
        ]
    ] as ActionExample[][],
};

export default queryPoolsAction; 