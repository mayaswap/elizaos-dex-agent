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
import { NineMmV3FeeTracker } from "../utils/9mm-v3-fee-tracker.js";
import { ethers } from "ethers";

const removeLiquidityAction: Action = {
    name: "REMOVE_LIQUIDITY",
    similes: [
        "WITHDRAW_LIQUIDITY",
        "REMOVE_FROM_POOL",
        "EXIT_POSITION",
        "CLOSE_POSITION",
        "WITHDRAW_LP",
        "REMOVE_LP"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = parseCommand(text);
        
        return parsed.intent === 'removeLiquidity' && parsed.confidence > 0.6;
    },
    description: "Remove liquidity from 9mm V3 positions using natural language commands",
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
            const positionManager = new NineMmV3PositionManager();
            const feeTracker = new NineMmV3FeeTracker();
            
            // For demo purposes, we'll show position discovery
            // In production, this would need user wallet address
            const demoUserAddress = "0x0000000000000000000000000000000000000000";
            
            // If position ID is specified, get specific position
            if (parsed.positionId) {
                const position = await positionManager.getPositionDetails(parsed.positionId);
                
                if (!position) {
                    if (callback) {
                        callback({
                            text: `❌ Position #${parsed.positionId} not found. Please check the position ID and try again.`
                        });
                    }
                    return false;
                }

                // Get position analytics
                const [feeEarnings, performance] = await Promise.all([
                    feeTracker.getFeeEarningsHistory(position.id),
                    feeTracker.getPositionPerformance(position)
                ]);

                const token0 = position.pool.token0.symbol;
                const token1 = position.pool.token1.symbol;
                const feeTierMap: { [key: string]: string } = {
                    '2500': '0.25%',
                    '10000': '1%',
                    '20000': '2%'
                };
                const feeTier = feeTierMap[position.pool.feeTier] || `${parseInt(position.pool.feeTier) / 10000}%`;
                const inRange = positionManager.isPositionInRange(position);

                const responseText = `🔴 **Remove Liquidity from Position #${position.id.slice(0, 8)}...**

📊 **Position Details:**
• Pool: ${token0}/${token1} ${feeTier}
• Status: ${inRange ? '🟢 In Range' : '🔴 Out of Range'}
• Current Value: $${performance.currentValue.totalUSD}

💰 **Performance Summary:**
• Total Fees Earned: $${feeEarnings.totalEarned.usd} (${feeEarnings.earningRate.annualizedAPY.toFixed(2)}% APY)
• Total Return: ${performance.pnl.percentageReturn}% (${performance.pnl.annualizedReturn}% annualized)
• vs HODL: ${performance.vsHodl.outperformance > 0 ? '+' : ''}${performance.vsHodl.outperformance}%
• IL Impact: ${parseFloat(performance.pnl.ilPnL) < 0 ? '-' : '+'}${Math.abs(parseFloat(performance.pnl.ilPnL)).toFixed(2)}%

🎯 **Removal Options:**
${parsed.percentage ? `• Remove ${parsed.percentage}% of position` : '• Remove 100% (full position)'}
• Collect unclaimed fees: ~$${(parseFloat(feeEarnings.totalEarned.usd) * 0.1).toFixed(2)} estimated
• Expected to receive: ${ethers.formatUnits(position.depositedToken0, position.pool.token0.decimals)} ${token0} + ${ethers.formatUnits(position.depositedToken1, position.pool.token1.decimals)} ${token1}

⚠️ **Important Notes:**
• Removing liquidity will stop earning fees
• You'll receive tokens at current pool ratio
• Any unclaimed fees will be collected automatically

*This is a preview. To execute removal, you would need to connect your wallet and sign the transaction.*`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }

                return true;
            }

            // If no position ID, show all positions
            const responseText = `🔍 **Remove Liquidity - Position Selection Required**

To remove liquidity, I need to know which position you want to close.

**How to specify:**
• By position ID: "Remove liquidity from position #12345"
• By percentage: "Remove 50% from position #12345"
• Remove all: "Close all my positions"

**Finding your positions:**
Say "Show my liquidity positions" to see all your active positions with their IDs and performance metrics.

**Out-of-range positions:**
If you have positions that are out of range and not earning fees, you might want to remove and reposition them.

*Note: This would require connecting your wallet to see actual positions.*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Remove liquidity action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to process liquidity removal: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Remove liquidity from position #12345" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll help you remove liquidity from position #12345. Let me fetch the position details and show you the expected returns.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "I want to close my PLS/USDC position" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll help you close your PLS/USDC position. First, let me identify your positions in that pool.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Withdraw 50% of my liquidity from position 789" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll prepare a 50% withdrawal from position #789, showing you the expected tokens and fees you'll receive.",
                    action: "REMOVE_LIQUIDITY"
                }
            }
        ]
    ] as ActionExample[][],
};

export default removeLiquidityAction; 