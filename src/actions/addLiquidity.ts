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
import { NineMmPoolDiscoveryService } from "../utils/9mm-v3-pool-discovery.js";
import { NineMmV3PositionManager } from "../utils/9mm-v3-position-manager.js";
import { POPULAR_TOKENS } from "../config/chains.js";
import { ethers } from "ethers";

const addLiquidityAction: Action = {
    name: "ADD_LIQUIDITY",
    similes: [
        "PROVIDE_LIQUIDITY",
        "ADD_TO_POOL",
        "SUPPLY_LIQUIDITY",
        "BECOME_LP",
        "ADD_LP",
        "CREATE_POSITION"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        return parsed.intent === 'addLiquidity' && parsed.confidence > 0.6;
    },
    description: "Add liquidity to 9mm V3 pools using natural language commands",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        if (!parsed.fromToken || !parsed.toToken) {
            if (callback) {
                callback({
                    text: "I need to know which token pair you want to provide liquidity for. Please specify both tokens. For example: 'Add liquidity to PLS/USDC pool with 1000 USDC'"
                });
            }
            return false;
        }

        try {
            const poolDiscovery = new NineMmPoolDiscoveryService();
            const positionManager = new NineMmV3PositionManager();
            
            // Get token addresses
            const pulsechainTokens = POPULAR_TOKENS.pulsechain;
            const token0Address = pulsechainTokens[parsed.fromToken as keyof typeof pulsechainTokens];
            const token1Address = pulsechainTokens[parsed.toToken as keyof typeof pulsechainTokens];
            
            if (!token0Address || !token1Address) {
                throw new Error(`Token not found: ${parsed.fromToken} or ${parsed.toToken}`);
            }

            // Find available pools
            const pools = await poolDiscovery.getAvailablePools([parsed.fromToken, parsed.toToken]);
            
            // Find the first valid pool for this token pair
            const selectedPool = pools.find(pool => 
                (pool.token0.symbol === parsed.fromToken && pool.token1.symbol === parsed.toToken) ||
                (pool.token0.symbol === parsed.toToken && pool.token1.symbol === parsed.fromToken)
            );

            if (!selectedPool) {
                return {
                    text: `❌ No liquidity pools found for ${parsed.fromToken}/${parsed.toToken} pair.

💡 **Suggested Actions:**
• Check if both tokens exist on 9mm DEX
• Try creating a new pool if you have sufficient liquidity
• Consider other token pairs with better liquidity

🔗 **Create Pool**: Visit [9mm.pro](https://9mm.pro) → Pools → Create`,
                    success: false
                };
            }

            // Format pool info
            const feeTierMap: { [key: string]: string } = {
                '2500': '0.25%',
                '10000': '1%',
                '20000': '2%'
            };
            const feeTier = feeTierMap[selectedPool.feeTier] || `${parseInt(selectedPool.feeTier) / 10000}%`;
            const tvl = parseFloat(selectedPool.totalValueLockedUSD).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
            });

            // Calculate estimated APY based on fees and volume
            const dayData = selectedPool.poolDayData || [];
            const avgDailyFees = dayData.length > 0 
                ? dayData.reduce((sum, day) => sum + parseFloat(day.feesUSD), 0) / dayData.length
                : 0;
            const estimatedAPY = selectedPool.totalValueLockedUSD !== '0' 
                ? (avgDailyFees * 365 / parseFloat(selectedPool.totalValueLockedUSD)) * 100
                : 0;

            // Determine range strategy
            let rangeStrategy = parsed.rangeType || 'moderate';
            let rangeWidth = '';
            switch (rangeStrategy) {
                case 'full':
                    rangeWidth = 'Full Range (Infinite)';
                    break;
                case 'concentrated':
                    rangeWidth = '±5% (Aggressive - Higher returns, more management)';
                    break;
                default:
                    rangeWidth = '±10% (Moderate - Balanced returns and risk)';
            }

            const responseText = `🏊‍♂️ **Liquidity Pool Information**

💰 **Pool: ${parsed.fromToken}/${parsed.toToken}**
• Fee Tier: ${feeTier}
• TVL: ${tvl}
• Pool Address: \`${selectedPool.id}\`

📊 **Performance Metrics:**
• 24h Volume: $${parseFloat(selectedPool.volumeUSD).toLocaleString()}
• 24h Fees: $${parseFloat(selectedPool.feesUSD || '0').toLocaleString()}
• Estimated APY: ${estimatedAPY.toFixed(2)}%

💱 **Current Price:**
• Current Price: ${parseFloat(selectedPool.token0Price).toFixed(6)} ${parsed.toToken} per ${parsed.fromToken}

💰 **Position Details:**
${parsed.amount ? `• Amount: ${parsed.amount} ${parsed.fromToken}` : '• Amount: Not specified'}
• Price Range: ${rangeWidth}

⚡ **Next Steps:**
1. Connect your wallet
2. Approve token spending
3. Add liquidity with selected parameters
4. Monitor position performance

*Note: V3 positions require active management. Out-of-range positions don't earn fees.*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Add liquidity action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to prepare liquidity addition: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Add liquidity to PLS/USDC pool with 1000 USDC" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll help you add liquidity to the PLS/USDC pool. Let me find the best pool options for you.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "I want to provide liquidity for HEX and DAI" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll search for HEX/DAI liquidity pools and show you the best options with current APY rates.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a concentrated position in WPLS/USDT 1% pool" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll set up a concentrated liquidity position in the WPLS/USDT 1% fee tier pool for maximum capital efficiency.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ]
    ] as ActionExample[][],
};

export default addLiquidityAction; 