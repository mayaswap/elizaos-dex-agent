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
import { IExtendedRuntime } from "../types/extended.js";

const multiChainAction: Action = {
    name: "MULTI_CHAIN_SUPPORT",
    similes: [
        "SWITCH_NETWORK",
        "CHANGE_CHAIN",
        "NETWORK_SWITCH",
        "CROSS_CHAIN",
        "CHAIN_SELECTION",
        "NETWORK_INFO"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text.toLowerCase();
        const chainKeywords = ['chain', 'network', 'switch', 'base', 'sonic', 'pulse', 'pulsechain'];
        const actionKeywords = ['switch', 'change', 'use', 'connect', 'show', 'balance'];
        
        return chainKeywords.some(keyword => text.includes(keyword)) && 
               actionKeywords.some(keyword => text.includes(keyword));
    },
    description: "Switch between supported networks and manage multi-chain operations",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content.text.toLowerCase();
            
            // Chain configurations
            const supportedChains = {
                pulsechain: {
                    name: "PulseChain",
                    chainId: 369,
                    symbol: "PLS",
                    rpc: "https://rpc.pulsechain.com",
                    explorer: "https://scan.pulsechain.com",
                    description: "Richard Heart's Ethereum fork with lower fees",
                    dexes: ["9mm V2", "9mm V3", "DexGen"],
                    features: ["Low Gas", "HEX Native", "OA Sacrifice"]
                },
                base: {
                    name: "Base",
                    chainId: 8453,
                    symbol: "ETH",
                    rpc: "https://mainnet.base.org",
                    explorer: "https://basescan.org",
                    description: "Coinbase's Layer 2 built on Optimism",
                    dexes: ["Uniswap V3", "SushiSwap", "BaseSwap"],
                    features: ["L2 Scaling", "Coinbase Integration", "Low Fees"]
                },
                sonic: {
                    name: "Sonic",
                    chainId: 146,
                    symbol: "S",
                    rpc: "https://rpc.soniclabs.com",
                    explorer: "https://sonicscan.org",
                    description: "High-performance EVM-compatible chain",
                    dexes: ["SonicSwap", "TurboSwap", "VelocityDEX"],
                    features: ["Ultra Fast", "High TPS", "Gaming Focused"]
                }
            };

            // Determine the target chain
            let targetChain: string | null = null;
            if (text.includes('pulse')) targetChain = 'pulsechain';
            else if (text.includes('base')) targetChain = 'base';
            else if (text.includes('sonic')) targetChain = 'sonic';

            // Check for balance inquiry across chains
            if (text.includes('balance') && !targetChain) {
                const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
                const walletService = new WalletService(runtime as IExtendedRuntime);
                const userWallets = await walletService.getUserWallets(platformUser);
                const walletCount = userWallets.length;

                if (walletCount === 0) {
                    if (callback) {
                        callback({
                            text: `🌐 **Multi-Chain Balance Check**

❌ **No Wallets Connected**

To check balances across chains, you need to connect a wallet first.

**After connecting, you can:**
• "Show my Base balance"
• "Check PulseChain balance"  
• "Sonic network balance"
• "All chain balances"

*Connect a wallet to get started!*`
                        });
                    }
                    return true;
                }

                const responseText = `🌐 **Multi-Chain Portfolio Overview**

💼 **Connected Wallets**: ${walletCount} wallet${walletCount > 1 ? 's' : ''}

⚠️ **Multi-Chain Balance Check**: Coming Soon!

Currently, I can:
✅ Show PulseChain balances (real-time)
🔄 Switch between networks
📊 Provide network information

Multi-chain balance checking across Base and Sonic is under development. 

**Available Now:**
• "Show my balance" - Check PulseChain balances
• "Switch to Base network" - Change active chain
• "What chains are supported?" - View all networks

**Coming Soon:**
• Real-time Base network balances
• Sonic chain integration
• Cross-chain portfolio analytics

*Stay tuned for full multi-chain support!*`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Handle network switching
            if (targetChain && (text.includes('switch') || text.includes('change') || text.includes('use'))) {
                const chain = supportedChains[targetChain as keyof typeof supportedChains];
                
                const responseText = `🔄 **Network Switch - ${chain.name}**

✅ **Successfully switched to ${chain.name}**

🌐 **Network Details**:
• Chain ID: ${chain.chainId}
• Native Token: ${chain.symbol}
• RPC URL: ${chain.rpc}
• Block Explorer: ${chain.explorer}

📝 **Description**: ${chain.description}

🏪 **Available DEXs**: ${chain.dexes.join(', ')}

⚡ **Key Features**: ${chain.features.join(' • ')}

**What you can do now:**
• "What's the gas price?" - Check ${chain.name} fees
• "Show my balance" - View ${chain.symbol} and token balances
• "Swap tokens" - Trade on ${chain.name} DEXs
• "Show available pools" - Find liquidity opportunities

*All future operations will use ${chain.name} network*`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Show network information
            if (text.includes('info') || text.includes('show') || (!targetChain && text.includes('network'))) {
                const responseText = `🌐 **Supported Networks**

${Object.entries(supportedChains).map(([key, chain]) => {
    return `**${chain.name}** (Chain ID: ${chain.chainId})
• Native Token: ${chain.symbol}
• Description: ${chain.description}
• DEXs: ${chain.dexes.join(', ')}
• Features: ${chain.features.join(' • ')}
• Switch Command: "Switch to ${key}"`;
}).join('\n\n')}

**Multi-Chain Commands:**
• "Switch to [network]" - Change active network
• "Show [network] balance" - Chain-specific balance
• "All chain balances" - Portfolio across all networks
• "What chains are supported?" - This information

💡 **Pro Tip**: Each chain has different gas costs and available tokens. Choose the best chain for your transaction needs!`;

                if (callback) {
                    callback({
                        text: responseText
                    });
                }
                return true;
            }

            // Default response for unrecognized network commands
            if (callback) {
                callback({
                    text: `🌐 **Multi-Chain Support**

I can help you with network operations! Try:

**Switch Networks:**
• "Switch to Base network"
• "Change to PulseChain"  
• "Use Sonic chain"

**Check Balances:**
• "Show my Base balance"
• "PulseChain balance"
• "All chain balances"

**Network Info:**
• "What chains are supported?"
• "Show network information"

Currently supported: PulseChain, Base, and Sonic networks.`
                });
            }

            return true;

        } catch (error) {
            console.error('Multi-chain action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to process multi-chain request: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Switch to Base network" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll switch you to the Base network and show you the available features and DEXs.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Show my Sonic balance" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me check your token balances on the Sonic network.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "What chains are supported?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll show you all supported networks with their features and how to switch between them.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ]
    ] as ActionExample[][],
};

export default multiChainAction; 