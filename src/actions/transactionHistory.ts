import {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    type Action,
} from "@elizaos/core";
import { parseCommand } from "../utils/parser.js";
import { WalletService, createPlatformUser } from "../services/walletService.js";

const transactionHistoryAction: Action = {
    name: "TRANSACTION_HISTORY",
    similes: [
        "RECENT_TRADES",
        "TRADE_HISTORY", 
        "TRANSACTION_LOG",
        "MY_TRANSACTIONS",
        "TRADING_ACTIVITY",
        "SWAP_HISTORY"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        const text = message.content?.text?.toLowerCase() || '';
        const historyKeywords = ['history', 'recent', 'past', 'transactions', 'trades', 'activity', 'log'];
        const actionKeywords = ['show', 'get', 'display', 'view', 'list'];
        
        return historyKeywords.some(keyword => text.includes(keyword)) && 
               (actionKeywords.some(keyword => text.includes(keyword)) || text.includes('my'));
    },
    description: "Show transaction history and trading activity with performance analytics",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        _options?: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        try {
            const text = message.content?.text?.toLowerCase() || '';
            const platformUser = createPlatformUser(runtime, message);
            const walletService = new WalletService(runtime);
            const userWallets = await walletService.getUserWallets(platformUser);
            const walletCount = userWallets.length;

            if (walletCount === 0) {
                if (callback) {
                    callback({
                        text: `📊 **Transaction History**

❌ **No Wallets Connected**

To view your transaction history, you need to connect a wallet first.

**After connecting a wallet, you'll see:**
• Recent swaps and trades
• Liquidity provision/removal history  
• Transaction costs and gas usage
• P&L analysis and performance metrics
• Failed/pending transaction status

**Get Started:**
• "Create a new wallet"
• "Import wallet with private key"

*Your transaction history will be automatically tracked once connected.*`
                    });
                }
                return true;
            }

            // Parse time period from request
            let days = 30; // default
            if (text.includes('today') || text.includes('24h')) days = 1;
            else if (text.includes('week') || text.includes('7 days')) days = 7;
            else if (text.includes('month') || text.includes('30 days')) days = 30;
            else if (text.includes('all time') || text.includes('everything')) days = 365;

            // Determine transaction type filter
            let transactionType = 'all';
            if (text.includes('swap') || text.includes('trade')) transactionType = 'swaps';
            else if (text.includes('liquidity') || text.includes('lp')) transactionType = 'liquidity';
            else if (text.includes('failed') || text.includes('error')) transactionType = 'failed';

            // Mock transaction data (in production, this would query on-chain data)
            const mockTransactions = [
                {
                    hash: "0x1234...abcd",
                    type: "swap",
                    timestamp: Date.now() - 3600000, // 1 hour ago
                    fromToken: "USDC",
                    toToken: "HEX",
                    fromAmount: "1000",
                    toAmount: "147058.82",
                    gasUsed: "180000",
                    gasPrice: "12.5",
                    gasCost: "0.00225",
                    status: "confirmed",
                    slippage: "0.3%",
                    route: "9mm V2 → 9mm V3",
                    usdValue: 1000
                },
                {
                    hash: "0x5678...efgh",
                    type: "add_liquidity",
                    timestamp: Date.now() - 86400000, // 1 day ago
                    pool: "PLS/USDC 0.25%",
                    token0Amount: "5000",
                    token1Amount: "1200",
                    gasUsed: "280000",
                    gasPrice: "15.2",
                    gasCost: "0.004256",
                    status: "confirmed",
                    positionId: "#12345",
                    usdValue: 2400
                },
                {
                    hash: "0x9abc...ijkl",
                    type: "swap",
                    timestamp: Date.now() - 259200000, // 3 days ago
                    fromToken: "PLS",
                    toToken: "WPLS",
                    fromAmount: "10000",
                    toAmount: "9995.5",
                    gasUsed: "150000",
                    gasPrice: "8.7",
                    gasCost: "0.001305",
                    status: "confirmed",
                    slippage: "0.1%",
                    route: "Direct",
                    usdValue: 1800
                },
                {
                    hash: "0xdef0...mnop",
                    type: "remove_liquidity",
                    timestamp: Date.now() - 432000000, // 5 days ago
                    pool: "HEX/USDT 1%",
                    token0Amount: "25000",
                    token1Amount: "170",
                    gasUsed: "220000",
                    gasPrice: "11.3",
                    gasCost: "0.002486",
                    status: "confirmed",
                    positionId: "#67890",
                    usdValue: 340
                }
            ];

            // Filter transactions based on criteria
            let filteredTransactions = mockTransactions.filter(tx => {
                const daysSinceTransaction = (Date.now() - tx.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceTransaction > days) return false;
                
                if (transactionType === 'swaps') return tx.type === 'swap';
                if (transactionType === 'liquidity') return tx.type.includes('liquidity');
                if (transactionType === 'failed') return tx.status === 'failed';
                
                return true;
            });

            // Calculate summary statistics
            const totalTransactions = filteredTransactions.length;
            const totalVolume = filteredTransactions.reduce((sum, tx) => sum + tx.usdValue, 0);
            const totalGasCost = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.gasCost), 0);
            const swapCount = filteredTransactions.filter(tx => tx.type === 'swap').length;
            const lpCount = filteredTransactions.filter(tx => tx.type.includes('liquidity')).length;

            const periodName = days === 1 ? 'Today' : 
                              days === 7 ? 'Past Week' :
                              days === 30 ? 'Past Month' : 
                              'All Time';

            let responseText = '';

            if (filteredTransactions.length === 0) {
                responseText = `📊 **Transaction History - ${periodName}**

🚫 **No Transactions Found**

${transactionType === 'all' ? 
    `No transactions in the past ${days} days.` :
    `No ${transactionType} transactions in the past ${days} days.`}

**Try:**
• Expanding time period: "Show all time transaction history"
• Different transaction type: "Show my recent swaps"
• Check if wallet is connected properly

*Transaction tracking begins when you start using the DEX agent.*`;
            } else {
                responseText = `📊 **Transaction History - ${periodName}**

📈 **Summary**:
• Total Transactions: ${totalTransactions}
• Total Volume: $${totalVolume.toLocaleString()}
• Gas Costs: ${totalGasCost.toFixed(6)} PLS (~$${(totalGasCost * 0.18).toFixed(2)})
• Swaps: ${swapCount} | Liquidity Ops: ${lpCount}

🔄 **Recent Transactions**:
${filteredTransactions.slice(0, 5).map((tx, i) => {
    const timeAgo = Math.floor((Date.now() - tx.timestamp) / (1000 * 60 * 60));
    const timeStr = timeAgo < 1 ? 'Just now' : 
                   timeAgo < 24 ? `${timeAgo}h ago` :
                   `${Math.floor(timeAgo/24)}d ago`;
    
    if (tx.type === 'swap') {
        return `${i + 1}. **${tx.type.toUpperCase()}** (${timeStr})
   ${tx.fromAmount} ${tx.fromToken} → ${parseFloat(tx.toAmount).toLocaleString()} ${tx.toToken}
   Value: $${tx.usdValue.toLocaleString()} | Gas: ${tx.gasCost} PLS | Slippage: ${tx.slippage}
   Hash: \`${tx.hash}\``;
    } else {
        const action = tx.type === 'add_liquidity' ? 'Added to' : 'Removed from';
        return `${i + 1}. **${tx.type.replace('_', ' ').toUpperCase()}** (${timeStr})
   ${action} ${tx.pool} pool
   Position: ${tx.positionId} | Value: $${tx.usdValue.toLocaleString()}
   Hash: \`${tx.hash}\``;
    }
}).join('\n\n')}

