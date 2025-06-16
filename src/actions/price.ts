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
  'WBTC': { decimals: 18, symbol: 'WBTC' },
  'INC': { decimals: 18, symbol: 'INC' },
  'LOAN': { decimals: 18, symbol: 'LOAN' },
  'HEDRON': { decimals: 9, symbol: 'HEDRON' },
  'ICSA': { decimals: 18, symbol: 'ICSA' },
};

const priceAction: Action = {
    name: "GET_PRICE",
    similes: [
        "CHECK_PRICE",
        "PRICE_LOOKUP",
        "MARKET_PRICE",
        "TOKEN_PRICE",
        "QUOTE_PRICE"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        // Valid if it's a price command with sufficient confidence
        return parsed.intent === 'price' && parsed.confidence > 0.6;
    },
    description: "Get current token prices using natural language commands via 9mm DEX aggregator",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text;
        const parsed = await parseCommand(text);
        
        if (!parsed.fromToken) {
            if (callback) {
                callback({
                    text: "I need to know which token price you want to check. For example: 'What's the price of HEX?' or 'HEX price'"
                });
            }
            return false;
        }

        try {
            const aggregator = new NineMMAggregator(369); // Pulsechain
            
            // Get token addresses from popular tokens config
            const pulsechainTokens = POPULAR_TOKENS.pulsechain;
            
            let tokenAddress = pulsechainTokens[parsed.fromToken as keyof typeof pulsechainTokens];
            const tokenMetadata = TOKEN_METADATA[parsed.fromToken];
            
            if (!tokenAddress) {
                throw new Error(`Token not found: ${parsed.fromToken}`);
            }

            // For native PLS, use WPLS address for price queries since APIs work better with ERC-20 tokens
            if (parsed.fromToken === 'PLS' && tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
                tokenAddress = pulsechainTokens.WPLS; // Use WPLS for price data
            }

            // Use dedicated price API for direct USD prices
            console.log(`📊 Fetching price for ${parsed.fromToken} at address: ${tokenAddress}`);
            const priceData = await aggregator.getTokenPrice(tokenAddress);
            
            console.log(`💰 Raw price data:`, priceData);
            const tokenPriceUSD = priceData.priceUSD;
            
            // Format price based on value magnitude
            let formattedPrice: string;
            if (tokenPriceUSD === 0) {
                formattedPrice = '0';
            } else if (tokenPriceUSD < 0.00000001) {
                // For extremely small values, use exponential notation
                formattedPrice = tokenPriceUSD.toExponential(4);
            } else if (tokenPriceUSD < 0.00001) {
                // For very small values, show more decimal places
                formattedPrice = tokenPriceUSD.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
            } else if (tokenPriceUSD < 0.0001) {
                // For small values, show 8 decimals
                formattedPrice = tokenPriceUSD.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
            } else if (tokenPriceUSD < 0.01) {
                // For medium-small values
                formattedPrice = tokenPriceUSD.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
            } else if (tokenPriceUSD < 1) {
                // For sub-dollar values
                formattedPrice = tokenPriceUSD.toFixed(4);
            } else if (tokenPriceUSD < 100) {
                // For normal prices
                formattedPrice = tokenPriceUSD.toFixed(4);
            } else {
                // For large values
                formattedPrice = tokenPriceUSD.toFixed(2);
            }
            
            // Create market cap and volume estimates for major tokens
            let additionalInfo = '';
            if (parsed.fromToken === 'PLS') {
                additionalInfo = '\n**Note:** PLS is the native token of PulseChain';
            } else if (parsed.fromToken === 'HEX') {
                additionalInfo = '\n**Note:** HEX is a certificate of deposit on blockchain';
            }
            
            const responseText = `📊 **${parsed.fromToken} Price**

**Current Price:** $${formattedPrice} USD
**Token:** ${tokenMetadata?.symbol || parsed.fromToken}
**Decimals:** ${tokenMetadata?.decimals || 18}
**Address:** \`${tokenAddress}\`${additionalInfo}

*Price sourced from 9mm price API on PulseChain*`;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Price action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to get price: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "What's the price of HEX?" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "Let me check the current HEX price across all DEX pools.",
                    action: "GET_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "PLS price" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll fetch the current PLS price for you.",
                    action: "GET_PRICE"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "How much is PLSX worth?" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me get the latest PLSX market price.",
                    action: "GET_PRICE"
                }
            }
        ]
    ] as ActionExample[][],
};

export default priceAction; 