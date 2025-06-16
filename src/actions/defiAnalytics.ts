import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { parseCommand } from "../utils/smartParser.js";
import { GraphQLClient, gql } from 'graphql-request';
import { NineMmPoolDiscoveryService } from "../utils/9mm-v3-pool-discovery.js";

const defiAnalyticsAction: Action = {
    name: "DEFI_ANALYTICS",
    similes: [
        "MARKET_ANALYTICS",
        "DEFI_DASHBOARD",
        "MARKET_OVERVIEW",
        "TOP_TOKENS",
        "YIELD_OPPORTUNITIES",
        "TRENDING_POOLS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        return text.includes('defi') || text.includes('analytics') || text.includes('stats') || text.includes('overview');
    },
    description: "Get comprehensive DeFi analytics and market overview for 9mm DEX",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content?.text?.toLowerCase() || '';
            
            const poolDiscovery = new NineMmPoolDiscoveryService();
            
            // Get available pools for analytics
            const pools = await poolDiscovery.getAllAvailablePools({
                sortBy: 'totalValueLockedUSD',
                sortDirection: 'desc'
            });
            
            let responseText = '';
            
            if (text.includes('detailed') || text.includes('full')) {
                // Full detailed analytics
                responseText = `📊 **Complete 9mm DEX Analytics Dashboard**

🏆 **Market Overview:**
• Total Pools: ${pools.length}
• Top Pools Available: ${Math.min(5, pools.length)}

💰 **Top Performing Pools:**
${pools.slice(0, 5).map((pool: any, i: number) => {
    const apy = poolDiscovery.calculateEstimatedAPY(pool);
    return `${i+1}. **${pool.token0.symbol}/${pool.token1.symbol}** (${poolDiscovery.formatFeeTier(pool.feeTier)})
   • TVL: $${parseFloat(pool.totalValueLockedUSD).toLocaleString()}
   • 24h Volume: $${parseFloat(pool.volumeUSD).toLocaleString()}
   • Est. APY: ${apy.toFixed(2)}%`;
}).join('\n\n')}

📈 **Data Source**: Real-time from 9mm V3 Subgraph

**Detailed Analytics:**
• "Show trending tokens" - Top performing tokens
• "Best yield opportunities" - Highest APY pools
• "Show trending pools" - Most active liquidity pools`;
            } else {
                responseText = `📊 **DeFi Analytics Hub**

What would you like to explore?

**📈 Market Overview**:
• "Show market overview" - Global DeFi metrics
• "DeFi dashboard" - Complete market snapshot

**🚀 Trending**:
• "Show trending tokens" - Top performers
• "Trending pools" - Hottest liquidity pairs
• "Market analytics" - Price movements & volume

**💰 Yield Farming**:
• "Best yield opportunities" - Highest APY pools
• "Show staking rewards" - Passive income options
• "Yield strategy" - Optimized farming plans

**⛓️ Cross-Chain**:
• "Compare chains" - TVL & volume across networks
• "Chain analytics" - Individual network metrics

*Data sourced from: 9mm V3 Subgraph (PulseChain only)*`;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('DeFi analytics action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to load DeFi analytics: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Show market analytics" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll show you comprehensive DeFi market analytics including TVL, volume, and trending opportunities across all chains.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Best yield opportunities" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me find the highest APY yield farming opportunities with risk assessments across all supported networks.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Trending tokens" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you the top performing tokens with price movements, volume, and momentum indicators.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ]
    ] as ActionExample[][],
};

// Function to fetch real analytics data from 9mm subgraph
async function getAnalyticsData(client: GraphQLClient, analyticsType: string) {
    try {
        // Query to get top pools by TVL and volume
        const poolsQuery = gql`
            query GetTopPools {
                pools(
                    first: 20
                    orderBy: totalValueLockedUSD
                    orderDirection: desc
                    where: { totalValueLockedUSD_gt: "1000" }
                ) {
                    id
                    token0 {
                        symbol
                        id
                    }
                    token1 {
                        symbol  
                        id
                    }
                    feeTier
                    totalValueLockedUSD
                    volumeUSD
                    token0Price
                    token1Price
                    poolDayData(first: 7, orderBy: date, orderDirection: desc) {
                        volumeUSD
                        tvlUSD
                        feesUSD
                        date
                    }
                }
            }
        `;

        const result = await client.request(poolsQuery) as any;
        
        if (!result.pools || result.pools.length === 0) {
            return null; // Will trigger error message
        }

        // Process the data based on analytics type
        const pools = result.pools;
        
        // Calculate aggregated metrics
        const totalTvl = pools.reduce((sum: number, pool: any) => 
            sum + parseFloat(pool.totalValueLockedUSD), 0);
        
        const totalVolume24h = pools.reduce((sum: number, pool: any) => {
            const latestDay = pool.poolDayData[0];
            return sum + (latestDay ? parseFloat(latestDay.volumeUSD) : 0);
        }, 0);

        // Format data for different analytics types
        return {
            overview: {
                totalTvl,
                totalVolume24h,
                totalPools: pools.length,
                topPools: pools.slice(0, 5).map((pool: any) => ({
                    pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
                    tvl: parseFloat(pool.totalValueLockedUSD),
                    volume24h: pool.poolDayData[0] ? parseFloat(pool.poolDayData[0].volumeUSD) : 0,
                    feeTier: pool.feeTier
                }))
            },
            trending: {
                tokens: [], // Would need token-specific queries
                pools: pools.slice(0, 10).map((pool: any) => {
                    const latestDay = pool.poolDayData[0];
                    const tvl = parseFloat(pool.totalValueLockedUSD);
                    const volume24h = latestDay ? parseFloat(latestDay.volumeUSD) : 0;
                    const fees24h = latestDay ? parseFloat(latestDay.feesUSD) : 0;
                    
                    // Estimate APY based on fees vs TVL
                    const apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;
                    
                    return {
                        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
                        apy,
                        tvl,
                        volume24h,
                        chain: "PulseChain"
                    };
                })
            },
            yield: {
                opportunities: pools.slice(0, 10).map((pool: any) => {
                    const latestDay = pool.poolDayData[0];
                    const tvl = parseFloat(pool.totalValueLockedUSD);
                    const volume24h = latestDay ? parseFloat(latestDay.volumeUSD) : 0;
                    const fees24h = latestDay ? parseFloat(latestDay.feesUSD) : 0;
                    
                    // Estimate APY and risk level
                    const apy = tvl > 0 ? (fees24h * 365 / tvl) * 100 : 0;
                    const risk = apy > 100 ? "High" : apy > 25 ? "Medium" : "Low";
                    
                    return {
                        protocol: "9mm V3",
                        pair: `${pool.token0.symbol}/${pool.token1.symbol}`,
                        apy,
                        risk,
                        chain: "PulseChain",
                        minDeposit: 100
                    };
                }).filter((opp: any) => opp.apy > 0) // Only show pools with positive APY
            }
        };

    } catch (error) {
        console.error('Error fetching analytics data:', error);
        return null; // Will trigger error message
    }
}

export default defiAnalyticsAction; 