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
import { NineMMAggregator } from "../utils/aggregator.js";
import { POPULAR_TOKENS } from "../config/chains.js";

// Token metadata for proper decimal handling
const TOKEN_METADATA: Record<string, { decimals: number; symbol: string }> = {
  'PLS': { decimals: 18, symbol: 'PLS' },
  'WPLS': { decimals: 18, symbol: 'WPLS' },
  'USDC': { decimals: 6, symbol: 'USDC' },
  'USDT': { decimals: 6, symbol: 'USDT' },
  'DAI': { decimals: 18, symbol: 'DAI' },
  'HEX': { decimals: 8, symbol: 'HEX' },
  'PLSX': { decimals: 18, symbol: 'PLSX' },
  '9MM': { decimals: 18, symbol: '9MM' },
  'WETH': { decimals: 18, symbol: 'WETH' },
};

const swapAction: Action = {
    name: "EXECUTE_SWAP",
    similes: [
        "SWAP_TOKENS",
        "TRADE_TOKENS", 
        "EXCHANGE_TOKENS",
        "CONVERT_TOKENS",
        "BUY_TOKENS",
        "SELL_TOKENS"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        // Valid if it's a swap command with sufficient confidence
        return parsed.intent === 'swap' && parsed.confidence > 0.6;
    },
    description: "Execute token swaps using natural language commands via 9mm DEX aggregator",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        if (!parsed.fromToken || !parsed.toToken || !parsed.amount) {
            if (callback) {
                callback({
                    text: "I need more details for the swap. Please specify the amount, source token, and destination token. For example: 'Swap 100 USDC for WPLS'"
                });
            }
            return false;
        }

        try {
            const aggregator = new NineMMAggregator(369); // Pulsechain
            
            // Get token addresses from popular tokens config
            const pulsechainTokens = POPULAR_TOKENS.pulsechain;
            
            const fromTokenAddress = pulsechainTokens[parsed.fromToken as keyof typeof pulsechainTokens];
            const toTokenAddress = pulsechainTokens[parsed.toToken as keyof typeof pulsechainTokens];
            
            if (!fromTokenAddress || !toTokenAddress) {
                throw new Error(`Token not found: ${parsed.fromToken} or ${parsed.toToken}`);
            }

            // Get token metadata for proper amount formatting
            const fromTokenMeta = TOKEN_METADATA[parsed.fromToken] || { decimals: 18, symbol: parsed.fromToken };
            const toTokenMeta = TOKEN_METADATA[parsed.toToken] || { decimals: 18, symbol: parsed.toToken };
            
            // Convert amount to wei based on token decimals
            const amountInWei = NineMMAggregator.formatAmount(parsed.amount.toString(), fromTokenMeta.decimals);

            // Get swap quote
            const quote = await aggregator.getSwapQuote({
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                amount: amountInWei,
                slippagePercentage: 0.5, // 0.5% default slippage
                userAddress: "0x0000000000000000000000000000000000000000", // Placeholder
                chainId: 369
            });

            // Format response using correct SwapQuote properties and token decimals
            const priceImpact = quote.estimatedPriceImpact && quote.estimatedPriceImpact !== '0' 
                ? `${parseFloat(quote.estimatedPriceImpact).toFixed(2)}%` 
                : '< 0.01%';
            
            // Safely handle gas estimation
            let gasEstimate = 'N/A';
            try {
                if (quote.gas) {
                    const gasValue = typeof quote.gas === 'string' ? parseFloat(quote.gas) : quote.gas;
                    gasEstimate = `~${Math.round(gasValue / 1000)}K`;
                }
            } catch (e) {
                console.warn('Could not parse gas estimate:', e);
            }
            
            // Parse buy amount with correct decimals
            const buyAmountFormatted = NineMMAggregator.parseAmount(quote.buyAmount, toTokenMeta.decimals);
            const price = parseFloat(quote.price);
            
            // Format sources for display
            const routeDisplay = quote.sources && quote.sources.length > 0
                ? quote.sources.map(s => typeof s === 'string' ? s : s.name).join(' + ')
                : 'Best Available Route';
            
            const responseText = `🔄 **Swap Quote Ready**
            
**Trade:** ${parsed.amount} ${parsed.fromToken} → ${parsed.toToken}
**You'll receive:** ~${buyAmountFormatted} ${parsed.toToken}
**Price Impact:** ${priceImpact}
**Gas Estimate:** ${gasEstimate} gas units
**Price:** ${price.toFixed(8)} ${parsed.toToken} per ${parsed.fromToken}

*Route: ${routeDisplay}*
*Note: This is a quote only. To execute the swap, you would need to connect a wallet and approve the transaction.*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Swap action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Swap 100 USDC for WPLS" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll get you a quote for swapping 100 USDC to WPLS using the best available routes.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Trade 50 PLS for HEX" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me find the best price for trading 50 PLS to HEX across all DEX pools.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Convert 0.5 WETH to USDT" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll check the conversion rate for 0.5 WETH to USDT and find the optimal route.",
                    action: "EXECUTE_SWAP"
                }
            }
        ]
    ] as ActionExample[][],
};

export default swapAction; 