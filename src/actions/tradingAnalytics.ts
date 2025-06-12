import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { parseCommand } from "../utils/smartParser.js";
import { createPlatformUser } from "../services/walletService.js";
import { DatabaseService } from "../services/databaseService.js";

const tradingAnalyticsAction: Action = {
    name: "TRADING_ANALYTICS",
    similes: [
        "TRADING_HISTORY",
        "TRADE_STATS",
        "PERFORMANCE_METRICS",
        "TRADING_REPORT",
        "MY_TRADES",
        "TRADE_ANALYTICS"
    ],
    description: "View comprehensive trading history, performance metrics, and analytics",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        const keywords = [
            'trading history', 'trade history', 'my trades', 'trading stats',
            'performance', 'analytics', 'trading report', 'trade stats',
            'show trades', 'recent trades', 'trading metrics'
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
            
            let responseText = '';

            if (text.includes('recent') || text.includes('history') || text.includes('show trades')) {
                // Show recent trading history
                const trades = await dbService.getTradingHistory(
                    `${platformUser.platform}:${platformUser.platformUserId}`, 
                    20
                );

                if (trades.length === 0) {
                    responseText = `📊 **Trading History**

No trades found for your account on ${platformUser.platform.toUpperCase()}.

**Start Trading:**
• "swap 100 USDC for HEX" - Execute your first trade
• "price HEX" - Check current prices
• "create price alert" - Set up alerts

Your trades will be automatically tracked and analyzed!`;
                } else {
                    const successfulTrades = trades.filter(t => t.success).length;
                    const failedTrades = trades.length - successfulTrades;
                    const successRate = ((successfulTrades / trades.length) * 100).toFixed(1);

                    responseText = `📊 **Trading History & Analytics**

**📈 Overview:**
• **Total Trades:** ${trades.length}
• **Successful:** ${successfulTrades} (${successRate}%)
• **Failed:** ${failedTrades}
• **Platform:** ${platformUser.platform.toUpperCase()}

**🔄 Recent Trades:**
${trades.slice(0, 10).map((trade, i) => {
    const status = trade.success ? '✅' : '❌';
    const timeAgo = new Date(trade.timestamp).toLocaleDateString();
    return `${i + 1}. ${status} ${trade.fromToken} → ${trade.toToken}
   📊 In: ${parseFloat(trade.amountIn).toFixed(4)} | Out: ${parseFloat(trade.amountOut).toFixed(4)}
   ⛽ Gas: ${trade.gasCost || 'N/A'} | 📅 ${timeAgo}
   ${trade.dexUsed ? `🔗 DEX: ${trade.dexUsed}` : ''}`;
}).join('\n\n')}

**💡 Trading Insights:**
• **Best Performing Tokens:** ${getMostTradedTokens(trades).join(', ')}
• **Average Slippage:** ${getAverageSlippage(trades).toFixed(2)}%
• **Gas Efficiency:** ${trades.filter(t => t.gasCost).length}/${trades.length} trades tracked

**📱 Actions:**
• "trading stats" - Detailed performance metrics
• "set price alert for HEX" - Monitor your tokens
• "show portfolio" - Current holdings`;
                }

            } else if (text.includes('stats') || text.includes('performance') || text.includes('metrics')) {
                // Show detailed performance metrics
                const trades = await dbService.getTradingHistory(
                    `${platformUser.platform}:${platformUser.platformUserId}`, 
                    100
                );

                if (trades.length === 0) {
                    responseText = `📈 **Performance Metrics**

No trading data available yet.

**Get Started:**
• Execute some trades to build your performance history
• Analytics will automatically track your success rate
• Compare your performance across different tokens

Start trading to see your metrics!`;
                } else {
                    const metrics = calculatePerformanceMetrics(trades);
                    
                    responseText = `📈 **Detailed Performance Metrics**

**🎯 Overall Performance:**
• **Total Trades:** ${metrics.totalTrades}
• **Success Rate:** ${metrics.successRate.toFixed(1)}%
• **Total Volume:** $${metrics.totalVolumeUSD.toFixed(2)}
• **Average Trade Size:** $${metrics.averageTradeSize.toFixed(2)}

**⛽ Gas Efficiency:**
• **Total Gas Costs:** $${metrics.totalGasCosts.toFixed(2)}
• **Average Gas per Trade:** $${metrics.averageGas.toFixed(2)}
• **Gas/Volume Ratio:** ${(metrics.totalGasCosts / metrics.totalVolumeUSD * 100).toFixed(2)}%

**🔄 Trading Patterns:**
• **Most Active Day:** ${metrics.mostActiveDay}
• **Favorite Token Pair:** ${metrics.favoriteTokenPair}
• **Average Slippage:** ${metrics.averageSlippage.toFixed(2)}%

**🏆 Best Trades:**
${metrics.bestTrades.map((trade, i) => 
    `${i + 1}. ${trade.fromToken} → ${trade.toToken} (${new Date(trade.timestamp).toLocaleDateString()})`
).join('\n')}

**⚠️ Areas for Improvement:**
• ${metrics.improvements.join('\n• ')}

**💡 Recommendations:**
• ${metrics.recommendations.join('\n• ')}

**📊 Want More Details?**
• "recent trades" - View latest transactions
• "trading report monthly" - Period-specific analysis
• "gas optimization tips" - Reduce trading costs`;
                }

            } else if (text.includes('report')) {
                // Generate comprehensive trading report
                const period = text.includes('weekly') ? 'weekly' : 
                             text.includes('monthly') ? 'monthly' : 'all-time';
                
                const trades = await dbService.getTradingHistory(
                    `${platformUser.platform}:${platformUser.platformUserId}`, 
                    period === 'weekly' ? 50 : period === 'monthly' ? 200 : 500
                );

                const report = generateTradingReport(trades, period);
                
                responseText = `📋 **${period.toUpperCase()} Trading Report**

**📊 Executive Summary:**
• **Period:** ${report.period}
• **Total Trades:** ${report.totalTrades}
• **Success Rate:** ${report.successRate}%
• **Net Performance:** ${report.netPerformance}

**💰 Financial Summary:**
• **Total Volume:** $${report.totalVolume.toFixed(2)}
• **Gas Costs:** $${report.totalGasCosts.toFixed(2)}
• **Efficiency Ratio:** ${report.efficiencyRatio.toFixed(2)}%

**🎯 Top Insights:**
${report.insights.map(insight => `• ${insight}`).join('\n')}

**📈 Performance Trends:**
${report.trends.map(trend => `• ${trend}`).join('\n')}

**🔮 Recommendations:**
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

**📱 Export Options:**
• "detailed trading history" - Full transaction list
• "portfolio analysis" - Current holdings breakdown
• "set trading goals" - Performance targets`;
            }

            if (callback) {
                callback({ text: responseText });
            }
            return true;

        } catch (error) {
            console.error('Trading analytics error:', error);
            if (callback) {
                callback({
                    text: `❌ **Analytics Error**

Failed to retrieve trading analytics: ${error instanceof Error ? error.message : 'Unknown error'}

**Try Again:**
• "recent trades" - View transaction history
• "trading stats" - Performance metrics
• "my trades" - Trading overview

If the issue persists, please check your database connection.`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "show my trading history" }
            },
            {
                user: "{{user2}}",
                content: { text: "Here's your complete trading history with performance analytics and insights." }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "trading performance stats" }
            },
            {
                user: "{{user2}}",
                content: { text: "Your trading performance metrics including success rate, gas efficiency, and recommendations." }
            }
        ]
    ]
};

