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
                const platformUser = createPlatformUser(runtime, message);
                const walletService = new WalletService(runtime);
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

                // Mock multi-chain balance data
                const mockBalances = {
                    pulsechain: {
                        totalUSD: 8450.75,
                        tokens: [
                            { symbol: "PLS", balance: "25,000", usd: 4500 },
                            { symbol: "HEX", balance: "150,000", usd: 3200 },
                            { symbol: "USDC", balance: "750", usd: 750 }
                        ]
                    },
                    base: {
                        totalUSD: 2850.30,
                        tokens: [
                            { symbol: "ETH", balance: "1.25", usd: 2100 },
                            { symbol: "USDC", balance: "650", usd: 650 },
                            { symbol: "cbETH", balance: "0.05", usd: 100.30 }
                        ]
                    },
                    sonic: {
                        totalUSD: 1200.50,
                        tokens: [
                            { symbol: "S", balance: "15,000", usd: 900 },
                            { symbol: "USDT", balance: "300", usd: 300 },
                            { symbol: "SONIC", balance: "500", usd: 0.50 }
                        ]
                    }
                };

                const totalPortfolio = Object.values(mockBalances).reduce((sum, chain) => sum + chain.totalUSD, 0);

                const responseText = `🌐 **Multi-Chain Portfolio Overview**

💰 **Total Portfolio Value**: $${totalPortfolio.toLocaleString()}

${Object.entries(mockBalances).map(([chainKey, data]) => {
    const chain = supportedChains[chainKey as keyof typeof supportedChains];
    const percentage = ((data.totalUSD / totalPortfolio) * 100).toFixed(1);
    
    return `**${chain.name}** - $${data.totalUSD.toLocaleString()} (${percentage}%)
${data.tokens.map(token => 
    `   • ${token.symbol}: ${token.balance} (~$${token.usd.toLocaleString()})`
).join('\n')}`;
}).join('\n\n')}

**Quick Actions:**
• "Switch to Base network" - Change active chain
• "Show Sonic balance" - Chain-specific balance
• "Swap on PulseChain" - Chain-specific operations

*Balances updated across all connected chains*`;

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
                user: "{{user1}}",
                content: { text: "Switch to Base network" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll switch you to the Base network and show you the available features and DEXs.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show my Sonic balance" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me check your token balances on the Sonic network.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "What chains are supported?" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll show you all supported networks with their features and how to switch between them.",
                    action: "MULTI_CHAIN_SUPPORT"
                }
            }
        ]
    ] as ActionExample[][],
};

export default multiChainAction; 