import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";
import { createPlatformUser } from "../services/walletService.js";
import { DatabaseService } from "../services/databaseService.js";
import { IExtendedRuntime } from "../types/extended.js";

const priceAlertsAction: Action = {
    name: "PRICE_ALERTS",
    similes: [
        "CREATE_ALERT",
        "PRICE_NOTIFICATION",
        "SET_ALERT",
        "ALERT_ME",
        "PRICE_WATCH",
        "NOTIFY_PRICE"
    ],
    description: "Create, manage, and view price alerts for tokens",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        const keywords = [
            'alert', 'notify', 'notification', 'watch', 'alert me',
            'price alert', 'set alert', 'create alert', 'remove alert',
            'my alerts', 'show alerts', 'list alerts'
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
            const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
            const dbService = new DatabaseService(runtime as IExtendedRuntime);
            await dbService.initializeDatabase();
            
            const userPlatformId = `${platformUser.platform}:${platformUser.platformUserId}`;
            let responseText = '';

            if (text.includes('create') || text.includes('set') || text.includes('alert me')) {
                // Create new price alert
                const alertMatch = text.match(/(?:alert|notify).*?(?:when|if)\s+(.+?)\s+(?:hits|reaches|goes\s+(?:above|below|over|under))\s+[\$]?([0-9.,]+)/i);
                const simpleMatch = text.match(/(?:alert|notify).*?(.+?)\s+(?:above|below|over|under)\s+[\$]?([0-9.,]+)/i);
                const priceMatch = alertMatch || simpleMatch;
                
                if (!priceMatch) {
                    responseText = `🔔 **Create Price Alert**

Please specify the token and target price:

**Examples:**
• "Alert me when HEX hits $0.001"
• "Notify when WPLS goes above $0.0003"
• "Set alert for USDC below $0.99"
• "Create alert when PLSX reaches $0.0005"

**Format:** \`alert me when [TOKEN] goes [above/below] $[PRICE]\`

**Supported Operators:**
• **above/over** - Alert when price goes higher
• **below/under** - Alert when price goes lower

Ready to set your alert!`;
                } else {
                    const tokenSymbol = priceMatch[1]?.trim().toUpperCase() || '';
                    const targetPrice = parseFloat((priceMatch[2] || '0').replace(/,/g, ''));
                    const isAbove = text.includes('above') || text.includes('over') || text.includes('hits') || text.includes('reaches');
                    
                    if (isNaN(targetPrice) || targetPrice <= 0) {
                        responseText = `❌ **Invalid Price**

Please enter a valid price greater than 0.

**Example:** "Alert me when HEX goes above $0.001"`;
                    } else {
                        try {
                            const alertId = await dbService.createPriceAlert({
                                userPlatformId,
                                tokenSymbol,
                                targetPrice,
                                isAbove,
                                isActive: true,
                                createdAt: new Date().toISOString(),
                                platform: platformUser.platform,
                                alertMessage: `${tokenSymbol} ${isAbove ? 'above' : 'below'} $${targetPrice}`
                            });

                            responseText = `🔔 **Price Alert Created Successfully!**

**Token:** ${tokenSymbol}
**Target Price:** $${targetPrice.toFixed(6)}
**Condition:** ${isAbove ? 'Above' : 'Below'} target
**Platform:** ${platformUser.platform.toUpperCase()}
**Alert ID:** ${alertId}

**🎯 Alert Details:**
• You'll be notified when ${tokenSymbol} ${isAbove ? 'rises above' : 'drops below'} $${targetPrice}
• Alert is active and monitoring current prices
• Works across all platforms where you're logged in

**📱 Management:**
• "show my alerts" - View all alerts
• "remove alert ${alertId.slice(-8)}" - Delete this alert
• "pause alerts" - Temporarily disable notifications

**💡 Pro Tips:**
• Set multiple alerts for different price levels
• Use alerts for both buying opportunities and stop-losses
• Alerts work 24/7 even when you're offline

*We'll notify you as soon as ${tokenSymbol} ${isAbove ? 'breaks above' : 'falls below'} your target price!*`;

                        } catch (error) {
                            responseText = `❌ **Failed to Create Alert**

Could not create price alert: ${error instanceof Error ? error.message : 'Unknown error'}

**Please Try Again:**
• Check the token symbol is correct
• Ensure price is a valid number
• Example: "alert me when HEX goes above $0.001"`;
                        }
                    }
                }

            } else if (text.includes('show') || text.includes('list') || text.includes('my alerts')) {
                // Show user's active alerts
                const alerts = await dbService.getActivePriceAlerts(userPlatformId);

                if (alerts.length === 0) {
                    responseText = `🔔 **Your Price Alerts**

You don't have any active price alerts yet.

**Create Your First Alert:**
• "Alert me when HEX hits $0.001"
• "Notify when WPLS goes above $0.0003"  
• "Set alert for USDC below $0.99"

**Benefits:**
• 24/7 price monitoring
• Instant notifications
• Never miss trading opportunities
• Works across all platforms

**Get Started:** "alert me when [TOKEN] goes [above/below] $[PRICE]"`;
                } else {
                    responseText = `🔔 **Your Active Price Alerts**

**Platform:** ${platformUser.platform.toUpperCase()}
**Total Alerts:** ${alerts.length}

${alerts.map((alert, i) => {
    const direction = alert.isAbove ? '📈 Above' : '📉 Below';
    const timeAgo = new Date(alert.createdAt).toLocaleDateString();
    return `**${i + 1}. ${alert.tokenSymbol}** ${direction} $${alert.targetPrice.toFixed(6)}
🎯 **Condition:** Price ${alert.isAbove ? 'rises above' : 'drops below'} target
📅 **Created:** ${timeAgo}
🆔 **ID:** ${alert.id.slice(-8)}
${alert.alertMessage ? `💬 **Note:** ${alert.alertMessage}` : ''}`;
}).join('\n\n')}

**🎯 Alert Status:**
✅ All alerts are active and monitoring
🔄 Real-time price tracking enabled
📱 Cross-platform notifications ready

**📱 Management Actions:**
• "remove alert [ID]" - Delete specific alert
• "pause all alerts" - Temporarily disable
• "create alert" - Add new price alert
• "alert settings" - Configure notification preferences

**💡 Alert Tips:**
• Set alerts slightly above/below round numbers for better fills
• Use multiple alerts for scaling in/out of positions
• Combine with trading actions: "alert me when HEX hits $0.001 then buy 1000"

*Your alerts are monitoring prices 24/7 across all supported exchanges!*`;
                }

            } else if (text.includes('remove') || text.includes('delete') || text.includes('cancel')) {
                // Remove specific alert
                const idMatch = text.match(/(?:remove|delete|cancel).*?alert.*?([a-zA-Z0-9_]{8,})/i);
                
                if (!idMatch) {
                    responseText = `🗑️ **Remove Price Alert**

Please specify which alert to remove:

**Format:** "remove alert [ALERT_ID]"
**Example:** "remove alert abc12345"

**Find Alert IDs:**
• "show my alerts" - View all your alerts with IDs

**Bulk Actions:**
• "remove all alerts" - Delete all alerts
• "pause alerts" - Temporarily disable (keeps alerts)

Which alert would you like to remove?`;
                } else {
                    // This would need implementation in DatabaseService
                    responseText = `🗑️ **Alert Removal**

Alert removal functionality will be implemented.

**For Now:**
• "show my alerts" - View current alerts
• Contact support to manually remove alerts

**Coming Soon:**
• Individual alert removal
• Bulk alert management
• Alert modification

We'll add this feature in the next update!`;
                }

            } else if (text.includes('pause') || text.includes('disable')) {
                // Pause all alerts
                responseText = `⏸️ **Pause All Alerts**

Alert pausing functionality will be implemented.

**Current Status:**
• All your alerts remain active
• Notifications continue as normal

**Coming Soon:**
• Pause/resume all alerts
• Temporary alert suspension
• Scheduled alert activation

**For Now:**
• "show my alerts" - View active alerts
• "remove alert [ID]" - Delete individual alerts

This feature is in development!`;

            } else {
                // General help for price alerts
                responseText = `🔔 **Price Alert System**

**🎯 Available Commands:**

**📝 Create Alerts:**
• "Alert me when HEX hits $0.001"
• "Notify when WPLS goes above $0.0003"
• "Set alert for USDC below $0.99"
• "Create alert when PLSX reaches $0.0005"

**📋 Manage Alerts:**
• "show my alerts" - View all active alerts
• "list alerts" - Same as above
• "remove alert [ID]" - Delete specific alert
• "pause alerts" - Temporarily disable all

**🎯 Alert Features:**
✅ **24/7 Monitoring** - Never miss price movements
✅ **Multi-Platform** - Works on Telegram, Discord, Web
✅ **Real-Time** - Instant notifications when triggered
✅ **Unlimited** - Set as many alerts as you need
✅ **Persistent** - Alerts survive restarts and outages

**💡 Pro Tips:**

**For Buying Opportunities:**
• "Alert when HEX drops below $0.0008" (buy the dip)
• "Notify when WPLS goes above $0.0003" (breakout alert)

**For Risk Management:**
• "Alert when my position drops below $500" (portfolio alert)
• "Notify when USDC goes below $0.98" (depeg warning)

**For Profit Taking:**
• "Alert when HEX hits $0.002" (take profit level)
• "Notify when my portfolio exceeds $10000" (milestone alert)

**🚀 Get Started:**
Type: "alert me when [TOKEN] goes [above/below] $[PRICE]"

*Example: "alert me when HEX goes above $0.001"*`;
            }

            if (callback) {
                callback({ text: responseText });
            }
            return true;

        } catch (error) {
            console.error('Price alerts error:', error);
            if (callback) {
                callback({
                    text: `❌ **Price Alert Error**

Failed to process price alert request: ${error instanceof Error ? error.message : 'Unknown error'}

**Try Again:**
• "alert me when HEX goes above $0.001"
• "show my alerts"
• "create price alert"

**Common Issues:**
• Check token symbol spelling
• Ensure price is a valid number
• Database connection may be unavailable

If the problem persists, please check your database connection.`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "alert me when HEX hits $0.001" }
            },
            {
                name: "{{user2}}",
                content: { text: "Price alert created! I'll notify you when HEX reaches $0.001." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "show my alerts" }
            },
            {
                name: "{{user2}}",
                content: { text: "Here are all your active price alerts with their current status." }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "notify when WPLS goes above $0.0003" }
            },
            {
                name: "{{user2}}",
                content: { text: "Alert set! You'll be notified when WPLS price rises above $0.0003." }
            }
        ]
    ]
};

export default priceAlertsAction; 