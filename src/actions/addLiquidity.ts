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
import { NineMmPoolDiscoveryService } from "../utils/9mm-v3-pool-discovery.js";
import { NineMmV3PositionManager } from "../utils/9mm-v3-position-manager.js";
import { POPULAR_TOKENS } from "../config/chains.js";
import { ethers } from "ethers";
import { WalletGuard } from "../utils/walletGuard.js";
import { sessionService } from "../services/sessionService.js";
import { WalletService } from "../services/walletService.js";
import { IExtendedRuntime } from "../types/extended.js";
import { ApprovalHelper } from "../utils/approvalHelper.js";
import { NINMM_CONTRACTS } from "../config/chains.js";

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

const formatAmount = (amount: string, decimals: number): string => {
    try {
        const bigAmount = ethers.utils.parseUnits(amount, decimals);
        return bigAmount.toString();
    } catch (error) {
        console.error('Error formatting amount:', error);
        throw new Error(`Invalid amount format: ${amount}`);
    }
};

const addLiquidityAction: Action = {
    name: "ADD_LIQUIDITY",
    similes: [
        "PROVIDE_LIQUIDITY",
        "ADD_TO_POOL",
        "SUPPLY_LIQUIDITY",
        "BECOME_LP",
        "ADD_LP",
        "CREATE_POSITION"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        
        if (!text) {
            return false;
        }
        
        const parsed = await parseCommand(text);
        
        return parsed.intent === 'addLiquidity' && parsed.confidence > 0.6;
    },
    description: "Add liquidity to 9mm V3 pools using natural language commands",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        const text = message.content?.text?.toLowerCase() || '';
        
        if (!text) {
            if (callback) {
                callback({
                    text: "❌ No message text provided"
                });
            }
            return false;
        }
        
        const parsed = await parseCommand(text);
        
        console.log(`🔍 Parsed tokens: fromToken="${parsed.fromToken}", toToken="${parsed.toToken}"`);
        
        if (!parsed.fromToken || !parsed.toToken) {
            if (callback) {
                callback({
                    text: "I need to know which token pair you want to provide liquidity for. Please specify both tokens. For example: 'Add liquidity to PLS/USDC pool with 1000 USDC'"
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
            const poolDiscovery = new NineMmPoolDiscoveryService();
            const positionManager = new NineMmV3PositionManager();
            
            // Get token addresses with PLS→WPLS conversion
            const pulsechainTokens = POPULAR_TOKENS.pulsechain;
            
            // Convert PLS to WPLS for pool discovery (pools use WPLS, not native PLS)
            const normalizeToken = (token: string) => token.toUpperCase() === 'PLS' ? 'WPLS' : token.toUpperCase();
            const normalizedFromToken = normalizeToken(parsed.fromToken);
            const normalizedToToken = normalizeToken(parsed.toToken);
            
            console.log(`🔍 Normalized tokens: ${normalizedFromToken}/${normalizedToToken}`);
            
            console.log(`📋 Looking up token addresses...`);
            const token0Address = pulsechainTokens[normalizedFromToken as keyof typeof pulsechainTokens];
            const token1Address = pulsechainTokens[normalizedToToken as keyof typeof pulsechainTokens];
            
            console.log(`📍 Token addresses: ${normalizedFromToken}=${token0Address}, ${normalizedToToken}=${token1Address}`);
            
            if (!token0Address || !token1Address) {
                console.error(`❌ Token lookup failed: ${normalizedFromToken}=${token0Address}, ${normalizedToToken}=${token1Address}`);
                throw new Error(`Token not found: ${normalizedFromToken} or ${normalizedToToken}`);
            }

            // Find pools specifically for this token pair (faster than getting all pools)
            console.log(`🔍 Searching for pools: ${token0Address} / ${token1Address}`);
            
            let pools;
            try {
                console.log(`📡 Making GraphQL request to find pools...`);
                pools = await poolDiscovery.findPools(token0Address, token1Address);
                console.log(`📊 Raw pools found: ${pools.length}`);
            } catch (error) {
                console.error(`❌ GraphQL request failed:`, error);
                if (callback) {
                    callback({
                        text: `❌ Unable to fetch pool data from 9mm DEX. Please try again later.\n\nError: ${error.message}`
                    });
                }
                return false;
            }
            
            // These pools are already filtered for the token pair
            const filteredPools = pools;
            console.log(`✅ Filtered pools: ${filteredPools.length}`);

            if (filteredPools.length === 0) {
                if (callback) {
                    callback({
                        text: `❌ No liquidity pools found for ${normalizedFromToken}/${normalizedToToken} pair.

💡 **Suggested Actions:**
• Check if both tokens exist on 9mm DEX
• Try creating a new pool if you have sufficient liquidity
• Consider other token pairs with better liquidity

🔗 **Create Pool**: Visit [9mm.pro](https://9mm.pro) → Pools → Create`
                    });
                }
                return false;
            }

            // Sort by volume (already sorted, but ensure) and take top 5
            const topPools = filteredPools
                .sort((a, b) => parseFloat(b.volumeUSD) - parseFloat(a.volumeUSD))
                .slice(0, 5);

            // Check if user provided a pool selection
            const poolSelectionMatch = text.match(/(?:pool\s*)?#?(\d+)|select\s*(\d+)|choose\s*(\d+)|number\s*(\d+)/i);
            const selectedNumber = poolSelectionMatch ? 
                parseInt(poolSelectionMatch[1] || poolSelectionMatch[2] || poolSelectionMatch[3] || poolSelectionMatch[4]) : null;

            // If no pool selected yet or no amount, show the list
            if (!selectedNumber || !parsed.amount) {
                // Format pool list
            const feeTierMap: { [key: string]: string } = {
                '2500': '0.25%',
                '10000': '1%',
                '20000': '2%'
            };

                let poolListText = `🏊‍♂️ **Available ${normalizedFromToken}/${normalizedToToken} Liquidity Pools**\n\n`;
                
                topPools.forEach((pool, index) => {
                    const feeTier = feeTierMap[pool.feeTier] || `${parseInt(pool.feeTier) / 10000}%`;
                    const volume24h = parseFloat(pool.volumeUSD).toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                    });
                    const tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
                style: 'currency',
                        currency: 'USD',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
            });

                    // Calculate estimated APY
                    const dayData = pool.poolDayData || [];
            const avgDailyFees = dayData.length > 0 
                        ? dayData.reduce((sum: number, day: any) => sum + parseFloat(day.feesUSD), 0) / dayData.length
                        : parseFloat(pool.feesUSD || '0');
                    const estimatedAPY = pool.totalValueLockedUSD !== '0' 
                        ? (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100
                        : 0;

                    // Determine which token order this pool uses
                    const poolUsesNormalOrder = pool.token0.symbol === normalizedFromToken;
                    const displayToken0 = poolUsesNormalOrder ? normalizedFromToken : normalizedToToken;
                    const displayToken1 = poolUsesNormalOrder ? normalizedToToken : normalizedFromToken;
                    const price = poolUsesNormalOrder ? parseFloat(pool.token0Price) : (1 / parseFloat(pool.token0Price));

                    poolListText += `**${index + 1}. ${displayToken0}/${displayToken1} - ${feeTier} Fee**\n`;
                    poolListText += `   📊 24h Volume: ${volume24h} ${index === 0 ? '🔥' : ''}\n`;
                    poolListText += `   💰 TVL: ${tvl}\n`;
                    poolListText += `   📈 Est. APY: ${estimatedAPY.toFixed(2)}%\n`;
                    poolListText += `   💱 Price: ${price.toFixed(6)} ${displayToken1} per ${displayToken0}\n\n`;
                });

                poolListText += `**📝 How to proceed:**\n`;
                
                if (!parsed.amount) {
                    poolListText += `• Specify the amount and pool number together\n`;
                    poolListText += `• Example: "Add 1000 ${parsed.fromToken || 'TOKEN'} to pool 1"\n`;
                    poolListText += `• Or: "Provide liquidity to #2 with 500 ${parsed.fromToken || 'TOKEN'}"\n`;
                } else {
                    poolListText += `• Select a pool by number\n`;
                    poolListText += `• Example: "pool 1" or just "1" or "add to pool 1"\n`;
                    poolListText += `• Amount ready: ${parsed.amount} ${parsed.fromToken}\n`;
                }
                
                poolListText += `\n💡 **Tip:** Higher volume pools typically generate more fees!`;

                console.log(`📝 Sending pool list response (${poolListText.length} characters)`);
                if (callback) {
                    callback({ text: poolListText });
                } else {
                    console.log('⚠️ No callback function provided!');
                }
                return true;
            }

            // User selected a pool number, validate and proceed
            if (selectedNumber < 1 || selectedNumber > topPools.length) {
                if (callback) {
                    callback({
                        text: `❌ Invalid selection. Please choose a number between 1 and ${topPools.length}.`
                    });
                }
                return true;
            }

            // Get the selected pool
            const selectedPool = topPools[selectedNumber - 1];
            console.log(`✅ User selected pool #${selectedNumber}:`, selectedPool.id);

            // Determine if we need to swap token order to match pool
            const needsTokenSwap = selectedPool.token0.symbol !== normalizedFromToken;
            const orderedToken0 = needsTokenSwap ? token1Address : token0Address;
            const orderedToken1 = needsTokenSwap ? token0Address : token1Address;
            const orderedSymbol0 = needsTokenSwap ? normalizedToToken : normalizedFromToken;
            const orderedSymbol1 = needsTokenSwap ? normalizedFromToken : normalizedToToken;

            // Get pool contract information directly
            const fee = parseInt(selectedPool.feeTier);
            const poolInfo = await positionManager.getPoolInfo(orderedToken0, orderedToken1, fee);
            
            if (!poolInfo) {
                throw new Error('Could not fetch pool contract information');
            }

            // Determine range strategy and calculate ticks
            let rangeStrategy = parsed.rangeType || 'moderate';
            const tickSpacing = positionManager.getTickSpacing(selectedPool.feeTier);
            const currentPrice = parseFloat(selectedPool.token0Price);
            
            let tickLower: number;
            let tickUpper: number;
            let rangeWidth = '';
            
            switch (rangeStrategy) {
                case 'full':
                    // Full range position
                    tickLower = -887272; // Min tick for full range
                    tickUpper = 887272;  // Max tick for full range
                    rangeWidth = 'Full Range (Infinite)';
                    break;
                case 'concentrated':
                    // ±5% range
                    const concentratedRange = await positionManager.suggestOptimalRange(
                        poolInfo.poolAddress,
                        currentPrice,
                        'aggressive',
                        selectedPool.feeTier
                    );
                    const concentratedTicks = positionManager.calculateTickRange(
                        concentratedRange.lower,
                        concentratedRange.upper,
                        tickSpacing
                    );
                    tickLower = concentratedTicks.tickLower;
                    tickUpper = concentratedTicks.tickUpper;
                    rangeWidth = '±5% (Aggressive - Higher returns, more management)';
                    break;
                default:
                    // ±10% range (moderate)
                    const moderateRange = await positionManager.suggestOptimalRange(
                        poolInfo.poolAddress,
                        currentPrice,
                        'moderate',
                        selectedPool.feeTier
                    );
                    const moderateTicks = positionManager.calculateTickRange(
                        moderateRange.lower,
                        moderateRange.upper,
                        tickSpacing
                    );
                    tickLower = moderateTicks.tickLower;
                    tickUpper = moderateTicks.tickUpper;
                    rangeWidth = '±10% (Moderate - Balanced returns and risk)';
            }

            // Get wallet service for checking balances
            const walletService = new WalletService(runtime as IExtendedRuntime);
            const activeWallet = await walletService.getActiveWallet(platformUser);
            if (!activeWallet) {
                throw new Error("No active wallet found");
            }

            // Calculate amounts based on parsed input
            const token0Meta = TOKEN_METADATA[orderedSymbol0] || { decimals: 18, symbol: orderedSymbol0 };
            const token1Meta = TOKEN_METADATA[orderedSymbol1] || { decimals: 18, symbol: orderedSymbol1 };
            
            let amount0Desired = "0";
            let amount1Desired = "0";
            
            if (parsed.amount) {
                // User specified an amount for one token
                // Calculate the other token amount based on current price
                const specifiedToken = parsed.fromToken.toUpperCase() === 'PLS' ? 'WPLS' : parsed.fromToken.toUpperCase();
                
                if (specifiedToken === orderedSymbol0) {
                    amount0Desired = formatAmount(parsed.amount.toString(), token0Meta.decimals);
                    // Calculate token1 amount based on current price
                    const token1Amount = Number(parsed.amount) * currentPrice;
                    amount1Desired = formatAmount(token1Amount.toFixed(token1Meta.decimals), token1Meta.decimals);
                } else {
                    amount1Desired = formatAmount(parsed.amount.toString(), token1Meta.decimals);
                    // Calculate token0 amount based on current price
                    const token0Amount = Number(parsed.amount) / currentPrice;
                    amount0Desired = formatAmount(token0Amount.toFixed(token0Meta.decimals), token0Meta.decimals);
                }
            } else {
                // No amount specified - show info only
                const responseText = await formatPoolInfoResponse(
                    selectedPool,
                    parsed,
                    rangeWidth,
                    orderedSymbol0,
                    orderedSymbol1
                );
                
                if (callback) {
                    callback({ text: responseText });
                }
                return true;
            }

            // Calculate optimal amounts based on range
            const optimalAmounts = positionManager.calculateOptimalAmounts(
                amount0Desired,
                amount1Desired,
                poolInfo.currentTick,
                tickLower,
                tickUpper,
                token0Meta.decimals,
                token1Meta.decimals
            );

            // Apply slippage tolerance (default 0.5%)
            const slippageTolerance = 0.5;
            const amount0Min = ethers.BigNumber.from(optimalAmounts.amount0)
                .mul(1000 - slippageTolerance * 10)
                .div(1000)
                .toString();
            const amount1Min = ethers.BigNumber.from(optimalAmounts.amount1)
                .mul(1000 - slippageTolerance * 10)
                .div(1000)
                .toString();

            // Check token approvals
            const approvalHelper = new ApprovalHelper(369);
            
            // Check approval for token0 (if not native)
            if (orderedToken0.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
                const approval0Status = await approvalHelper.checkApprovalStatus(
                    orderedToken0,
                    activeWallet.address,
                    optimalAmounts.amount0,
                    NINMM_CONTRACTS.pulsechain.nineMM_V3_PositionManager
                );

                if (approval0Status.needsApproval) {
                    console.log('🔒 Token0 approval required');
                    const privateKey = await walletService.getWalletPrivateKey(platformUser);
                    if (!privateKey) {
                        throw new Error("Unable to access wallet private key for approval");
                    }

                    const approvalResult = await approvalHelper.executeApproval(
                        orderedToken0,
                        privateKey,
                        ApprovalHelper.getRecommendedApprovalAmount(optimalAmounts.amount0, 'unlimited'),
                        NINMM_CONTRACTS.pulsechain.nineMM_V3_PositionManager
                    );

                    if (!approvalResult.success) {
                        throw new Error(`Token0 approval failed: ${approvalResult.error}`);
                    }
                    console.log(`✅ Token0 approval successful: ${approvalResult.transactionHash}`);
                }
            }

            // Check approval for token1 (if not native)
            if (orderedToken1.toLowerCase() !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
                const approval1Status = await approvalHelper.checkApprovalStatus(
                    orderedToken1,
                    activeWallet.address,
                    optimalAmounts.amount1,
                    NINMM_CONTRACTS.pulsechain.nineMM_V3_PositionManager
                );

                if (approval1Status.needsApproval) {
                    console.log('🔒 Token1 approval required');
                    const privateKey = await walletService.getWalletPrivateKey(platformUser);
                    if (!privateKey) {
                        throw new Error("Unable to access wallet private key for approval");
                    }

                    const approvalResult = await approvalHelper.executeApproval(
                        orderedToken1,
                        privateKey,
                        ApprovalHelper.getRecommendedApprovalAmount(optimalAmounts.amount1, 'unlimited'),
                        NINMM_CONTRACTS.pulsechain.nineMM_V3_PositionManager
                    );

                    if (!approvalResult.success) {
                        throw new Error(`Token1 approval failed: ${approvalResult.error}`);
                    }
                    console.log(`✅ Token1 approval successful: ${approvalResult.transactionHash}`);
                }
            }

            // Build the mint transaction
            const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minutes from now
            
            const mintParams = {
                token0: orderedToken0,
                token1: orderedToken1,
                fee: fee,
                tickLower: tickLower,
                tickUpper: tickUpper,
                amount0Desired: optimalAmounts.amount0,
                amount1Desired: optimalAmounts.amount1,
                amount0Min: amount0Min,
                amount1Min: amount1Min,
                recipient: activeWallet.address,
                deadline: deadline
            };

            const mintTx = await positionManager.buildMintTransaction(mintParams);

            // Create pending transaction for confirmation
            const transactionId = await sessionService.createPendingTransaction(
                platformUser,
                'addLiquidity',
                {
                    type: 'addLiquidity',
                    fromToken: parsed.fromToken,
                    toToken: parsed.toToken,
                    amount: parsed.amount,
                    quote: {
                        // Store all liquidity-specific data in quote
                        mintTx: mintTx,
                        mintParams: mintParams,
                        poolAddress: poolInfo.poolAddress,
                        rangeStrategy: rangeStrategy,
                        orderedSymbol0: orderedSymbol0,
                        orderedSymbol1: orderedSymbol1,
                        amount0: ethers.utils.formatUnits(optimalAmounts.amount0, token0Meta.decimals),
                        amount1: ethers.utils.formatUnits(optimalAmounts.amount1, token1Meta.decimals),
                        token0Meta: token0Meta,
                        token1Meta: token1Meta
                    },
                    chatId: (message.content as any)?.chatId || 0
                }
            );

            // Format confirmation message
            const feeTierMap: { [key: string]: string } = {
                '2500': '0.25%',
                '10000': '1%',
                '20000': '2%'
            };
            const feeTier = feeTierMap[selectedPool.feeTier] || `${parseInt(selectedPool.feeTier) / 10000}%`;
            
            const responseText = `🏊‍♂️ **Liquidity Addition Confirmation Required**

**Pool:** ${orderedSymbol0}/${orderedSymbol1} (${feeTier} fee tier)
**Pool Address:** \`${poolInfo.poolAddress}\`

💰 **Position Details:**
• **Token 0:** ${ethers.utils.formatUnits(optimalAmounts.amount0, token0Meta.decimals)} ${orderedSymbol0}
• **Token 1:** ${ethers.utils.formatUnits(optimalAmounts.amount1, token1Meta.decimals)} ${orderedSymbol1}
• **Price Range:** ${rangeWidth}
• **Tick Range:** [${tickLower}, ${tickUpper}]

📊 **Pool Metrics:**
• **TVL:** $${parseFloat(selectedPool.totalValueLockedUSD).toLocaleString()}
• **24h Volume:** $${parseFloat(selectedPool.volumeUSD).toLocaleString()}
• **Current Price:** ${currentPrice.toFixed(6)} ${orderedSymbol1} per ${orderedSymbol0}

⚠️ **Important:**
• This will create a new liquidity position NFT
• Your funds will be locked in the pool until you remove liquidity
• You'll earn fees when trades occur within your price range
• Position requires active management to stay in range

**Gas Estimate:** ~${Math.round(parseInt(mintTx.gasEstimate) / 1000)}K units

**Confirm this liquidity addition?**
• Reply "yes" or "confirm" to execute
• Reply "no" or "cancel" to cancel

**Transaction ID:** \`${transactionId}\``;

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Add liquidity action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to prepare liquidity addition: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: { text: "Add liquidity to PLS/USDC pool" }
            },
            {
                name: "{{agent}}",
                content: {   
                    text: "I'll show you the top PLS/USDC liquidity pools sorted by volume. You can then select which pool to use.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "I want to provide liquidity for HEX and DAI" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll find the available HEX/DAI pools and show you the top options by trading volume.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Add 1000 WPLS to pool 1" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll prepare your liquidity position for pool #1 with 1000 WPLS.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: { text: "Create concentrated position with 500 HEX in pool 2" }
            },
            {
                name: "{{agent}}",
                content: {
                    text: "I'll set up a concentrated liquidity position in pool #2 with 500 HEX for maximum capital efficiency.",
                    action: "ADD_LIQUIDITY"
                }
            }
        ]
    ] as ActionExample[][],
};

