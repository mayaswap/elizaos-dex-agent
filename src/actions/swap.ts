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
import { WrapperService } from "../services/wrapperService.js";
import { WalletService } from "../services/walletService.js";
import { IExtendedRuntime } from "../types/extended.js";
import { ApprovalHelper } from "../utils/approvalHelper.js";

// Helper function for handling wrap/unwrap operations
async function handleWrapOperation(
    parsed: any, 
    platformUser: any, 
    userForMetrics: any, 
    startTime: number, 
    callback?: HandlerCallback
): Promise<boolean> {
    try {
        const wrapperService = new WrapperService(369); // PulseChain
        const isWrap = parsed.fromToken.toLowerCase() === 'pls';
        
        // Get wrap quote (1:1 ratio, just gas estimation)
        const wrapQuote = await wrapperService.getWrapQuote(
            parsed.fromToken, 
            parsed.toToken, 
            parsed.amount.toString()
        );
        
        // Format gas estimate
        const gasEstimate = `~${Math.round(parseInt(wrapQuote.gasEstimate) / 1000)}K`;
        
        // Create pending transaction for confirmation
        const transactionId = await sessionService.createPendingTransaction(
            platformUser,
            isWrap ? 'wrap' : 'unwrap',
            {
                type: isWrap ? 'wrap' : 'unwrap',
                fromToken: parsed.fromToken,
                toToken: parsed.toToken,
                amount: parsed.amount,
                wrapQuote: wrapQuote,
                chatId: (callback as any)?.chatId || 0
            }
        );
        
        const operationType = isWrap ? 'Wrap' : 'Unwrap';
        const responseText = `🔄 **${operationType} Confirmation Required**
        
**${operationType} Details:**
• **Amount:** ${parsed.amount} ${parsed.fromToken} → ${parsed.toToken}
• **You'll receive:** ${parsed.amount} ${parsed.toToken} (1:1 ratio)
• **Price Impact:** 0% (Direct contract interaction)
• **Gas Estimate:** ${gasEstimate} gas units
• **Operation:** ${isWrap ? 'Deposit PLS to get WPLS' : 'Withdraw WPLS to get PLS'}

**Route:** Direct WPLS Contract
**Type:** Native token wrapper (No MEV risk)

⚠️ **This is a REAL transaction that will use your funds!**

**Confirm this ${operationType.toLowerCase()}?**
• Reply "yes" or "confirm" to execute
• Reply "no" or "cancel" to cancel
• Quote expires in 5 minutes

**Transaction ID:** \`${transactionId}\``;

        if (callback) {
            callback({
                text: responseText
            });
        }

        // 📊 METRICS: Track successful wrap quote
        metricsCollector.track({
            type: 'user_action',
            category: 'trading',
            action: `${isWrap ? 'wrap' : 'unwrap'}_quote_success`,
            user: userForMetrics,
            data: {
                fromToken: parsed.fromToken,
                toToken: parsed.toToken,
                amount: parsed.amount,
                gasEstimate: wrapQuote.gasEstimate,
                transactionId,
                duration: Date.now() - startTime
            },
            timestamp: Date.now()
        });

        return true;
        
    } catch (error) {
        console.error('Wrap operation error:', error);
        
        // 📊 METRICS: Track wrap error
        metricsCollector.trackError(
            error instanceof Error ? error : new Error('Unknown wrap error'),
            {
                action: 'wrap_operation',
                fromToken: parsed.fromToken,
                toToken: parsed.toToken,
                amount: parsed.amount,
                duration: Date.now() - startTime
            },
            userForMetrics
        );

        if (callback) {
            callback({
                text: `❌ Failed to get ${parsed.fromToken.toLowerCase() === 'pls' ? 'wrap' : 'unwrap'} quote: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
        return false;
    }
}

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
            // 🔄 CHECK IF THIS IS A WRAP/UNWRAP OPERATION
            const isWrapOperation = WrapperService.isWrapOperation(parsed.fromToken, parsed.toToken);
            
            if (isWrapOperation) {
                // Handle PLS <-> WPLS wrapping directly with contract
                return await handleWrapOperation(
                    parsed, platformUser, userForMetrics, startTime, callback
                );
            }
            
            // Regular swap via aggregator
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

            // Get user's actual wallet address for proper quote generation
            const walletService = new WalletService(runtime as IExtendedRuntime);
            const activeWallet = await walletService.getActiveWallet(platformUser);
            if (!activeWallet) {
                throw new Error("No active wallet found");
            }

            // 🔄 Get user's slippage settings - prioritize wallet settings (persistent) over session settings
            const walletSettings = activeWallet.settings;
            const sessionSettings = await sessionService.getSettings(platformUser);
            
            // Use wallet slippage if available, otherwise fall back to session settings
            const slippagePercentage = walletSettings?.slippagePercentage ?? sessionSettings.slippagePercentage;
            
            console.log(`📊 Using slippage: ${slippagePercentage}% (from ${walletSettings?.slippagePercentage !== undefined ? 'wallet' : 'session'})`);

            // 🔓 CHECK AND HANDLE TOKEN APPROVAL (if needed)
            const approvalHelper = new ApprovalHelper(369);
            const approvalStatus = await approvalHelper.checkApprovalStatus(
                fromTokenAddress,
                activeWallet.address,
                amountInWei
            );

            // If approval is needed, handle it first
            if (approvalStatus.needsApproval) {
                console.log('🔒 Token approval required for', parsed.fromToken);
                
                // Get private key for approval transaction
                const privateKey = await walletService.getWalletPrivateKey(platformUser);
                if (!privateKey) {
                    throw new Error("Unable to access wallet private key for approval");
                }

                // Execute approval with unlimited allowance for better UX
                const approvalAmount = ApprovalHelper.getRecommendedApprovalAmount(amountInWei, 'unlimited');
                const approvalResult = await approvalHelper.executeApproval(
                    fromTokenAddress,
                    privateKey,
                    approvalAmount
                );

                if (!approvalResult.success) {
                    throw new Error(`Token approval failed: ${approvalResult.error}`);
                }

                console.log(`✅ Token approval successful: ${approvalResult.transactionHash}`);
                
                // Brief delay to ensure approval is confirmed on-chain
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            // Get swap quote with user's preferred slippage and ACTUAL wallet address
            console.log('🔄 Requesting quote from 9X API:', {
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                amount: amountInWei,
                slippagePercentage: slippagePercentage,
                userAddress: activeWallet.address,
                chainId: 369
            });
            
            const quote = await aggregator.getSwapQuote({
                fromToken: fromTokenAddress,
                toToken: toTokenAddress,
                amount: amountInWei,
                slippagePercentage: slippagePercentage,
                userAddress: activeWallet.address, // Use actual wallet address!
                chainId: 369
            });
            
            console.log('📄 9X API quote response:', {
                to: quote.to,
                data: quote.data ? `${quote.data.substring(0, 20)}...` : 'NO DATA',
                dataLength: quote.data ? quote.data.length : 0,
                value: quote.value,
                gas: quote.gas,
                buyAmount: quote.buyAmount,
                hasValidData: !!(quote.data && quote.data !== '0x' && quote.data !== '')
            });

            // Format response using correct SwapQuote properties and token decimals
            let priceImpact = '< 0.01%';
            let isHighSlippage = false;
            let slippageWarning = '';
            
            // Debug logging for slippage detection
            console.log('🔍 Slippage Debug:', {
                estimatedPriceImpact: quote.estimatedPriceImpact,
                type: typeof quote.estimatedPriceImpact,
                fromToken: parsed.fromToken,
                toToken: parsed.toToken
            });
            
            // Check if API returned valid slippage data
            const hasValidSlippage = quote.estimatedPriceImpact && 
                                   quote.estimatedPriceImpact !== '0' && 
                                   quote.estimatedPriceImpact !== '-' && 
                                   quote.estimatedPriceImpact !== 'null' &&
                                   quote.estimatedPriceImpact !== null &&
                                   quote.estimatedPriceImpact !== undefined;
            
            if (hasValidSlippage) {
                const impactValue = parseFloat(quote.estimatedPriceImpact);
                if (!isNaN(impactValue)) {
                    priceImpact = `${impactValue.toFixed(2)}%`;
                    
                    // Check for high slippage (>5% is considered high)
                    if (impactValue > 5) {
                        isHighSlippage = true;
                        slippageWarning = `⚠️ **HIGH SLIPPAGE WARNING**\nThis trade has ${priceImpact} price impact, which is unusually high.\nThis could cause significant losses!\n\n`;
                    }
                } else {
                    // Invalid number in estimatedPriceImpact
                    priceImpact = 'Unknown (Invalid data)';
                    isHighSlippage = true;
                    slippageWarning = `⚠️ **UNKNOWN SLIPPAGE WARNING**\nThe API returned invalid price impact data.\nThis could be a transaction with high slippage that may fail!\n\n`;
                }
            } else {
                // Handle case where API returns no/invalid slippage data (null, undefined, dash, "0")
                priceImpact = 'Unknown (API issue)';
                isHighSlippage = true;
                slippageWarning = `⚠️ **UNKNOWN SLIPPAGE WARNING**\nThe API couldn't calculate price impact for this trade.\nThis could be a transaction with high slippage that may fail!\n\n`;
            }
            
            // Enhanced gas estimation (realistic API estimates with minimal safety buffer)
            let gasEstimate = 'N/A';
            try {
                if (quote.gas) {
                    const apiGasValue = typeof quote.gas === 'string' ? parseFloat(quote.gas) : quote.gas;
                    // Apply same 15% buffer as transaction execution for display accuracy
                    const bufferedGas = Math.floor(apiGasValue * 1.15);
                    gasEstimate = `~${Math.round(bufferedGas / 1000)}K`;
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
            console.log('💾 Storing quote data in session:', {
                to: quote.to,
                data: quote.data ? `${quote.data.substring(0, 20)}...` : 'NO DATA',
                dataLength: quote.data ? quote.data.length : 0,
                value: quote.value,
                gas: quote.gas,
                hasValidData: !!(quote.data && quote.data !== '0x' && quote.data !== '')
            });
            
            // 🔧 FIX: Create a clean copy of quote data to avoid serialization issues
            const cleanQuote = {
                sellToken: quote.sellToken,
                buyToken: quote.buyToken,
                sellAmount: quote.sellAmount,
                buyAmount: quote.buyAmount,
                price: quote.price,
                guaranteedPrice: quote.guaranteedPrice,
                gas: quote.gas,
                gasPrice: quote.gasPrice,
                protocolFee: quote.protocolFee,
                minimumProtocolFee: quote.minimumProtocolFee,
                buyTokenAddress: quote.buyTokenAddress,
                sellTokenAddress: quote.sellTokenAddress,
                value: quote.value,
                to: quote.to,
                data: quote.data, // Critical: Ensure this is preserved
                estimatedPriceImpact: quote.estimatedPriceImpact,
                sources: quote.sources
            };
            
            console.log('🔧 Clean quote data being stored:', {
                to: cleanQuote.to,
                data: cleanQuote.data ? `${cleanQuote.data.substring(0, 20)}...` : 'NO DATA',
                dataLength: cleanQuote.data ? cleanQuote.data.length : 0,
                value: cleanQuote.value,
                gas: cleanQuote.gas,
                hasValidData: !!(cleanQuote.data && cleanQuote.data !== '0x' && cleanQuote.data !== '')
            });
            
            const transactionId = await sessionService.createPendingTransaction(
                platformUser,
                'swap',
                {
                    type: 'swap',
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    quote: cleanQuote, // Use clean copy instead of original
                    chatId: (message.content as any)?.chatId || 0
                }
            );
            
            const responseText = `🔄 **Swap Confirmation Required**
            
${slippageWarning}**Trade Details:**
• **Amount:** ${parsed.amount} ${parsed.fromToken} → ${parsed.toToken}
• **You'll receive:** ~${buyAmountFormatted} ${parsed.toToken}
• **Price Impact:** ${priceImpact}
• **Slippage:** ${slippagePercentage}%
• **Gas Estimate:** ${gasEstimate} gas units (realistic estimate + 15% buffer)
• **Price:** ${price.toFixed(8)} ${parsed.toToken} per ${parsed.fromToken}

**Route:** ${routeDisplay}
**Aggregator:** 9X API (No MEV protection needed)

⚠️ **This is a REAL transaction that will use your funds!**
${isHighSlippage ? '🚨 **HIGH RISK**: This transaction may fail due to slippage!\n\n' : ''}**Confirm this trade?**
• Reply "yes" or "confirm" to execute${isHighSlippage ? ' (despite high slippage risk)' : ''}
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