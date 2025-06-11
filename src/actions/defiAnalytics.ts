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
import { GraphQLClient, gql } from 'graphql-request';

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
        const text = message.content.text.toLowerCase();
        const analyticsKeywords = ['analytics', 'dashboard', 'market', 'overview', 'trending', 'top', 'best'];
        const defiKeywords = ['defi', 'tokens', 'pools', 'yield', 'apy', 'tvl', 'volume'];
        
        return analyticsKeywords.some(keyword => text.includes(keyword)) && 
               (defiKeywords.some(keyword => text.includes(keyword)) || text.includes('show'));
    },
    description: "Show comprehensive DeFi market analytics, trending tokens, and yield opportunities",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content.text.toLowerCase();
            
            // Data Source: 9mm V3 Subgraph (PulseChain only)
            const subgraphUrl = "https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest";
            const client = new GraphQLClient(subgraphUrl);
            
            // Determine what type of analytics to show
            let analyticsType = 'overview';
            if (text.includes('token')) analyticsType = 'tokens';
            else if (text.includes('pool')) analyticsType = 'pools';
            else if (text.includes('yield') || text.includes('apy')) analyticsType = 'yield';
            else if (text.includes('trending')) analyticsType = 'trending';

            // Query real data from 9mm subgraph
            const analyticsData = await getAnalyticsData(client, analyticsType);

            let responseText = '';

            if (!analyticsData) {
                if (callback) {
                    callback({
                        text: `❌ **Unable to Load DeFi Analytics**

Sorry, I couldn't retrieve market data from the 9mm subgraph right now.

**Possible reasons:**
• Network connectivity issues
• 9mm subgraph temporarily unavailable  
• PulseChain RPC issues

**Try again:** "Show market analytics" or "Trending tokens"

*No mock data shown - only real market data*`
                    });
                }
                return true;
            }

            switch (analyticsType) {
                case 'overview':
                    const overview = analyticsData.overview;
                    responseText = `📊 **PulseChain DeFi Overview**

🌐 **9mm V3 Protocol Metrics**:
• Total TVL: $${(overview.totalTvl / 1e6).toFixed(2)}M
• 24h Volume: $${(overview.totalVolume24h / 1e6).toFixed(2)}M
• Active Pools: ${overview.totalPools}
• Network: PulseChain

🔝 **Top Pools by TVL**:
${overview.topPools.map((pool, i) => {
    return `${i + 1}. **${pool.pair}**: $${(pool.tvl / 1e6).toFixed(2)}M TVL
   Volume: $${(pool.volume24h / 1e3).toFixed(1)}K | Fee: ${pool.feeTier / 10000}%`;
}).join('\n')}

📈 **Data Source**: Real-time from 9mm V3 Subgraph

**Detailed Analytics:**
• "Show trending tokens" - Top performing tokens
• "Best yield opportunities" - Highest APY pools
• "Show trending pools" - Most active liquidity pools`;
                    break;

                case 'tokens':
                case 'trending':
                    const trending = analyticsData.trending;
                    responseText = `🚀 **Trending Pools on PulseChain**

🏊 **Top Pools by Volume & APY**:
${trending.pools.map((pool, i) => {
    return `${i + 1}. **${pool.pair}** (${pool.chain})
   Est. APY: ${pool.apy.toFixed(1)}% | TVL: $${(pool.tvl / 1e6).toFixed(1)}M | Vol: $${(pool.volume24h / 1e6).toFixed(1)}M`;
}).join('\n')}

🎯 **Pool Opportunities**:
• High yield pools: ${trending.pools.filter(p => p.apy > 50).length} pools offering >50% APY
• Large liquidity: ${trending.pools.filter(p => p.tvl > 1e6).length} pools with >$1M TVL
• Active trading: ${trending.pools.filter(p => p.volume24h > 100000).length} pools with >$100K daily volume

**Note**: Token-specific data requires individual token queries
**Data Source**: 9mm V3 Subgraph real-time

**Quick Actions:**
• "Add liquidity to [PAIR]" - Join any pool above
• "Show pool details" - Deep dive analysis`;
                    break;

                case 'yield':
                    const yield_data = analyticsData.yield;
                    responseText = `🌾 **Best Yield Opportunities**

💰 **Top APY Pools** (Updated real-time):
${yield_data.opportunities.map((opp, i) => {
    const riskColor = opp.risk === 'Low' ? '🟢' : opp.risk === 'Medium' ? '🟡' : '🔴';
    return `${i + 1}. **${opp.pair}** on ${opp.protocol}
   APY: ${opp.apy.toFixed(1)}% | Risk: ${riskColor} ${opp.risk} | Chain: ${opp.chain}
   Min Deposit: $${opp.minDeposit} | Est. Daily: $${((opp.minDeposit * opp.apy / 100) / 365).toFixed(2)}`;
}).join('\n')}

📊 **Yield Strategy Recommendations**:
• **Conservative**: ${yield_data.opportunities.filter(o => o.risk === 'Low')[0]?.pair} (${yield_data.opportunities.filter(o => o.risk === 'Low')[0]?.apy.toFixed(1)}% APY)
• **Balanced**: ${yield_data.opportunities.filter(o => o.risk === 'Medium')[0]?.pair} (${yield_data.opportunities.filter(o => o.risk === 'Medium')[0]?.apy.toFixed(1)}% APY)  
• **Aggressive**: ${yield_data.opportunities.filter(o => o.risk === 'High')[0]?.pair} (${yield_data.opportunities.filter(o => o.risk === 'High')[0]?.apy.toFixed(1)}% APY)

⚠️ **Risk Assessment**:
• High APY often means higher impermanent loss risk
• Check token volatility before providing liquidity
• Diversify across multiple pools to reduce risk

**Get Started:**
• "Add liquidity to [pair]" - Join any pool
• "Show [pool] details" - Deep dive into specific pool
• "Calculate impermanent loss" - Risk analysis tool`;
                    break;

                default:
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
                    break;
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
                user: "{{user1}}",
                content: { text: "Show market analytics" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll show you comprehensive DeFi market analytics including TVL, volume, and trending opportunities across all chains.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Best yield opportunities" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me find the highest APY yield farming opportunities with risk assessments across all supported networks.",
                    action: "DEFI_ANALYTICS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Trending tokens" }
            },
            {
                user: "{{agent}}",
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