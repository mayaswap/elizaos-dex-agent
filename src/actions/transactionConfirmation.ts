import {
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { parseCommand } from "../utils/smartParser.js";
import { sessionService } from "../services/sessionService.js";
import { createPlatformUser } from "../services/walletService.js";
import { NineMMAggregator } from "../utils/aggregator.js";
import { WalletService } from "../services/walletService.js";
import { fuzzyMatcher } from "../utils/fuzzyMatching.js";
import { IExtendedRuntime } from "../types/extended.js";
import { WrapperService } from "../services/wrapperService.js";
import { CHAIN_CONFIGS } from "../config/chains.js";

const transactionConfirmationAction: Action = {
    name: "TRANSACTION_CONFIRMATION",
    similes: [
        "CONFIRM_TRANSACTION",
        "APPROVE_SWAP", 
        "EXECUTE_TRADE",
        "CANCEL_TRADE",
        "DENY_TRANSACTION"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content.text;
        
        // Use fuzzy matching for better confirmation detection
        const confirmationMatch = fuzzyMatcher.matchConfirmation(text);
        
        // Only validate if user has pending transactions and this looks like a confirmation
        if (confirmationMatch.isConfirmation || confirmationMatch.isAmbiguous) {
            const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
            if (platformUser) {
                const pendingTx = await sessionService.getPendingTransactions(platformUser);
                return pendingTx.length > 0;
            }
        }
        
        return false;
    },
    description: "Handle transaction confirmations and cancellations for pending trades",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content.text.toLowerCase();
        const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
        
        if (!platformUser) {
            if (callback) {
                callback({
                    text: "❌ Unable to identify user. Please try again."
                });
            }
            return false;
        }

        // EDGE CASE FIX: Handle context switching and expiry
        const pendingTransactions = await sessionService.getPendingTransactions(platformUser);
        
        if (pendingTransactions.length === 0) {
            if (callback) {
                callback({
                    text: "❌ No pending transactions to confirm or cancel."
                });
            }
            return false;
        }

        // Get the most recent transaction (since we only allow 1 pending)
        const transaction = await sessionService.getMostRecentPendingTransaction(platformUser);
        
        if (!transaction) {
            if (callback) {
                callback({
                    text: "❌ No pending transactions found. All transactions may have expired."
                });
            }
            return false;
        }

        // EDGE CASE FIX: Check if transaction is expiring soon
        if (sessionService.isTransactionExpiringSoon(transaction)) {
            const expiryWarning = sessionService.getExpiryWarningMessage(transaction);
            // Continue processing but add urgency context
        }

        // Use fuzzy matching for better confirmation detection
        const confirmationMatch = fuzzyMatcher.matchConfirmation(text);
        
        // EDGE CASE FIX: Handle ambiguous responses
        if (confirmationMatch.isAmbiguous) {
            const timeLeft = Math.ceil((transaction.expires - Date.now()) / 60000);
            if (callback) {
                callback({
                    text: `🤔 **I'm not sure what you mean**

You have a pending transaction:
**Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
**Expires in:** ${timeLeft} minute${timeLeft === 1 ? '' : 's'}

${confirmationMatch.suggestion}

**To be clear:**
• Type **"yes"** to execute the trade
• Type **"no"** to cancel the trade`
                });
            }
            return true;
        }

        // Check for clear confirmation or cancellation
        const isConfirm = confirmationMatch.isConfirmation && confirmationMatch.isPositive;
        const isCancel = confirmationMatch.isConfirmation && confirmationMatch.isNegative;
        
        // EDGE CASE FIX: Handle unclear responses
        if (!confirmationMatch.isConfirmation) {
            if (callback) {
                callback({
                    text: `❓ **Need Confirmation**

You have a pending transaction that needs your decision:

**Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
**Transaction ID:** \`${transaction.id}\`

I didn't understand "${text}". Please respond clearly:
• **"yes"** or **"confirm"** to execute
• **"no"** or **"cancel"** to cancel

${fuzzyMatcher.getSuggestion(text, 'confirmation')}`
                });
            }
            return true;
        }

        if (isCancel) {
            // Cancel transaction
            const cancelled = await sessionService.cancelTransaction(platformUser, transaction.id);
            if (cancelled) {
                if (callback) {
                    callback({
                        text: `❌ **Transaction Cancelled**

**Cancelled Trade:**
• ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
• Transaction ID: \`${transaction.id}\`

Your funds remain untouched. You can initiate a new trade anytime! 💼`
                    });
                }
                return true;
            } else {
                if (callback) {
                    callback({
                        text: "❌ Failed to cancel transaction. It may have already expired."
                    });
                }
                return false;
            }
        }

        if (isConfirm) {
            // EDGE CASE FIX: Handle expired transactions gracefully
            const confirmedTx = await sessionService.confirmTransaction(platformUser, transaction.id);
            
            if (!confirmedTx) {
                // Check if it was expired
                const now = Date.now();
                if (now > transaction.expires) {
                    if (callback) {
                        callback({
                            text: `⏰ **Transaction Expired**

Your ${transaction.type} quote has expired (quotes are valid for 5 minutes).

**Expired Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}

**What happened:**
• Market prices may have changed
• The quote is no longer valid for execution

**Next Steps:**
• Create a new swap: "swap ${transaction.amount} ${transaction.fromToken} for ${transaction.toToken}"
• Get fresh pricing: "price of ${transaction.fromToken}"
• Check your balance: "show my balance"

*This keeps you safe from executing trades with stale pricing!* 🛡️`
                        });
                    }
                } else {
                    if (callback) {
                        callback({
                            text: "❌ Transaction not found or expired. Please create a new swap request."
                        });
                    }
                }
                return false;
            }

            // Execute the actual transaction
            try {
                console.log('📤 Retrieved quote data from session:', {
                    to: confirmedTx.quote?.to,
                    data: confirmedTx.quote?.data ? `${confirmedTx.quote.data.substring(0, 20)}...` : 'NO DATA',
                    dataLength: confirmedTx.quote?.data ? confirmedTx.quote.data.length : 0,
                    value: confirmedTx.quote?.value,
                    gas: confirmedTx.quote?.gas,
                    hasValidData: !!(confirmedTx.quote?.data && confirmedTx.quote.data !== '0x' && confirmedTx.quote.data !== ''),
                    quoteExists: !!confirmedTx.quote,
                    fullQuoteStructure: Object.keys(confirmedTx.quote || {})
                });
                
                // 🔧 ADDITIONAL DEBUG: Log the full transaction being stored and retrieved
                console.log('🔍 Full transaction debug:', {
                    transactionId: confirmedTx.id,
                    type: confirmedTx.type,
                    fromToken: confirmedTx.fromToken,
                    toToken: confirmedTx.toToken,
                    amount: confirmedTx.amount,
                    quoteKeys: confirmedTx.quote ? Object.keys(confirmedTx.quote) : 'NO QUOTE',
                    dataExists: !!confirmedTx.quote?.data,
                    dataValue: confirmedTx.quote?.data || 'UNDEFINED',
                    toExists: !!confirmedTx.quote?.to,
                    toValue: confirmedTx.quote?.to || 'UNDEFINED'
                });
                
                if (callback) {
                    callback({
                        text: `🔄 **Executing Transaction...**

**Processing ${confirmedTx.type === 'addLiquidity' ? 'Liquidity Addition' : 'Trade'}:**
• ${confirmedTx.type === 'addLiquidity' 
    ? `Adding liquidity to ${confirmedTx.fromToken}/${confirmedTx.toToken} pool`
    : `${confirmedTx.amount} ${confirmedTx.fromToken} → ${confirmedTx.toToken}`}
• Transaction ID: \`${confirmedTx.id}\`

⏳ Please wait while we execute your ${confirmedTx.type === 'addLiquidity' ? 'liquidity provision' : 'trade'} on-chain...
This may take 30-60 seconds depending on network conditions.`
                    });
                }

                // Initialize wallet service
                const walletService = new WalletService(runtime as IExtendedRuntime);
                
                // Get user's active wallet
                const activeWallet = await walletService.getActiveWallet(platformUser);
                if (!activeWallet) {
                    throw new Error("No active wallet found");
                }

                // Get wallet private key for signing
                const privateKey = await walletService.getWalletPrivateKey(platformUser);
                if (!privateKey) {
                    throw new Error("Unable to access wallet private key");
                }

                // 🏊‍♂️ HANDLE ADD LIQUIDITY TRANSACTIONS
                if (confirmedTx.type === 'addLiquidity') {
                    console.log('🏊‍♂️ Executing liquidity addition:', {
                        poolAddress: confirmedTx.quote?.poolAddress,
                        orderedSymbol0: confirmedTx.quote?.orderedSymbol0,
                        orderedSymbol1: confirmedTx.quote?.orderedSymbol1,
                        amount0: confirmedTx.quote?.amount0,
                        amount1: confirmedTx.quote?.amount1,
                        rangeStrategy: confirmedTx.quote?.rangeStrategy
                    });

                    // Get the position manager and execute mint
                    const { NineMmV3PositionManager } = await import('../utils/9mm-v3-position-manager.js');
                    const positionManager = new NineMmV3PositionManager();
                    
                    // Execute the mint transaction
                    const mintResult = await positionManager.mintNewPosition(
                        confirmedTx.quote.mintParams,
                        privateKey
                    );

                    if (mintResult.success) {
                        const responseText = `✅ **Liquidity Added Successfully!**

🎉 **New Position Created:**
• **Pool:** ${confirmedTx.quote.orderedSymbol0}/${confirmedTx.quote.orderedSymbol1}
• **Position ID:** #${mintResult.tokenId}
• **Amounts Deposited:**
  - ${confirmedTx.quote.amount0} ${confirmedTx.quote.orderedSymbol0}
  - ${confirmedTx.quote.amount1} ${confirmedTx.quote.orderedSymbol1}
• **Price Range:** ${confirmedTx.quote.rangeStrategy}

📊 **Transaction Details:**
• **Hash:** \`${mintResult.transactionHash}\`
• **Liquidity:** ${mintResult.liquidity}

💡 **Next Steps:**
• Monitor your position's performance
• Collect fees periodically
• Adjust range if market moves significantly

🔗 [View on Explorer](https://kekxplorer.avecdra.pro/tx/${mintResult.transactionHash})`;

                        if (callback) {
                            callback({ text: responseText });
                        }
                        return true;
                    } else {
                        throw new Error(mintResult.error || 'Liquidity addition failed');
                    }
                }

                // 🔄 CHECK IF THIS IS A WRAP/UNWRAP OPERATION
                const isWrapOperation = WrapperService.isWrapOperation(confirmedTx.fromToken, confirmedTx.toToken);
                
                let txHash: string;
                let receipt: any;
                
                if (isWrapOperation) {
                    // Handle wrap/unwrap operation directly with WPLS contract
                    const wrapperService = new WrapperService(369);
                    const isWrap = confirmedTx.fromToken.toLowerCase() === 'pls';
                    
                    console.log(`🔄 Executing ${isWrap ? 'wrap' : 'unwrap'} operation:`, {
                        from: activeWallet.address,
                        amount: confirmedTx.amount,
                        operation: isWrap ? 'PLS -> WPLS' : 'WPLS -> PLS'
                    });
                    
                    const wrapResult = isWrap 
                        ? await wrapperService.wrap(privateKey, confirmedTx.amount.toString())
                        : await wrapperService.unwrap(privateKey, confirmedTx.amount.toString());
                    
                    txHash = wrapResult.hash;
                    receipt = {
                        blockNumber: wrapResult.blockNumber,
                        gasUsed: wrapResult.gasUsed,
                        status: wrapResult.status === 'confirmed' ? 1 : 0
                    };
                    
                } else {
                    // Execute regular swap using the aggregator
                    
                    // Execute real transaction using ethers.js v5
                    const { ethers } = await import('ethers');
                    
                    // Create provider for PulseChain (ethers v5 syntax)
                    const provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com');
                    
                    // Create wallet instance from private key (ethers v5)
                    const wallet = new ethers.Wallet(privateKey, provider);
                    
                    console.log('Executing real swap transaction:', {
                        from: activeWallet.address,
                        to: confirmedTx.quote.to,
                        data: confirmedTx.quote.data,
                        value: confirmedTx.quote.value,
                        dataLength: confirmedTx.quote.data ? confirmedTx.quote.data.length : 0,
                        hasData: !!confirmedTx.quote.data,
                        gas: confirmedTx.quote.gas
                    });
                    
                    // 🔧 ENHANCED VALIDATION: Better error reporting for transaction data
                    console.log('🔍 Validating transaction data:', {
                        hasQuote: !!confirmedTx.quote,
                        hasData: !!confirmedTx.quote?.data,
                        dataValue: confirmedTx.quote?.data,
                        dataLength: confirmedTx.quote?.data?.length || 0,
                        dataType: typeof confirmedTx.quote?.data,
                        isValidHex: confirmedTx.quote?.data?.startsWith?.('0x'),
                        hasTo: !!confirmedTx.quote?.to,
                        toValue: confirmedTx.quote?.to
                    });
                    
                    if (!confirmedTx.quote) {
                        throw new Error('No quote data found in session - transaction may have expired');
                    }
                    
                    if (!confirmedTx.quote.to) {
                        throw new Error('Missing contract address (to) in quote data - invalid quote');
                    }
                    
                    // 🔧 DEADLINE FIX: ALWAYS regenerate quotes immediately before execution to avoid stale timestamps
                    console.log('🔄 Regenerating fresh quote immediately before execution to avoid deadline expiry:', {
                        fromToken: confirmedTx.fromToken,
                        toToken: confirmedTx.toToken,
                        amount: confirmedTx.amount,
                        originalQuoteAge: Date.now() - confirmedTx.timestamp,
                        reason: 'fresh_deadline_required'
                    });
                    
                    // 🔧 ALWAYS REGENERATE: Generate fresh quote with current timestamp
                    const aggregator = new NineMMAggregator(369);
                    const { NineMMAggregator: AggregatorClass } = await import('../utils/aggregator.js');
                    const { POPULAR_TOKENS } = await import('../config/chains.js');
                    
                    // 🔧 PRE-CHECK: Test 9X API availability before attempting quote
                    try {
                        console.log('🔍 Testing 9X API availability...');
                        const testResponse = await fetch('https://api.9mm.pro/swap/v1/sources', { 
                            method: 'GET'
                        });
                        
                        if (testResponse.ok) {
                            console.log('✅ 9X API is responding correctly');
                        } else {
                            console.error('⚠️ 9X API health check failed:', {
                                status: testResponse.status,
                                statusText: testResponse.statusText
                            });
                        }
                    } catch (apiError) {
                        console.error('❌ 9X API appears to be unreachable:', {
                            error: apiError.message,
                            fallbackPlan: 'Will attempt quote generation anyway'
                        });
                    }
                    
                    const pulsechainTokens = POPULAR_TOKENS.pulsechain;
                    const fromTokenAddress = pulsechainTokens[confirmedTx.fromToken as keyof typeof pulsechainTokens];
                    const toTokenAddress = pulsechainTokens[confirmedTx.toToken as keyof typeof pulsechainTokens];
                    
                    if (!fromTokenAddress || !toTokenAddress) {
                        throw new Error(`Token addresses not found: ${confirmedTx.fromToken} or ${confirmedTx.toToken}`);
                    }
                    
                    // Get token metadata for proper amount formatting
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
                    
                    const fromTokenMeta = TOKEN_METADATA[confirmedTx.fromToken] || { decimals: 18, symbol: confirmedTx.fromToken };
                    const amountInWei = AggregatorClass.formatAmount(confirmedTx.amount.toString(), fromTokenMeta.decimals);
                    
                    console.log('🔄 Regenerating quote with fresh timestamp:', {
                        fromToken: fromTokenAddress,
                        toToken: toTokenAddress,
                        amount: amountInWei,
                        userAddress: activeWallet.address,
                        currentTimestamp: Math.floor(Date.now() / 1000)
                    });
                    
                    // Generate fresh quote with current timestamp
                    let freshQuote;
                    let freshQuoteAttempts = 0;
                    const maxAttempts = 3;
                    
                    while (freshQuoteAttempts < maxAttempts) {
                        freshQuoteAttempts++;
                        
                        try {
                            console.log(`🔄 Attempting fresh quote generation (attempt ${freshQuoteAttempts}/${maxAttempts})...`);
                            
                            freshQuote = await aggregator.getSwapQuote({
                                fromToken: fromTokenAddress,
                                toToken: toTokenAddress,
                                amount: amountInWei,
                                slippagePercentage: 0.5, // Default slippage
                                userAddress: activeWallet.address,
                                chainId: 369
                            });
                            
                            console.log('✅ Fresh quote generated:', {
                                to: freshQuote.to,
                                data: freshQuote.data ? `${freshQuote.data.substring(0, 20)}...` : 'NO DATA',
                                dataLength: freshQuote.data ? freshQuote.data.length : 0,
                                hasValidData: !!(freshQuote.data && freshQuote.data !== '0x' && freshQuote.data !== ''),
                                value: freshQuote.value,
                                gas: freshQuote.gas,
                                generatedAt: Math.floor(Date.now() / 1000),
                                buyAmount: freshQuote.buyAmount,
                                sellAmount: freshQuote.sellAmount
                            });
                            
                            // Check if quote has valid data
                            if (freshQuote.data && freshQuote.data !== '0x' && freshQuote.data !== '') {
                                console.log('✅ Fresh quote has valid transaction data - proceeding');
                                break;
                            } else {
                                console.error(`❌ Fresh quote attempt ${freshQuoteAttempts} has no transaction data:`, {
                                    dataValue: freshQuote.data,
                                    dataType: typeof freshQuote.data,
                                    dataLength: freshQuote.data?.length || 0,
                                    to: freshQuote.to,
                                    hasTo: !!freshQuote.to
                                });
                                
                                if (freshQuoteAttempts === maxAttempts) {
                                    throw new Error(`Fresh quote generation failed after ${maxAttempts} attempts - all quotes had empty transaction data. The 9X API may be experiencing issues.`);
                                }
                                
                                // Wait 1 second before retry
                                await new Promise(resolve => setTimeout(resolve, 1000));
                                continue;
                            }
                            
                        } catch (quoteError) {
                            console.error(`❌ Fresh quote attempt ${freshQuoteAttempts} failed:`, {
                                error: quoteError,
                                message: quoteError.message,
                                fromToken: fromTokenAddress,
                                toToken: toTokenAddress,
                                amount: amountInWei,
                                userAddress: activeWallet.address
                            });
                            
                            if (freshQuoteAttempts === maxAttempts) {
                                throw new Error(`Fresh quote generation failed after ${maxAttempts} attempts: ${quoteError.message}`);
                            }
                            
                            // Wait 2 seconds before retry on error
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    }
                    
                    // Final validation
                    if (!freshQuote || !freshQuote.data || freshQuote.data === '0x' || freshQuote.data === '') {
                        console.error('❌ CRITICAL: Fresh quote generation completely failed:', {
                            freshQuoteExists: !!freshQuote,
                            dataValue: freshQuote?.data,
                            dataType: typeof freshQuote?.data,
                            originalQuoteData: confirmedTx.quote?.data ? `${confirmedTx.quote.data.substring(0, 20)}...` : 'NO DATA'
                        });
                        
                        // Fallback: Use original quote but warn about potential deadline issues
                        console.log('⚠️ FALLBACK: Using original quote due to fresh quote failure - may have deadline issues');
                        if (!confirmedTx.quote?.data || confirmedTx.quote.data === '0x' || confirmedTx.quote.data === '') {
                            throw new Error('Both fresh quote and original quote have no transaction data - cannot execute swap');
                        }
                        // Continue with original quote (don't update confirmedTx.quote)
                    } else {
                        // Use the fresh quote with current timestamp
                        console.log('✅ Using fresh quote with valid transaction data');
                        confirmedTx.quote = freshQuote;
                    }
                    
                    // 🔧 ETHERS V6 FIX: Properly format transaction object for ethers.js v6
                    console.log('🔍 Quote values before formatting:', {
                        to: confirmedTx.quote.to,
                        data: confirmedTx.quote.data ? `${confirmedTx.quote.data.substring(0, 20)}...` : 'NO DATA',
                        dataLength: confirmedTx.quote.data?.length || 0,
                        dataType: typeof confirmedTx.quote.data,
                        value: confirmedTx.quote.value,
                        valueType: typeof confirmedTx.quote.value,
                        gas: confirmedTx.quote.gas,
                        gasType: typeof confirmedTx.quote.gas
                    });
                    
                    // Format fields properly for ethers v5
                    const formattedValue = confirmedTx.quote.value || '0';
                    
                    // 🔧 ENHANCED GAS HANDLING: API estimates + minimal safety buffer
                    const apiGasEstimate = confirmedTx.quote.gas ? 
                        parseInt(confirmedTx.quote.gas.toString()) : 500000;
                    
                    // Add minimal 15% safety buffer (much smaller than before since API is now accurate)
                    const gasBuffer = Math.floor(apiGasEstimate * 0.15);
                    const gasLimit = apiGasEstimate + gasBuffer;
                    
                    console.log('⛽ Gas calculation with realistic API estimate:', {
                        apiEstimate: apiGasEstimate,
                        safetyBuffer: gasBuffer,
                        finalGasLimit: gasLimit,
                        bufferPercentage: '15%',
                        source: 'API with current gasPrice + safety buffer'
                    });
                    
                    const txRequest = {
                        to: confirmedTx.quote.to,
                        data: confirmedTx.quote.data, // Keep as string - ethers v5 expects hex string
                        value: formattedValue, // Ensure string format
                        gasLimit: gasLimit // Use API estimate (now accurate with gasPrice)
                    };
                    
                    console.log('🔧 Formatted transaction request:', {
                        to: txRequest.to,
                        data: txRequest.data ? `${txRequest.data.substring(0, 20)}...` : 'NO DATA',
                        dataLength: txRequest.data?.length || 0,
                        dataExists: !!txRequest.data,
                        value: txRequest.value,
                        gasLimit: txRequest.gasLimit,
                        gasLimitType: typeof txRequest.gasLimit
                    });
                    
                    // 🔧 ETHERS V5: Additional validation before sending
                    if (!txRequest.data || txRequest.data === '' || txRequest.data === '0x') {
                        console.error('❌ CRITICAL: Transaction data is empty after formatting:', {
                            txRequestData: txRequest.data,
                            txRequestDataType: typeof txRequest.data,
                            txRequestDataLength: txRequest.data?.length || 0,
                            originalQuoteData: confirmedTx.quote?.data ? `${confirmedTx.quote.data.substring(0, 20)}...` : 'NO DATA',
                            originalQuoteDataLength: confirmedTx.quote?.data?.length || 0,
                            quoteExists: !!confirmedTx.quote,
                            toAddress: txRequest.to,
                            value: txRequest.value,
                            gasLimit: txRequest.gasLimit
                        });
                        throw new Error('Transaction data is empty after formatting - cannot send empty transaction to DEX contract');
                    }
                    
                    // 🔧 FINAL SAFETY CHECK: Ensure data is properly formatted hex
                    if (!txRequest.data.startsWith('0x') || txRequest.data.length < 10) {
                        console.error('❌ CRITICAL: Transaction data format is invalid:', {
                            data: txRequest.data,
                            dataLength: txRequest.data.length,
                            startsWithOx: txRequest.data.startsWith('0x'),
                            minimumLength: txRequest.data.length >= 10
                        });
                        throw new Error('Transaction data format is invalid - data must be valid hex starting with 0x');
                    }
                    
                    let txResponse;
                    try {
                        console.log('🚀 Sending transaction with ethers v5...');
                        txResponse = await wallet.sendTransaction(txRequest);
                        txHash = txResponse.hash;
                        
                        console.log('✅ Transaction sent successfully:', {
                            hash: txHash,
                            to: txResponse.to,
                            value: txResponse.value ? txResponse.value.toString() : '0',
                            gasLimit: txResponse.gasLimit ? txResponse.gasLimit.toString() : '0',
                            dataExists: !!txResponse.data,
                            dataLength: txResponse.data?.length || 0
                        });
                        
                    } catch (ethersError) {
                        console.error('❌ Ethers.js v5 transaction error:', {
                            error: ethersError,
                            message: ethersError.message,
                            code: ethersError.code,
                            txRequest: {
                                to: txRequest.to,
                                dataExists: !!txRequest.data,
                                dataLength: txRequest.data?.length || 0,
                                value: txRequest.value,
                                gasLimit: txRequest.gasLimit
                            }
                        });
                        throw ethersError;
                    }

                    // Wait for transaction confirmation
                    console.log(`⏳ Waiting for transaction confirmation: ${txHash}`);
                    receipt = await txResponse.wait();
                }
                
                if (callback) {
                    const operationType = isWrapOperation ? 
                        (confirmedTx.fromToken.toLowerCase() === 'pls' ? 'Wrap' : 'Unwrap') : 
                        'Trade';
                    
                    // Get explorer URL for the transaction
                    const chainConfig = CHAIN_CONFIGS.pulsechain;
                    const explorerUrl = `${chainConfig.explorerUrl}/tx/${txHash}`;
                    
                    callback({
                        text: `✅ **Transaction Successful!**

**Completed ${operationType}:**
• **Amount:** ${confirmedTx.amount} ${confirmedTx.fromToken} → ${confirmedTx.toToken}
• **Transaction Hash:** [${txHash}](${explorerUrl})
• **Block Number:** ${receipt.blockNumber}
• **Gas Used:** ${receipt.gasUsed}
• **Status:** Confirmed on PulseChain
${isWrapOperation ? '• **Type:** Direct WPLS Contract Interaction' : '• **Type:** DEX Aggregator Swap'}

**Next Steps:**
• Check your wallet balance: "Show my balance"
• [View transaction on explorer](${explorerUrl})
• Set up price alerts for monitoring

🎉 **${operationType} executed successfully!** Your ${confirmedTx.toToken} tokens should appear in your wallet shortly.`
                    });
                }

                return true;

            } catch (error) {
                console.error('Transaction execution error:', error);
                if (callback) {
                    callback({
                        text: `❌ **Transaction Failed**

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

**What happened:**
• The swap quote was valid but execution failed
• This could be due to network issues, insufficient balance, or changed market conditions
• Your funds are safe and no transaction was processed

**Next Steps:**
• Check your wallet balance
• Try creating a new swap with current market prices
• Contact support if the issue persists

**Transaction ID:** \`${confirmedTx.id}\``
                    });
                }
                return false;
            }
        }

        // If neither confirm nor cancel, provide help
        if (callback) {
            callback({
                text: `⏳ **Pending Transaction Confirmation**

You have a pending transaction waiting for confirmation:

**Trade:** ${transaction.amount} ${transaction.fromToken} → ${transaction.toToken}
**Expires:** ${new Date(transaction.expires).toLocaleTimeString()}

**To proceed:**
• Reply "yes" or "confirm" to execute the trade
• Reply "no" or "cancel" to cancel the trade

**Transaction ID:** \`${transaction.id}\``
            });
        }

        return true;
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "yes" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll confirm your pending transaction and execute the trade on-chain.",
                    action: "TRANSACTION_CONFIRMATION"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "cancel" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll cancel your pending transaction. Your funds remain safe and untouched.",
                    action: "TRANSACTION_CONFIRMATION"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "confirm the swap" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll execute your confirmed swap transaction now. Please wait while I process it on-chain.",
                    action: "TRANSACTION_CONFIRMATION"
                }
            }
        ]
    ] as ActionExample[][],
};

export default transactionConfirmationAction; 