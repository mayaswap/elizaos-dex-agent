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
import { WalletService, createPlatformUser } from "../services/walletService.js";

const slippageManagementAction: Action = {
    name: "SLIPPAGE_MANAGEMENT",
    similes: [
        "SET_SLIPPAGE",
        "SLIPPAGE_TOLERANCE",
        "TRADE_SETTINGS",
        "EXECUTION_SETTINGS",
        "SLIPPAGE_CONFIG",
        "MEV_PROTECTION"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        const slippageKeywords = ['slippage', 'tolerance', 'protection', 'mev', 'execution'];
        const actionKeywords = ['set', 'change', 'update', 'configure', 'use', 'enable', 'disable'];
        
        return slippageKeywords.some(keyword => text.includes(keyword)) && 
               (actionKeywords.some(keyword => text.includes(keyword)) || text.includes('%'));
    },
    description: "Configure slippage tolerance and trade execution settings for optimal trading",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content?.text?.toLowerCase() || '';
            
            // Parse slippage percentage from message
            const percentageMatch = text.match(/(\d+(?:\.\d+)?)\s*%/);
            const requestedSlippage = percentageMatch?.[1] ? parseFloat(percentageMatch[1]) : null;
            
            // Get platform user and wallet settings
            const platformUser = createPlatformUser(runtime as any, message);
            const walletService = new WalletService(runtime as any);
            
            const activeWallet = await walletService.getActiveWallet(platformUser);
            
            if (!activeWallet) {
                if (callback) {
                    callback({
                        text: `❌ **No Active Wallet**

Please create a wallet first before managing slippage settings.

**Quick Setup:**
• "Create a wallet" to get started
• "Import wallet" if you have an existing one

Each wallet has its own independent slippage settings stored securely.`
                    });
                }
                return true;
            }
            
            // Use wallet settings from the new system
            const persistentSettings = activeWallet.settings || {
                slippagePercentage: 0.5,
                mevProtection: true,
                autoSlippage: false,
                transactionDeadline: 20
            };
            
            const currentSettings = {
                slippage: persistentSettings.slippagePercentage,
                mevProtection: persistentSettings.mevProtection,
                autoSlippage: persistentSettings.autoSlippage,
                maxSlippage: 5.0, // Hard-coded max for safety
                frontrunProtection: persistentSettings.mevProtection, // Same as MEV protection
                deadline: persistentSettings.transactionDeadline
            };

            // Handle slippage setting
            if (requestedSlippage !== null) {
                // Validate slippage range
                if (requestedSlippage < 0.1 || requestedSlippage > 50) {
                    if (callback) {
                        callback({
                            text: `⚠️ **Invalid Slippage Setting**

❌ **${requestedSlippage}% is outside safe range**

**Recommended Slippage Ranges:**
• 🟢 **Low Risk**: 0.1% - 0.5% (for stable pairs, may fail in volatile markets)
• 🟡 **Moderate**: 0.5% - 2% (balanced approach, works for most trades)
• 🔴 **High Risk**: 2% - 5% (volatile tokens, higher MEV risk)
• 💀 **Dangerous**: 5%+ (extreme cases only, high MEV risk)

**Safe Range**: 0.1% - 50%
**Current Setting**: ${currentSettings.slippage}%

Try: "Set slippage to 1%" or "Use 0.3% slippage"`
                        });
                    }
                    return true;
                }

                // Categorize slippage level
                let riskLevel = '';
                let advice = '';
                
                if (requestedSlippage <= 0.5) {
                    riskLevel = '🟢 LOW RISK';
                    advice = 'Great for stable pairs and large liquidity pools. May fail during high volatility.';
                } else if (requestedSlippage <= 2) {
                    riskLevel = '🟡 MODERATE RISK';
                    advice = 'Balanced setting that works for most trades. Good protection with reasonable execution.';
                } else if (requestedSlippage <= 5) {
                    riskLevel = '🔴 HIGH RISK';
                    advice = 'Use for volatile tokens or small liquidity pools. Higher MEV exposure.';
                } else {
                    riskLevel = '💀 EXTREME RISK';
                    advice = 'Only for emergency situations. Very high MEV risk and potential for sandwich attacks.';
                }

                // Save the updated slippage setting
                await walletService.updateWalletSettings(platformUser, activeWallet.id, { slippagePercentage: requestedSlippage });

                const responseText = `⚙️ **Slippage Updated - ${requestedSlippage}%**

✅ **Slippage tolerance set to ${requestedSlippage}% (Saved)**

📊 **Risk Assessment**: ${riskLevel}
💡 **Advice**: ${advice}

🔧 **Current Trading Settings**:
• Slippage Tolerance: ${requestedSlippage}%
• MEV Protection: ${currentSettings.mevProtection ? '✅ Enabled' : '❌ Disabled'}
• Auto Slippage: ${currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled'}
• Max Slippage Cap: ${currentSettings.maxSlippage}%
• Transaction Deadline: ${currentSettings.deadline} minutes

📈 **Trade Impact**:
For a $1,000 trade, you might receive ${(1000 * (1 - requestedSlippage/100)).toFixed(2)} - $1,000 worth of tokens.

**Other Settings:**
• "Enable MEV protection" - Protect against front-running
• "Set auto slippage" - Dynamic slippage based on market conditions
• "Use high slippage protection" - Extra sandwich attack protection`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Handle MEV protection commands
            if (text.includes('mev') || text.includes('frontrun') || text.includes('sandwich')) {
                const enable = text.includes('enable') || text.includes('turn on') || text.includes('activate');
                const disable = text.includes('disable') || text.includes('turn off') || text.includes('deactivate');
                
                if (enable || disable) {
                    const newStatus = enable;
                    
                    // Save MEV protection setting
                    await walletService.updateWalletSettings(platformUser, activeWallet.id, { 
                        mevProtection: newStatus
                    });
                    
                    const responseText = `🛡️ **MEV Protection ${newStatus ? 'Enabled' : 'Disabled'}**

${newStatus ? '✅' : '❌'} **MEV Protection is now ${newStatus ? 'ACTIVE' : 'INACTIVE'}**

**What this means:**
${newStatus ? 
`• 🛡️ Protection against front-running attacks
• 🔒 Sandwich attack detection and prevention
• ⏱️ Private mempool routing when possible
• 📊 Dynamic slippage adjustment for suspicious activity` :
`• ⚠️ No protection against MEV attacks
• 🎯 Vulnerable to front-running and sandwich attacks
• 💰 Potentially worse execution prices
• 🚨 Higher risk of failed transactions`}

🔧 **Current Settings**:
• MEV Protection: ${newStatus ? '✅ Enabled' : '❌ Disabled'}
• Slippage Tolerance: ${currentSettings.slippage}%
• Front-run Protection: ${newStatus ? '✅ Active' : '❌ Inactive'}

💡 **Recommendation**: ${newStatus ? 'Keep MEV protection enabled for safer trading' : 'Enable MEV protection to avoid sandwich attacks'}`;

                    if (callback) {
                        callback({
                            text: responseText
                        });
                    }
                    return true;
                }
            }

            // Handle auto slippage commands
            if (text.includes('auto') && text.includes('slippage')) {
                const enable = text.includes('enable') || text.includes('turn on') || text.includes('set');
                
                // Save auto slippage setting if enabling
                if (enable) {
                    await walletService.updateWalletSettings(platformUser, activeWallet.id, { autoSlippage: true });
                }
                
                const responseText = `🤖 **Auto Slippage ${enable ? 'Enabled' : 'Status'}**

${enable ? '✅ **Auto Slippage is now ACTIVE**' : `ℹ️ **Auto Slippage is currently ${currentSettings.autoSlippage ? 'ENABLED' : 'DISABLED'}**`}

**How Auto Slippage Works:**
• 📊 Analyzes real-time market conditions
• 🎯 Adjusts slippage based on token volatility
• 🔄 Uses higher slippage for volatile/low-liquidity tokens
• 🛡️ Maintains minimum slippage for MEV protection

**Dynamic Ranges:**
• Stable pairs (USDC/USDT): 0.1% - 0.3%
• Major tokens (ETH/BTC): 0.3% - 1%
• Alt tokens: 1% - 3%
• Micro-cap tokens: 2% - 5%

🔧 **Settings:**
• Auto Slippage: ${enable ? '✅ Enabled' : currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled'}
• Max Auto Slippage: ${currentSettings.maxSlippage}%
• Base Slippage: ${currentSettings.slippage}%

**Manual Override:**
You can still set specific slippage with "Set slippage to X%" for individual trades.`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Show current settings
            if (text.includes('show') || text.includes('current') || text.includes('settings')) {
                const responseText = `⚙️ **Current Trading Settings**

🎯 **Slippage Configuration:**
• Tolerance: ${currentSettings.slippage}%
• Auto Slippage: ${currentSettings.autoSlippage ? '✅ Enabled' : '❌ Disabled'}
• Max Slippage: ${currentSettings.maxSlippage}%

🛡️ **Protection Settings:**
• MEV Protection: ${currentSettings.mevProtection ? '✅ Enabled' : '❌ Disabled'}
• Front-run Protection: ${currentSettings.frontrunProtection ? '✅ Enabled' : '❌ Disabled'}
• Transaction Deadline: ${currentSettings.deadline} minutes

📊 **Risk Level**: ${currentSettings.slippage <= 0.5 ? '🟢 LOW' : 
                   currentSettings.slippage <= 2 ? '🟡 MODERATE' : 
                   currentSettings.slippage <= 5 ? '🔴 HIGH' : '💀 EXTREME'}

**Quick Commands:**
• "Set slippage to 1%" - Change slippage tolerance
• "Enable MEV protection" - Turn on sandwich attack protection
• "Enable auto slippage" - Dynamic slippage based on market conditions
• "Use high slippage protection" - Maximum protection settings

💡 **Tip**: Lower slippage = safer trades but higher chance of failure during volatility`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Default help message
            if (callback) {
                callback({
                    text: `⚙️ **Slippage & Trade Settings**

I can help you optimize your trading execution! Try:

**Set Slippage:**
• "Set slippage to 0.5%" - Conservative setting
• "Use 1% slippage" - Moderate setting
• "Set slippage to 2%" - For volatile tokens

**Protection Settings:**
• "Enable MEV protection" - Protect against sandwich attacks
• "Disable MEV protection" - Turn off protection
• "Enable auto slippage" - Dynamic slippage adjustment

**View Settings:**
• "Show current settings" - View all configurations
• "What's my slippage?" - Current slippage setting

**Presets:**
• "Use conservative settings" - 0.3% slippage + max protection
• "Use aggressive settings" - 2% slippage + fast execution

Current slippage: ${currentSettings.slippage}% | MEV Protection: ${currentSettings.mevProtection ? 'ON' : 'OFF'}`
                });
            }

            return true;

        } catch (error) {
            console.error('Slippage management action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to update slippage settings: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Set slippage to 0.5%" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll set your slippage tolerance to 0.5% and show you the risk assessment for this setting.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Enable MEV protection" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll enable MEV protection to safeguard your trades against front-running and sandwich attacks.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my trading settings" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll display your current slippage tolerance, MEV protection status, and other trading configurations.",
                    action: "SLIPPAGE_MANAGEMENT"
                }
            }
        ]
    ] as ActionExample[][],
};

export default slippageManagementAction; 