💡 **Performance Insights**:
• Average transaction size: $${(totalVolume / totalTransactions).toLocaleString()}
• Gas efficiency: ${(totalGasCost / totalVolume * 100).toFixed(4)}% of volume
• Most active: ${swapCount > lpCount ? 'Token swapping' : 'Liquidity management'}

**More Details:**
• "Show swap history" - Filter by swaps only
• "Show liquidity transactions" - LP operations only
• "Show failed transactions" - Failed/reverted txs`;
            }

            if (callback) {
                callback({
                    text: responseText
                });
            }

            return true;

        } catch (error) {
            console.error('Transaction history action error:', error);
            if (callback) {
                callback({
                    text: `❌ Failed to load transaction history: ${error instanceof Error ? error.message : 'Unknown error'}`
                });
            }
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Show my recent trades" }
            },
            {
                user: "{{agent}}",
                content: {   
                    text: "I'll show you your recent trading activity with performance metrics and transaction details.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Transaction history this week" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "Let me pull up your transaction history for the past week with volume and gas cost analysis.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Show my swap history" }
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I'll filter your transaction history to show only swap transactions with performance data.",
                    action: "TRANSACTION_HISTORY"
                }
            }
        ]
    ] as ActionExample[][],
};

export default transactionHistoryAction; 