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

const startMonitoringAction: Action = {
    name: "START_MONITORING",
    similes: [
        "START_PRICE_MONITORING",
        "BEGIN_TRACKING", 
        "ACTIVATE_ALERTS",
        "MONITOR_PRICE",
        "WATCH_TOKEN"
    ],
    description: "Start active price monitoring for tokens when user explicitly chooses to do so",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        
        const monitoringKeywords = [
            'yes, start monitoring', 'start monitoring', 'begin tracking',
            'activate monitoring', 'watch price', 'monitor token',
            'yes, monitor', 'start price alerts', 'track price'
        ];
        
        return monitoringKeywords.some(keyword => text.includes(keyword));
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
            
            // Parse token and price from user's message
            const tokenMatch = text.match(/(?:monitoring|monitor|watch|track)\s+([a-z]+)/i);
            const priceMatch = text.match(/(?:at|@|for|when|hits?)\s*\$?(\d+\.?\d*)/);
            
            const token = tokenMatch?.[1]?.toUpperCase() || 
                         (text.includes('hex') ? 'HEX' : 
                          text.includes('pls') ? 'PLS' : 
                          text.includes('plsx') ? 'PLSX' : 'UNKNOWN');
            
            const targetPrice = priceMatch?.[1] ? parseFloat(priceMatch[1]) : null;
            
            if (token === 'UNKNOWN' || !targetPrice) {
                if (callback) {
                    callback({
                        text: `❌ **Unable to Parse Monitoring Request**

I couldn't extract the token and price from your message.

**Please specify clearly:**
• Token: HEX, PLS, PLSX, or USDC
• Target Price: e.g., $0.005

**Examples:**
• "Yes, start monitoring HEX at $0.005"
• "Monitor PLS for $0.0001"
• "Watch PLSX when it hits $0.00015"

**Try again with clear token and price...**`
                    });
                }
                return true;
            }

            // Determine condition (above/below) based on context
            let condition: 'above' | 'below' = 'below';
            if (text.includes('above') || text.includes('over') || text.includes('hits') || text.includes('reaches')) {
                condition = 'above';
            }

            // Get current price for context
            const currentPrice = priceMonitor.getCachedPrice(token);
            
            // Set up the monitoring
            const alertId = priceMonitor.addAlert({
                token,
                targetPrice,
                condition,
                active: true,
                callback: (currentPrice) => {
                    console.log(`🚨 PRICE ALERT TRIGGERED: ${token} ${condition} $${targetPrice}!`);
                    console.log(`💰 Current Price: $${currentPrice.toFixed(6)}`);
                    console.log(`⏰ Time to take action!`);
                    console.log(`🔗 Trade on 9mm: https://9mm.pro/swap`);
                    
                    // Could add more notification methods here:
                    // - Email
                    // - Discord webhook
                    // - Push notification
                    // - SMS
                }
            });

            const responseText = `✅ **Price Monitoring Activated!**

**📋 Alert Details:**
• Token: ${token}
• Target Price: $${targetPrice}
• Condition: Alert when ${condition} $${targetPrice}
• Current Price: ${currentPrice ? `$${currentPrice.toFixed(6)}` : 'Fetching...'}
• Alert ID: ${alertId}

**🔔 Monitoring Status:**
• ✅ Background monitoring active
• ⏱️ Checking prices every 1 minute  
• 📊 Using 9mm V3 subgraph real-time data
• 🚨 Console alerts when triggered

**📱 What Happens When Triggered:**
1. Console notification with price details
2. Direct link to 9mm trading interface  
3. Recommended action guidance
4. Alert automatically deactivates

**⚙️ Management Commands:**
• "Show my active monitors" - View all alerts
• "Cancel monitoring ${token}" - Stop this alert
• "Pause all monitoring" - Temporary disable
• "Add another alert" - Monitor more tokens

**🎯 Pro Tips:**
• Set realistic price targets
• Don't set too many alerts (performance)
• Check console regularly for notifications
• Have your trading plan ready

*Real-time monitoring now active - you're in control!*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Start monitoring action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to start price monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Yes, start monitoring HEX at $0.005" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll activate real-time price monitoring for HEX at $0.005 and alert you when the target is reached.",
                    action: "START_MONITORING"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Monitor PLS when it hits $0.0001" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Setting up price monitoring for PLS at $0.0001 with real-time alerts when the target price is reached.",
                    action: "START_MONITORING"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Start tracking PLSX price for $0.00015" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Activating background price monitoring for PLSX at $0.00015 with immediate notifications when triggered.",
                    action: "START_MONITORING"
                }
            }
        ]
    ] as ActionExample[][],
};

export default startMonitoringAction; 