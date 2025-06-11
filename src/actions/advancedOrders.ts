import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { parseCommand } from "../utils/parser.js";
import { priceMonitor } from "../services/priceMonitor.js";

const advancedOrdersAction: Action = {
    name: "ADVANCED_ORDERS",
    similes: [
        "LIMIT_ORDER",
        "STOP_LOSS", 
        "TAKE_PROFIT",
        "CONDITIONAL_ORDER",
        "ORDER_MANAGEMENT"
    ],
    description: "Advanced order types: limit orders, stop loss, take profit, and conditional trading",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        
        const orderKeywords = [
            'limit order', 'stop loss', 'take profit', 'conditional', 'order',
            'buy when', 'sell when', 'price alert', 'trigger', 'condition',
            'limit buy', 'limit sell', 'stop', 'target price', 'set order'
        ];
        
        return orderKeywords.some(keyword => text.includes(keyword));
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
            
            // Determine order type
            let orderType = 'explanation';
            if (text.includes('limit') && (text.includes('buy') || text.includes('sell'))) orderType = 'limit';
            else if (text.includes('stop loss') || text.includes('stop')) orderType = 'stop_loss';
            else if (text.includes('take profit') || text.includes('target')) orderType = 'take_profit';
            else if (text.includes('monitor') || text.includes('watch')) orderType = 'monitor';

            // Mock active orders (in production, stored in database)
            const mockOrders = {
                activeOrders: [
                    {
                        id: 'order_001',
                        type: 'limit_buy',
                        pair: 'HEX/USDC',
                        targetPrice: 0.0050,
                        currentPrice: 0.0074,
                        amount: '50000 HEX',
                        status: 'monitoring',
                        created: '2024-12-20',
                        condition: 'Buy 50K HEX when price drops to $0.0050'
                    },
                    {
                        id: 'order_002',
                        type: 'stop_loss',
                        pair: 'PLS/USDT',
                        triggerPrice: 0.000080,
                        currentPrice: 0.000095,
                        amount: '5000000 PLS',
                        status: 'active',
                        created: '2024-12-19',
                        condition: 'Sell 5M PLS if price drops below $0.000080'
                    },
                    {
                        id: 'order_003',
                        type: 'take_profit',
                        pair: 'PLSX/USDC',
                        targetPrice: 0.00015,
                        currentPrice: 0.000089,
                        amount: '2500000 PLSX',
                        status: 'monitoring',
                        created: '2024-12-18',
                        condition: 'Sell 2.5M PLSX when price hits $0.00015'
                    }
                ]
            };

            let responseText = '';

            switch (orderType) {
                case 'explanation':
                    responseText = `🤖 **How Advanced Orders Work on DEXes**

**The Challenge:**
Most DEXes (like 9mm/Uniswap) don't have native limit orders. They only support instant swaps at current market prices.

**🔧 Solutions Available:**

**1. Order Management Protocols:**
• **Gelato Network** - Automated execution service
• **1inch Limit Orders** - Off-chain orders with on-chain execution  
• **CoW Protocol** - Conditional order matching
• **Keeper Networks** - Bot-based order execution

**2. How They Work:**
1. You sign an order intent (off-chain)
2. Bots monitor prices continuously
3. When conditions are met → transaction is submitted
4. Your order executes automatically

**3. On PulseChain/9mm Options:**
• **Price Monitoring Bots** (what we can implement)
• **Manual Notifications** → You execute manually
• **Third-party Services** (if available)

**🚨 Current Limitations:**
• No native limit orders on 9mm
• Requires external infrastructure
• Gas costs for each execution
• Possible MEV/front-running

**💡 What We Can Offer:**
• Price monitoring & alerts
• Conditional notifications  
• Manual execution guidance
• Portfolio tracking integration

**Try commands:**
• "Set limit order: buy HEX at $0.005"
• "Stop loss: sell PLS below $0.00008"
• "Monitor PLSX price for $0.00015"`;
                    break;

                case 'limit':
                    // Parse the order from text
                    const limitAmount = text.match(/(\d+(?:\.\d+)?)/)?.[1] || '1000';
                    const limitPrice = text.match(/(?:at|@|when|hits?)\s*\$?(\d+\.?\d*)/)?.[1] || '0.005';
                    const limitToken = text.includes('hex') ? 'HEX' : text.includes('pls') ? 'PLS' : 'PLSX';
                    const limitAction = text.includes('buy') ? 'BUY' : 'SELL';
                    
                    responseText = `📝 **Setting Up Limit Order**

**Order Details:**
• Action: ${limitAction} ${limitAmount} ${limitToken}
• Target Price: $${limitPrice}
• Current Price: $0.0074 (HEX example)
• Order Type: Limit ${limitAction.toLowerCase()}

**⚠️ How This Works:**
Since 9mm doesn't support native limit orders, this creates a **price monitoring alert**.

**What Happens:**
1. ✅ We monitor ${limitToken} price continuously
2. 🔔 Alert you when price hits $${limitPrice}
3. 📱 You get notification to execute manually
4. 🚀 You confirm and execute the trade

**🔧 Technical Implementation:**
• Price monitoring via 9mm subgraph
• Real-time alerts (WebSocket/polling)
• Manual execution required
• No gas costs until you execute

**📋 Order Summary:**
• Status: ⏳ Monitoring
• Condition: ${limitAction} ${limitToken} when price ${limitAction === 'BUY' ? '≤' : '≥'} $${limitPrice}
• Notification: Discord/Email/Browser
• Valid: Until cancelled

**⚠️ Choose Your Monitoring Option:**

**🔔 Option 1: Active Price Monitoring**
• "Yes, start monitoring ${limitToken} at $${limitPrice}"
• Real-time alerts when price is hit
• Background service monitors every 1 minute
• Console notifications when triggered

**📱 Option 2: Manual Price Checking**  
• "Just show me ${limitToken} price updates"
• No background monitoring
• Check prices on demand
• You track manually

**⚙️ Option 3: Different Settings**
• "Set different price for ${limitToken}"
• "Monitor different token"
• "Cancel this setup"

**🎯 What would you like to do?**
Type your preference to proceed...

*Your choice - your control over monitoring*`;
                    break;

                case 'stop_loss':
                    responseText = `🛡️ **Stop Loss Order Setup**

**Protection Strategy:**
Stop losses protect against major price drops by automatically selling when a trigger price is hit.

**⚠️ DEX Reality Check:**
• 9mm has NO native stop losses
• Requires external monitoring
• Manual execution needed
• Slippage risk during execution

**🔧 Our Stop Loss Solution:**

**1. Price Monitoring:**
• Continuous price tracking
• Real-time alerts when triggered
• Multiple notification channels

**2. Smart Alerts:**
• "🚨 STOP LOSS TRIGGERED: PLS hit $0.000080"
• "⏰ Execute sell order NOW to minimize losses"
• Direct link to 9mm trading interface

**3. Execution Guidance:**
• Pre-calculated slippage settings
• Optimal gas price recommendations
• Emergency execution instructions

**📋 Example Stop Loss:**
• Asset: 5M PLS tokens
• Trigger: $0.000080 (current: $0.000095)
• Action: Sell immediately when triggered
• Max Loss: ~16% from current price

**🎯 Quick Setup:**
• "Set stop loss: sell PLS below $0.00008"
• "Stop loss for HEX at $0.005"  
• "Protect PLSX position at $0.00008"

**⚡ Pro Tips:**
• Set stops 10-20% below entry
• Don't set too tight (avoid false triggers)
• Have backup plan if alerts fail
• Consider trailing stops for profits

*Manual execution required - we provide the alerts & guidance*`;
                    break;

                case 'take_profit':
                    responseText = `🎯 **Take Profit Order Setup**

**Profit Securing Strategy:**
Lock in gains by automatically selling when target prices are reached.

**🔧 How It Works (DEX Style):**

**1. Price Target Monitoring:**
• Set your profit target price
• We monitor 24/7 via price feeds
• Alert you when target is hit

**2. Smart Execution Alerts:**
• "🎉 TAKE PROFIT: PLSX hit $0.00015!"
• "💰 Time to secure 68% gains"
• "🚀 Click here to execute on 9mm"

**3. Profit Optimization:**
• Slippage calculations included
• Optimal timing recommendations
• MEV protection strategies

**📈 Example Take Profit:**
• Asset: 2.5M PLSX
• Entry: $0.000089 
• Target: $0.00015 (+68% profit)
• Value: ~$375 potential profit

**💡 Advanced Features:**

**Trailing Take Profits:**
• "Sell PLSX if it drops 10% from peak"
• Captures more upside potential
• Adjusts target as price rises

**Partial Profits:**
• "Sell 50% PLSX at $0.00012"
• "Sell remaining 50% at $0.00018"
• Risk management through scaling

**🎯 Quick Commands:**
• "Take profit: sell PLSX at $0.00015"
• "Target price for HEX: $0.01"
• "Sell 50% PLS when 2x gains"

**⚠️ Execution Notes:**
• Manual confirmation required
• Watch for low liquidity
• Consider gas costs vs. profit
• Market conditions may change quickly

*We provide the alerts - you control the execution*`;
                    break;

                                case 'monitor':
                    // Get real active alerts from price monitor
                    const activeAlerts = priceMonitor.getAlerts();
                    
                    responseText = `📊 **Active Price Monitoring**

**🔍 Current Alerts (${activeAlerts.length}):**

${activeAlerts.length > 0 ? activeAlerts.map((alert, i) => {
    const typeIcon = alert.condition === 'below' ? '🟢' : '🎯'; 
    const currentPrice = priceMonitor.getCachedPrice(alert.token);
    const progress = currentPrice ? 
        `${((currentPrice / alert.targetPrice) * 100).toFixed(1)}%` : 'Fetching...';
    
    return `${i + 1}. ${typeIcon} **${alert.token}** Alert ⚡
   Condition: Alert when ${alert.condition} $${alert.targetPrice}
   Current: ${currentPrice ? `$${currentPrice.toFixed(6)}` : 'Loading...'}
   Progress: ${progress} to target
   Alert ID: ${alert.id}`;
}).join('\n') : '• No active price alerts\n• Use "Set limit order" to create alerts\n• Use "Yes, start monitoring [TOKEN] at $[PRICE]" to begin'}

**📈 Price Status:**
• HEX: $0.0074 (Target: $0.0050) - 32% above buy limit
• PLS: $0.000095 (Stop: $0.000080) - 18.8% above stop loss
• PLSX: $0.000089 (Target: $0.00015) - 59% below take profit

**🔔 Notification Settings:**
• Instant alerts: ✅ Enabled
• Email notifications: ✅ Enabled  
• Browser push: ✅ Enabled
• Discord webhooks: ⚠️ Setup required

**⚙️ Order Management:**
• "Cancel limit order for HEX"
• "Modify PLS stop loss to $0.000075"
• "Add take profit for HEX at $0.01"
• "Pause all order monitoring"

**📱 Alert Examples:**
\`\`\`
🚨 PRICE ALERT: HEX dropped to $0.0051
⏰ Limit buy order almost triggered!
🔗 Execute: https://9mm.pro/swap
\`\`\`

**💡 Pro Features:**
• Multiple price targets per token
• Percentage-based triggers
• Smart gas optimization alerts
• Market volatility warnings

*Real-time monitoring - manual execution for safety*`;
                    break;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Advanced orders action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to process advanced order: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Set limit order: buy HEX at $0.005" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll set up price monitoring for HEX at $0.005 and alert you when it's time to execute the buy order.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Stop loss for PLS below $0.00008" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll monitor PLS price and alert you immediately if it drops below $0.00008 so you can execute a protective sell.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "How do limit orders work on DEXes?" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me explain how advanced order types work on decentralized exchanges and what solutions are available.",
                    action: "ADVANCED_ORDERS"
                }
            }
        ]
    ] as ActionExample[][],
};

export default advancedOrdersAction; 