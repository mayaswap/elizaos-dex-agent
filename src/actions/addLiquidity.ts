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
            const pools = await poolDiscovery.findPools(token0Address, token1Address);
            
            if (pools.length === 0) {
                if (callback) {
                    callback({
                        text: `❌ No ${parsed.fromToken}/${parsed.toToken} pools found on 9mm V3. This token pair might not have liquidity pools yet.`
                    });
                }
                return false;
            }

            // Sort pools by TVL and volume
            const sortedPools = pools.sort((a, b) => {
                const scoreA = parseFloat(a.totalValueLockedUSD) + parseFloat(a.volumeUSD);
                const scoreB = parseFloat(b.totalValueLockedUSD) + parseFloat(b.volumeUSD);
                return scoreB - scoreA;
            });

            // Use the fee tier if specified, otherwise use the most liquid pool
            let selectedPool = sortedPools[0];
            if (parsed.feeTier) {
                const poolWithFeeTier = pools.find(p => p.feeTier === parsed.feeTier);
                if (poolWithFeeTier) {
                    selectedPool = poolWithFeeTier;
                }
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
                currency: 'USD',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });

            // Calculate estimated APY
            const dayData = selectedPool.poolDayData || [];
            const recentFees = dayData.slice(0, 7).reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
            const avgDailyFees = recentFees / Math.max(dayData.length, 1);
            const estimatedAPY = (avgDailyFees * 365 / parseFloat(selectedPool.totalValueLockedUSD)) * 100;

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

            const responseText = `💧 **Add Liquidity to ${parsed.fromToken}/${parsed.toToken} Pool**

📊 **Selected Pool:**
• Fee Tier: ${feeTier}
• TVL: ${tvl}
• 24h Volume: $${parseFloat(selectedPool.volumeUSD).toLocaleString()}
• Estimated APY: ${estimatedAPY.toFixed(2)}%

💰 **Position Details:**
${parsed.amount ? `• Amount: ${parsed.amount} ${parsed.fromToken}` : '• Amount: Not specified'}
• Price Range: ${rangeWidth}
• Current Price: ${parseFloat(selectedPool.token0Price).toFixed(6)} ${parsed.toToken} per ${parsed.fromToken}

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