// Helper functions for analytics
function getMostTradedTokens(trades: any[]): string[] {
    const tokenCounts: Record<string, number> = {};
    trades.forEach(trade => {
        tokenCounts[trade.fromToken] = (tokenCounts[trade.fromToken] || 0) + 1;
        tokenCounts[trade.toToken] = (tokenCounts[trade.toToken] || 0) + 1;
    });
    
    return Object.entries(tokenCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([token]) => token);
}

function getAverageSlippage(trades: any[]): number {
    const slippages = trades.filter(t => t.slippageUsed).map(t => t.slippageUsed);
    return slippages.length > 0 ? slippages.reduce((a, b) => a + b, 0) / slippages.length : 0;
}

function calculatePerformanceMetrics(trades: any[]) {
    const successful = trades.filter(t => t.success);
    const totalGas = trades.filter(t => t.gasCost).reduce((sum, t) => sum + parseFloat(t.gasCost), 0);
    
    // Calculate most active day
    const dayFrequency: Record<string, number> = {};
    trades.forEach(trade => {
        const day = new Date(trade.timestamp).toLocaleDateString('en-US', { weekday: 'long' });
        dayFrequency[day] = (dayFrequency[day] || 0) + 1;
    });
    const mostActiveDay = Object.entries(dayFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';
    
    // Calculate favorite token pair
    const pairFrequency: Record<string, number> = {};
    trades.forEach(trade => {
        const pair = `${trade.fromToken}/${trade.toToken}`;
        pairFrequency[pair] = (pairFrequency[pair] || 0) + 1;
    });
    const favoriteTokenPair = Object.entries(pairFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'No data';
    
    // Calculate total volume (simplified - would need price data for accuracy)
    const totalVolumeUSD = trades.reduce((sum, trade) => {
        // Estimate based on token amounts - would need real price data
        const estimatedValue = parseFloat(trade.amountIn) * 10; // Placeholder multiplier
        return sum + estimatedValue;
    }, 0);
    
    const averageTradeSize = totalVolumeUSD / trades.length;
    
    return {
        totalTrades: trades.length,
        successRate: trades.length > 0 ? (successful.length / trades.length) * 100 : 0,
        totalVolumeUSD: totalVolumeUSD,
        averageTradeSize: averageTradeSize,
        totalGasCosts: totalGas,
        averageGas: trades.length > 0 ? totalGas / trades.length : 0,
        mostActiveDay: mostActiveDay,
        favoriteTokenPair: favoriteTokenPair,
        averageSlippage: getAverageSlippage(trades),
        bestTrades: trades.filter(t => t.success).slice(0, 3),
        improvements: [
            "Consider setting lower slippage tolerance",
            "Monitor gas prices for optimal timing"
        ],
        recommendations: [
            "Set up price alerts for better entry points",
            "Review failed trades for patterns"
        ]
    };
}

function generateTradingReport(trades: any[], period: string) {
    const successful = trades.filter(t => t.success);
    const successRate = trades.length > 0 ? (successful.length / trades.length) * 100 : 0;
    
    // Calculate net performance
    const netPerformance = successRate >= 50 ? "Positive" : "Needs Improvement";
    
    // Calculate total volume (simplified estimation)
    const totalVolume = trades.reduce((sum, trade) => {
        const estimatedValue = parseFloat(trade.amountIn) * 10; // Placeholder multiplier
        return sum + estimatedValue;
    }, 0);
    
    const totalGasCosts = trades.reduce((sum, t) => sum + parseFloat(t.gasCost || '0'), 0);
    
    // Calculate efficiency ratio (successful trades value vs gas costs)
    const efficiencyRatio = totalVolume > 0 ? ((totalVolume - totalGasCosts) / totalVolume * 100) : 0;
    
    // Generate dynamic insights based on data
    const insights: string[] = [];
    if (successRate > 70) insights.push("Excellent success rate - maintain current strategy");
    if (successRate < 50) insights.push("Success rate below 50% - consider reviewing trade sizes");
    if (totalGasCosts > totalVolume * 0.05) insights.push("High gas costs relative to volume");
    if (trades.length > 50) insights.push("High trading activity detected");
    
    // Generate dynamic trends
    const trends: string[] = [];
    if (trades.length > 0) {
        const recentTrades = trades.slice(0, Math.min(10, trades.length));
        const recentSuccessRate = (recentTrades.filter(t => t.success).length / recentTrades.length) * 100;
        if (recentSuccessRate > successRate) trends.push("Success rate improving recently");
        else if (recentSuccessRate < successRate) trends.push("Success rate declining recently");
    }
    trends.push(`Average of ${(trades.length / 30).toFixed(1)} trades per day`);
    
    // Generate dynamic recommendations
    const recommendations: string[] = [];
    if (successRate < 60) recommendations.push("Focus on fewer, higher-quality trades");
    if (totalGasCosts > totalVolume * 0.1) recommendations.push("Consider trading during low gas periods");
    recommendations.push("Use price alerts to time entries better");
    
    return {
        period: period,
        totalTrades: trades.length,
        successRate: successRate.toFixed(1),
        netPerformance: netPerformance,
        totalVolume: totalVolume,
        totalGasCosts: totalGasCosts,
        efficiencyRatio: efficiencyRatio,
        insights: insights.length > 0 ? insights : ["Building trading history..."],
        trends: trends,
        recommendations: recommendations
    };
}

export default tradingAnalyticsAction; 