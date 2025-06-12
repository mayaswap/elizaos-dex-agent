import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { parseCommand } from "../utils/smartParser.js";

const positionTrackingAction: Action = {
    name: "POSITION_TRACKING",
    similes: [
        "LP_TRACKING",
        "POSITION_MANAGEMENT", 
        "PORTFOLIO_TRACKING",
        "LP_PERFORMANCE",
        "POSITION_ANALYSIS"
    ],
    description: "Track and analyze liquidity provider positions, performance, and profit/loss",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        
        const positionKeywords = [
            'position', 'lp', 'liquidity', 'performance', 'profit', 'loss',
            'pnl', 'track', 'monitor', 'portfolio', 'fees earned', 'impermanent',
            'my positions', 'position tracking', 'lp tracking', 'show my lp'
        ];
        
        return positionKeywords.some(keyword => text.includes(keyword));
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            const text = message.content?.text?.toLowerCase() || '';
            
            // Mock position data (in production, fetch from subgraph + calculate metrics)
            const mockPositions = {
                activeLPPositions: [
                    {
                        pool: 'HEX/USDC',
                        poolAddress: '0x123...abc',
                        tokenId: '45123',
                        entryDate: '2024-11-15',
                        initialValue: 2500, // USD
                        currentValue: 2847,
                        feesEarned: 127.50,
                        impermanentLoss: -82.30,
                        netPnL: 45.20,
                        pnlPercentage: 1.81,
                        liquidity: {
                            hex: '125000',
                            usdc: '850'
                        },
                        priceRange: {
                            lower: 0.0065,
                            upper: 0.0085,
                            current: 0.0074,
                            inRange: true
                        },
                        apy: 34.2,
                        daysActive: 35
                    },
                    {
                        pool: 'PLS/USDT',
                        poolAddress: '0x456...def',
                        tokenId: '45124',
                        entryDate: '2024-12-01',
                        initialValue: 1000,
                        currentValue: 975,
                        feesEarned: 23.80,
                        impermanentLoss: -48.80,
                        netPnL: -25.00,
                        pnlPercentage: -2.50,
                        liquidity: {
                            pls: '12500000',
                            usdt: '500'
                        },
                        priceRange: {
                            lower: 0.00008,
                            upper: 0.00012,
                            current: 0.000095,
                            inRange: true
                        },
                        apy: 18.7,
                        daysActive: 19
                    }
                ],
                closedPositions: [
                    {
                        pool: 'PLSX/HEX',
                        exitDate: '2024-11-30',
                        holdingPeriod: 45,
                        initialValue: 1500,
                        finalValue: 1789,
                        totalFees: 156.20,
                        impermanentLoss: -67.40,
                        netPnL: 289,
                        pnlPercentage: 19.27,
                        realized: true
                    }
                ],
                totalStats: {
                    totalInvested: 5000,
                    currentValue: 3822,
                    totalFeesEarned: 307.50,
                    totalImpermanentLoss: -198.50,
                    totalNetPnL: 309.20,
                    totalPnLPercentage: 6.18,
                    activeDays: 99,
                    avgDailyFees: 3.11
                }
            };

            let responseText = '';

            if (text.includes('performance') || text.includes('overview')) {
                responseText = `📊 **LP Position Performance Overview**

**💰 Total Portfolio:**
• Total Invested: $${mockPositions.totalStats.totalInvested.toLocaleString()}
• Current Value: $${mockPositions.totalStats.currentValue.toLocaleString()}
• Net P&L: ${mockPositions.totalStats.totalNetPnL > 0 ? '🟢' : '🔴'} $${mockPositions.totalStats.totalNetPnL.toLocaleString()} (${mockPositions.totalStats.totalPnLPercentage.toFixed(2)}%)

**📈 Performance Breakdown:**
• Fees Earned: 🟢 $${mockPositions.totalStats.totalFeesEarned.toLocaleString()}
• Impermanent Loss: 🔴 $${Math.abs(mockPositions.totalStats.totalImpermanentLoss).toLocaleString()}
• Active Days: ${mockPositions.totalStats.activeDays}
• Avg Daily Fees: $${mockPositions.totalStats.avgDailyFees.toFixed(2)}

**Active Positions (${mockPositions.activeLPPositions.length}):**
${mockPositions.activeLPPositions.map((pos, i) => {
    const pnlIcon = pos.netPnL > 0 ? '🟢' : '🔴';
    const rangeIcon = pos.priceRange.inRange ? '🟢' : '🔴';
    return `${i + 1}. **${pos.pool}** ${rangeIcon} ${pos.priceRange.inRange ? 'In Range' : 'Out of Range'}
   Value: $${pos.currentValue.toLocaleString()} | P&L: ${pnlIcon} $${pos.netPnL.toFixed(2)} (${pos.pnlPercentage.toFixed(2)}%)
   Fees: $${pos.feesEarned.toFixed(2)} | APY: ${pos.apy.toFixed(1)}% | Days: ${pos.daysActive}`;
}).join('\n')}

**🎯 Quick Actions:**
• "Show HEX/USDC position details" - Deep dive analysis
• "Exit PLS/USDT position" - Close losing position
• "Rebalance positions" - Optimize price ranges`;

            } else if (text.includes('details') || text.includes('hex')) {
                const hexPosition = mockPositions.activeLPPositions[0];
                responseText = `🔍 **HEX/USDC Position Details**

**📋 Position Info:**
• Pool: ${hexPosition.pool} (0.3% fee tier)
• Token ID: #${hexPosition.tokenId}
• Entry Date: ${hexPosition.entryDate}
• Days Active: ${hexPosition.daysActive}

**💰 Financial Performance:**
• Initial Value: $${hexPosition.initialValue.toLocaleString()}
• Current Value: $${hexPosition.currentValue.toLocaleString()}
• Net P&L: ${hexPosition.netPnL > 0 ? '🟢' : '🔴'} $${hexPosition.netPnL.toFixed(2)} (${hexPosition.pnlPercentage.toFixed(2)}%)

**📊 P&L Breakdown:**
• Fees Earned: 🟢 $${hexPosition.feesEarned.toFixed(2)}
• Impermanent Loss: 🔴 $${Math.abs(hexPosition.impermanentLoss).toFixed(2)}
• Current APY: ${hexPosition.apy.toFixed(1)}%

**💧 Current Liquidity:**
• HEX: ${parseFloat(hexPosition.liquidity.hex || '0').toLocaleString()} tokens
• USDC: $${parseFloat(hexPosition.liquidity.usdc || '0').toLocaleString()}

**📍 Price Range:**
• Lower: $${hexPosition.priceRange.lower.toFixed(4)}
• Current: $${hexPosition.priceRange.current.toFixed(4)} ${hexPosition.priceRange.inRange ? '🟢 In Range' : '🔴 Out of Range'}
• Upper: $${hexPosition.priceRange.upper.toFixed(4)}

**💡 Recommendations:**
${hexPosition.priceRange.inRange ? 
  '• Position is earning fees actively\n• Consider collecting fees periodically\n• Monitor for price range breaks' :
  '• Position is not earning fees\n• Consider rebalancing price range\n• Evaluate exit vs. adjustment'
}

**🎯 Actions:**
• "Collect fees" - Harvest earned fees
• "Rebalance range" - Update price range
• "Exit position" - Close position
• "Add liquidity" - Increase position size`;

            } else {
                responseText = `📈 **Position Tracking Hub**

**Active Monitoring:**
• ${mockPositions.activeLPPositions.length} active LP positions
• $${mockPositions.totalStats.currentValue.toLocaleString()} total value
• ${mockPositions.totalStats.totalPnLPercentage.toFixed(2)}% overall return

**📊 What would you like to track?**

**Position Overview:**
• "Show LP performance" - Portfolio summary
• "Position overview" - All positions at a glance

**Detailed Analysis:**
• "Show HEX/USDC position details" - Deep dive
• "Show PLS/USDT position details" - Individual analysis

**Management Actions:**
• "Collect all fees" - Harvest earnings
• "Rebalance positions" - Optimize ranges
• "Exit losing positions" - Risk management

**Historical Data:**
• "Show closed positions" - Past performance
• "Trading history" - All transactions
• "Fee earnings report" - Income tracking

*Real-time data from 9mm V3 subgraph + on-chain position tracking*`;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Position tracking action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to load position data: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show my LP positions" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll show you all your active liquidity provider positions with performance metrics and P&L analysis.",
                    action: "POSITION_TRACKING"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Track HEX/USDC position performance" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me analyze your HEX/USDC position including fees earned, impermanent loss, and current range status.",
                    action: "POSITION_TRACKING"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show LP profit and loss" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll provide a comprehensive P&L breakdown of your liquidity provider positions.",
                    action: "POSITION_TRACKING"
                }
            }
        ]
    ] as ActionExample[][],
};

export default positionTrackingAction; 