// Helper function to format pool info response
async function formatPoolInfoResponse(
    pool: any,
    parsed: any,
    rangeWidth: string,
    orderedSymbol0: string,
    orderedSymbol1: string
): Promise<string> {
    const feeTierMap: { [key: string]: string } = {
        '2500': '0.25%',
        '10000': '1%',
        '20000': '2%'
    };
    const feeTier = feeTierMap[pool.feeTier] || `${parseInt(pool.feeTier) / 10000}%`;
    const tvl = parseFloat(pool.totalValueLockedUSD).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    // Calculate estimated APY based on fees and volume
    const dayData = pool.poolDayData || [];
    const avgDailyFees = dayData.length > 0 
        ? dayData.reduce((sum: number, day: any) => sum + parseFloat(day.feesUSD), 0) / dayData.length
        : 0;
    const estimatedAPY = pool.totalValueLockedUSD !== '0' 
        ? (avgDailyFees * 365 / parseFloat(pool.totalValueLockedUSD)) * 100
        : 0;

    return `🏊‍♂️ **Liquidity Pool Information**

💰 **Pool: ${orderedSymbol0}/${orderedSymbol1}**
• Fee Tier: ${feeTier}
• TVL: ${tvl}
• Pool Address: \`${pool.id}\`

📊 **Performance Metrics:**
• 24h Volume: $${parseFloat(pool.volumeUSD).toLocaleString()}
• 24h Fees: $${parseFloat(pool.feesUSD || '0').toLocaleString()}
• Estimated APY: ${estimatedAPY.toFixed(2)}%

💱 **Current Price:**
• Current Price: ${parseFloat(pool.token0Price).toFixed(6)} ${orderedSymbol1} per ${orderedSymbol0}

💰 **Position Details:**
${parsed.amount ? `• Amount: ${parsed.amount} ${parsed.fromToken}` : '• Amount: Not specified'}
• Price Range: ${rangeWidth}

⚡ **To Add Liquidity:**
Specify the amount you want to provide. For example:
• "Add liquidity with 1000 ${orderedSymbol0}"
• "Provide 500 ${orderedSymbol1} to ${orderedSymbol0}/${orderedSymbol1} pool"
• "Create concentrated LP with 100 ${orderedSymbol0}"

*Note: V3 positions require active management. Out-of-range positions don't earn fees.*`;
}

export default addLiquidityAction; 