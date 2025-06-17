import { ethers } from 'ethers';
import type { 
    Action,
    IAgentRuntime, 
    Memory, 
    State,
    HandlerCallback,
    Content
} from '@elizaos/core';
import { parseCommand } from '../utils/smartParser.js';
import { POPULAR_TOKENS, CHAIN_CONFIGS } from '../config/chains.js';
import { WalletService, createPlatformUser } from '../services/walletService.js';
import { IExtendedRuntime } from '../types/extended.js';

const balanceAction: Action = {
    name: "CHECK_BALANCE",
    similes: [
        "WALLET_BALANCE",
        "TOKEN_BALANCE", 
        "MY_BALANCE",
        "CHECK_HOLDINGS",
        "SHOW_BALANCE"
    ],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            if (!message.content?.text) return false;
            
            const parsed = await parseCommand(message.content.text);
            return parsed.intent === 'balance';
        } catch (error) {
            console.error('Balance validation error:', error);
            return false;
        }
    },
    description: "Check token balances for wallets using the new WalletService",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State | undefined,
        options: any,
        callback?: HandlerCallback
    ) => {
        try {
            let responseText = "";
            
            // Get user message and parse it
            const userMessage = message.content?.text?.toLowerCase() || '';
            
            if (!userMessage) {
                responseText = "❌ I need a message to check balance. Try: 'Check my balance' or 'What's my PLS balance?'";
                if (callback) {
                    callback({
                        text: responseText,
                        content: { text: responseText }
                    } as Content);
                }
                return true;
            }
            
            // Parse the balance request
            const parsed = await parseCommand(userMessage);
            
            // Get user's platform info
            const platformUser = createPlatformUser(runtime as IExtendedRuntime, message);
            
            // Get wallet service
            const walletService = new WalletService(runtime as IExtendedRuntime);
            const userWallets = await walletService.getUserWallets(platformUser);
            
            if (userWallets.length === 0) {
                responseText = `💰 **Balance Check**

I need a wallet to check balances.

**Options:**
• "Create a wallet for me" (I'll remember it for future balance checks)
• "Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f" 
• Import your existing wallet first

**Note:** Once you create or import a wallet, I'll remember it for easy balance checking!`;
                
                if (callback) {
                    callback({
                        text: responseText,
                        content: { text: responseText }
                    } as Content);
                }
                return true;
            }
            
            // Get user's active wallet address
            let walletAddress: string | null = null;
            
            try {
                const activeWallet = await walletService.getActiveWallet(platformUser);
                if (activeWallet?.address) {
                    walletAddress = activeWallet.address;
                    console.log(`🔍 Found active wallet: ${walletAddress} for ${platformUser.platform}:${platformUser.platformUserId}`);
                }
            } catch (error) {
                console.log('Could not retrieve wallet from WalletService:', error);
            }
            
            // Check if user provided a specific address in their message
            const addressMatch = userMessage.match(/0x[a-fA-F0-9]{40}/);
            if (addressMatch) {
                walletAddress = addressMatch[0];
                console.log(`🎯 Using address from message: ${walletAddress}`);
            }
            
            if (!walletAddress) {
                responseText = `💰 **Balance Check**

I need a wallet to check balances.

**Options:**
• "Create a wallet for me" (I'll remember it for future balance checks)
• "Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f" 
• Import your existing wallet first

**Note:** Once you create or import a wallet, I'll remember it for easy balance checking!`;
                
                if (callback) {
                    callback({
                        text: responseText,
                        content: { text: responseText }
                    } as Content);
                }
                return true;
            }
            
            // Initialize provider for PulseChain (main network for this demo)
            const provider = new ethers.providers.JsonRpcProvider(CHAIN_CONFIGS.pulsechain.rpcUrl);
            
            try {
                console.log(`🌐 Checking balance for wallet: ${walletAddress}`);
                
                // Get native token balance (PLS)
                const nativeBalance = await provider.getBalance(walletAddress);
                const plsBalance = ethers.utils.formatEther(nativeBalance);
                
                console.log(`💰 PLS Balance: ${plsBalance}`);
                
                responseText = `💰 **Wallet Balance Report**

📋 **Wallet Address:**
${walletAddress}

**Network:** PulseChain

**Native Balance:**
• **PLS:** ${parseFloat(plsBalance).toFixed(4)} PLS

**ERC-20 Tokens:**`;

                // Check popular token balances
                const tokenAddresses = POPULAR_TOKENS.pulsechain;
                const tokenChecks = ['WPLS', 'USDC', 'USDT', 'DAI', 'HEX', 'PLSX'];
                
                for (const tokenSymbol of tokenChecks) {
                    const tokenAddress = tokenAddresses[tokenSymbol as keyof typeof tokenAddresses];
                    if (tokenAddress && tokenAddress !== 'NATIVE' && tokenAddress !== 'EeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
                        try {
                            // Standard ERC-20 ABI for balanceOf
                            const erc20Abi = ['function balanceOf(address owner) view returns (uint256)'];
                            const contract = new ethers.Contract(tokenAddress, erc20Abi, provider);
                            const balance = await contract.balanceOf!(walletAddress);
                            
                            let formattedBalance = '0';
                            if (balance > 0n) {
                                // Use different decimals for different tokens
                                const decimals = tokenSymbol === 'USDC' || tokenSymbol === 'USDT' ? 6 : 
                                                tokenSymbol === 'HEX' ? 8 : 18;
                                formattedBalance = ethers.utils.formatUnits(balance, decimals);
                            }
                            
                            responseText += `\n• **${tokenSymbol}:** ${parseFloat(formattedBalance).toFixed(4)} ${tokenSymbol}`;
                            console.log(`🪙 ${tokenSymbol}: ${formattedBalance}`);
                        } catch (tokenError) {
                            console.log(`Could not fetch ${tokenSymbol} balance:`, tokenError);
                            responseText += `\n• **${tokenSymbol}:** Unable to fetch`;
                        }
                    }
                }
                
                responseText += `\n\n*✅ Balance check completed for PulseChain network*
*💡 To check other networks, specify: "Check my Base balance" or "Check my Sonic balance"*`;
                
            } catch (error) {
                console.error('Balance check error:', error);
                responseText = `❌ **Balance Check Failed**

📋 Could not retrieve balance for wallet:
${walletAddress}

**Possible reasons:**
• Network connection issues
• Invalid wallet address
• RPC provider temporarily unavailable

**Try again or:**
• "Create a new wallet" if you need a fresh wallet
• "Check balance of [different-address]" with a known funded address`;
            }

            if (callback) {
                callback({
                    text: responseText,
                    content: { text: responseText }
                } as Content);
            }

            return true;

        } catch (error) {
            console.error('Balance action error:', error);
            const errorText = `❌ **Balance Error**
            
Sorry, I encountered an error while checking your balance. Please try again or:

• "Create a wallet for me" to get started
• "Check balance of 0x..." with a specific address`;

            if (callback) {
                callback({
                    text: errorText,
                    content: { text: errorText }
                } as Content);
            }
            
            return false;
        }
    },
    examples: [
        [
            {
                name: "{{user1}}",
                content: {
                    text: "What's my balance?"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "I'll check your wallet balance across all major tokens on PulseChain!"
                }
            }
        ],
        [
            {
                name: "{{user1}}",
                content: {
                    text: "Check balance of 0x742d35Cc6635C0532925a3b8D357376C326910b2f"
                }
            },
            {
                name: "{{user2}}",
                content: {
                    text: "Checking balance for the specified wallet address..."
                }
            }
        ]
    ]
};

export default balanceAction; 