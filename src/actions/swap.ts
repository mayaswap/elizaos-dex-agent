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
import { WalletGuard } from "../utils/walletGuard.js";
import { sessionService } from "../services/sessionService.js";
import { metricsCollector } from "../services/metricsCollector.js";

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
        
        const isValid = parsed.intent === 'swap' && parsed.confidence > 0.6;
        
        // 📊 METRICS: Track validation events
        const userForMetrics = {
            id: runtime.agentId,
            platform: 'telegram' as const,
            userId: (message.content as any)?.source || 'anonymous'
        };
        
        metricsCollector.track({
            type: 'user_action',
            category: 'validation',
            action: isValid ? 'swap_validated' : 'swap_rejected',
            user: userForMetrics,
            data: {
                intent: parsed.intent,
                confidence: parsed.confidence,
                text: text.substring(0, 100) // First 100 chars for context
            },
            timestamp: Date.now()
        });
        
        return isValid;
    },
    description: "Execute token swaps using natural language commands via 9mm DEX aggregator",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const startTime = Date.now();
        const text = message.content.text;
        const parsed = await parseCommand(text);

        // 📊 METRICS: Track swap action start  
        const userForMetrics = {
            id: runtime.agentId,
            platform: 'telegram' as const, // Detect actual platform from message/runtime
            userId: (message.content as any)?.source || 'anonymous'
        };

        metricsCollector.track({
            type: 'user_action',
            category: 'trading',
            action: 'swap_initiated',
            user: userForMetrics,
            data: {
                fromToken: parsed.fromToken,
                toToken: parsed.toToken,
                amount: parsed.amount,
                confidence: parsed.confidence
            },
            timestamp: startTime
        });
        
        if (!parsed.fromToken || !parsed.toToken || !parsed.amount) {
            if (callback) {
                callback({
                    text: "I need more details for the swap. Please specify the amount, source token, and destination token. For example: 'Swap 100 USDC for WPLS'"
                });
            }
            return false;
        }

        // ✅ WALLET REQUIREMENT CHECK
        const walletCheck = await WalletGuard.enforceWalletRequired(runtime, message, callback);
        if (!walletCheck) {
            return false; // WalletGuard already sent appropriate message
        }

        const { platformUser } = walletCheck;

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

            // Get user's settings for slippage
            const userSettings = sessionService.getSettings(platformUser);

            // Get swap quote with user's preferred slippage
            const quote = await aggregator.getSwapQuote({
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                amount: amountInWei,
                slippagePercentage: userSettings.slippagePercentage,
                userAddress: "0x0000000000000000000000000000000000000000", // Will be replaced with actual wallet address
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

            // 🎯 CREATE PENDING TRANSACTION FOR CONFIRMATION
            const transactionId = sessionService.createPendingTransaction(
                platformUser,
                'swap',
                {
                    type: 'swap',
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    quote: quote,
                    chatId: (message.content as any)?.chatId || 0
                }
            );
            
            const responseText = `🔄 **Swap Confirmation Required**
            
**Trade Details:**
• **Amount:** ${parsed.amount} ${parsed.fromToken} → ${parsed.toToken}
• **You'll receive:** ~${buyAmountFormatted} ${parsed.toToken}
• **Price Impact:** ${priceImpact}
• **Slippage:** ${userSettings.slippagePercentage}%
• **Gas Estimate:** ${gasEstimate} gas units
• **Price:** ${price.toFixed(8)} ${parsed.toToken} per ${parsed.fromToken}

**Route:** ${routeDisplay}
**MEV Protection:** ${userSettings.mevProtection ? '✅ Enabled' : '❌ Disabled'}

⚠️ **This is a REAL transaction that will use your funds!**

**Confirm this trade?**
• Reply "yes" or "confirm" to execute
• Reply "no" or "cancel" to cancel
• Quote expires in 5 minutes

**Transaction ID:** \`${transactionId}\``;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            // 📊 METRICS: Track successful swap quote generation
            metricsCollector.track({
                type: 'user_action',
                category: 'trading',
                action: 'swap_quote_success',
                user: userForMetrics,
                data: {
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    quote: {
                        buyAmount: quote.buyAmount,
                        price: quote.price,
                        gas: quote.gas,
                        priceImpact: quote.estimatedPriceImpact
                    },
                    transactionId,
                    duration: Date.now() - startTime
                },
                timestamp: Date.now()
            });

            metricsCollector.trackTiming('swap_quote_generation', Date.now() - startTime, userForMetrics);

            return true;

        } catch (error) {
            console.error('Swap action error:', error);
            
            // 📊 METRICS: Track swap action error
            metricsCollector.trackError(
                error instanceof Error ? error : new Error('Unknown swap error'),
                {
                    action: 'swap',
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    duration: Date.now() - startTime
                },
                userForMetrics
            );

            metricsCollector.track({
                type: 'user_action', 
                category: 'trading',
                action: 'swap_quote_failed',
                user: userForMetrics,
                data: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    duration: Date.now() - startTime
                },
                timestamp: Date.now()
            });

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
                name: "{{user1}}",
                content: { text: "Swap 100 USDC for WPLS" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll get you a quote for swapping 100 USDC to WPLS using the best available routes.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Trade 50 PLS for HEX" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "Let me find the best price for trading 50 PLS to HEX across all DEX pools.",
                    action: "EXECUTE_SWAP"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Convert 0.5 WETH to USDT" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll check the conversion rate for 0.5 WETH to USDT and find the optimal route.",
                    action: "EXECUTE_SWAP"
                }
            }
        ]
    ] as ActionExample[][],
};

export default swapAction; 