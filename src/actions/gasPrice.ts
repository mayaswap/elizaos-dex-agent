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
import { ethers } from "ethers";

const gasPriceAction: Action = {
    name: "CHECK_GAS_PRICE",
    similes: [
        "GAS_FEES",
        "CHECK_GAS",
        "GAS_TRACKER",
        "NETWORK_FEES",
        "TRANSACTION_COST",
        "GAS_MONITOR"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        const gasKeywords = ['gas', 'fees', 'cost', 'transaction cost', 'network fees'];
        const priceKeywords = ['price', 'check', 'current', 'what', 'how much'];
        
        return gasKeywords.some(keyword => text.includes(keyword)) && 
               priceKeywords.some(keyword => text.includes(keyword));
    },
    description: "Check current gas prices and network fees on PulseChain and other networks",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content?.text?.toLowerCase() || '';
            
            // Chain configurations
            const chainConfigs = {
                pulsechain: {
                    name: "PulseChain",
                    rpc: "https://rpc.pulsechain.com",
                    symbol: "PLS",
                    chainId: 369
                },
                base: {
                    name: "Base",
                    rpc: "https://mainnet.base.org", 
                    symbol: "ETH",
                    chainId: 8453
                },
                sonic: {
                    name: "Sonic",
                    rpc: "https://rpc.soniclabs.com",
                    symbol: "S",
                    chainId: 146
                }
            };

            // Determine which chain(s) to check
            let chainsToCheck = Object.keys(chainConfigs);
            if (text.includes('pulse')) chainsToCheck = ['pulsechain'];
            else if (text.includes('base')) chainsToCheck = ['base'];  
            else if (text.includes('sonic')) chainsToCheck = ['sonic'];

            const gasData: Array<{
                chain: string;
                symbol: string;
                gasPrice: string;
                maxFeePerGas?: string;
                maxPriorityFeePerGas?: string;
                level: string;
                costs?: {
                    swap: string;
                    transfer: string;
                    liquidity: string;
                };
                error?: string;
            }> = [];

            for (const chainKey of chainsToCheck) {
                const config = chainConfigs[chainKey as keyof typeof chainConfigs];
                try {
                    const provider = new ethers.JsonRpcProvider(config.rpc);
                    const feeData = await provider.getFeeData();
                    
                    const gasPrice = feeData.gasPrice ? Number(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 0;
                    const maxFeePerGas = feeData.maxFeePerGas ? Number(ethers.formatUnits(feeData.maxFeePerGas, 'gwei')) : 0;
                    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ? Number(ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')) : 0;

                    // Estimate transaction costs for common operations
                    const swapGasLimit = 200000; // Typical DEX swap
                    const transferGasLimit = 21000; // Simple transfer
                    const lpGasLimit = 300000; // Add/remove liquidity

                    const swapCost = (gasPrice * swapGasLimit) / 1e9;
                    const transferCost = (gasPrice * transferGasLimit) / 1e9;
                    const lpCost = (gasPrice * lpGasLimit) / 1e9;

                    // Gas price classification
                    let gasPriceLevel = '🟢 LOW';
                    if (gasPrice > 20) gasPriceLevel = '🟡 MEDIUM';
                    if (gasPrice > 50) gasPriceLevel = '🔴 HIGH';
                    if (gasPrice > 100) gasPriceLevel = '💀 EXTREME';

                    gasData.push({
                        chain: config.name,
                        symbol: config.symbol,
                        gasPrice: gasPrice.toFixed(2),
                        maxFeePerGas: maxFeePerGas.toFixed(2),
                        maxPriorityFeePerGas: maxPriorityFeePerGas.toFixed(2),
                        level: gasPriceLevel,
                        costs: {
                            swap: swapCost.toFixed(6),
                            transfer: transferCost.toFixed(6),
                            liquidity: lpCost.toFixed(6)
                        }
                    });
                } catch (error) {
                    gasData.push({
                        chain: config.name,
                        symbol: config.symbol,
                        gasPrice: 'N/A',
                        level: '❌ ERROR',
                        error: 'Unable to fetch'
                    });
                }
            }

            // Generate response
            let responseText = '';
            
            if (gasData.length === 1) {
                const data = gasData[0];
                if (data.error) {
                    responseText = `⛽ **Gas Prices - ${data.chain}**

❌ **Error**: ${data.error}
Unable to fetch current gas prices for ${data.chain}.

*Please try again or check network status.*`;
                } else {
                    responseText = `⛽ **Gas Prices - ${data.chain}**

📊 **Current Fees**:
• Standard Gas Price: ${data.gasPrice} gwei (${data.level})
• Max Fee Per Gas: ${data.maxFeePerGas} gwei
• Priority Fee: ${data.maxPriorityFeePerGas} gwei

💰 **Transaction Costs** (in ${data.symbol}):
• Token Swap: ~${data.costs?.swap} ${data.symbol}
• Simple Transfer: ~${data.costs?.transfer} ${data.symbol}  
• LP Operations: ~${data.costs?.liquidity} ${data.symbol}

💡 **Timing Advice**: ${data.level.includes('LOW') ? 'Great time to transact!' : 
                        data.level.includes('MEDIUM') ? 'Moderate fees - consider waiting if not urgent' :
                        'High fees - wait for lower gas if possible'}`;
                }
            } else {
                responseText = `⛽ **Multi-Chain Gas Monitor**

${gasData.map(data => {
    if (data.error) {
        return `**${data.chain}**: ❌ ${data.error}`;
    }
    return `**${data.chain}**: ${data.gasPrice} gwei (${data.level})
   Swap Cost: ~${data.costs?.swap} ${data.symbol} | Transfer: ~${data.costs?.transfer} ${data.symbol}`;
}).join('\n\n')}

🏆 **Best Chain**: ${gasData
    .filter(d => !d.error)
    .sort((a, b) => parseFloat(a.gasPrice) - parseFloat(b.gasPrice))[0]?.chain || 'N/A'}

💡 **Pro Tip**: Use the lowest gas chain for non-urgent transactions to save on fees!`;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Gas price action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to check gas prices: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "What's the current gas price?" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll check the current gas prices across all supported networks to help you time your transactions optimally.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Check gas fees on PulseChain" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me get the current gas fees for PulseChain and show you transaction cost estimates.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "How much will this transaction cost?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check current gas prices and estimate transaction costs for different operation types.",
                    action: "CHECK_GAS_PRICE"
                }
            }
        ]
    ] as ActionExample[][],
};

export default gasPriceAction; 