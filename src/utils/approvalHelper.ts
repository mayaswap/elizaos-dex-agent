import { ethers } from 'ethers';
import { NINMM_CONTRACTS } from '../config/chains.js';

/**
 * ERC-20 Approval Helper
 * Handles token approval checking and management for DEX interactions
 */

// Standard ERC-20 ABI for allowance and approve functions
const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
];

// Special native token addresses that don't need approval
const NATIVE_TOKENS = [
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // ETH/PLS placeholder
    '0x0000000000000000000000000000000000000000'   // Zero address
];

export interface ApprovalStatus {
    needsApproval: boolean;
    currentAllowance: string;
    requiredAmount: string;
    spenderAddress: string;
    tokenAddress: string;
    isNativeToken: boolean;
}

export interface ApprovalResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

export class ApprovalHelper {
    private provider: ethers.providers.JsonRpcProvider;
    private chainId: number;

    constructor(chainId: number = 369) {
        this.chainId = chainId;
        this.provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com');
    }

    /**
     * Check if token needs approval for spending by router
     */
    async checkApprovalStatus(
        tokenAddress: string,
        userAddress: string,
        amount: string,
        spenderAddress?: string
    ): Promise<ApprovalStatus> {
        // Use 9X aggregator router as default spender
        const spender = spenderAddress || NINMM_CONTRACTS.pulsechain.aggregatorRouter;
        
        // Check if it's a native token (PLS)
        const isNativeToken = NATIVE_TOKENS.includes(tokenAddress.toLowerCase()) || 
                             tokenAddress.toLowerCase() === 'pls';

        if (isNativeToken) {
            return {
                needsApproval: false,
                currentAllowance: 'N/A',
                requiredAmount: amount,
                spenderAddress: spender,
                tokenAddress: tokenAddress,
                isNativeToken: true
            };
        }

        try {
            // Create contract instance
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
            
            // Get current allowance
            const currentAllowance = await tokenContract.allowance(userAddress, spender);
            const allowanceString = currentAllowance.toString();
            
            // Check if current allowance is sufficient
            const requiredAmount = BigInt(amount);
            const needsApproval = currentAllowance < requiredAmount;

            console.log('🔍 Approval Check:', {
                tokenAddress,
                userAddress,
                spender,
                currentAllowance: allowanceString,
                requiredAmount: amount,
                needsApproval
            });

            return {
                needsApproval,
                currentAllowance: allowanceString,
                requiredAmount: amount,
                spenderAddress: spender,
                tokenAddress: tokenAddress,
                isNativeToken: false
            };

        } catch (error) {
            console.error('Approval check failed:', error);
            // If we can't check allowance, assume approval is needed for safety
            return {
                needsApproval: true,
                currentAllowance: '0',
                requiredAmount: amount,
                spenderAddress: spender,
                tokenAddress: tokenAddress,
                isNativeToken: false
            };
        }
    }

    /**
     * Execute approval transaction
     */
    async executeApproval(
        tokenAddress: string,
        privateKey: string,
        amount: string,
        spenderAddress?: string
    ): Promise<ApprovalResult> {
        const spender = spenderAddress || NINMM_CONTRACTS.pulsechain.aggregatorRouter;

        try {
            // Create wallet instance
            const wallet = new ethers.Wallet(privateKey, this.provider);
            
            // Create token contract instance
            const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
            
            // Execute approval
            console.log(`🔓 Executing approval for ${amount} tokens to ${spender}...`);
            
            const tx = await tokenContract.approve(spender, amount);
            
            console.log(`⏳ Approval transaction sent: ${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            if (receipt.status === 1) {
                console.log(`✅ Approval confirmed in block ${receipt.blockNumber}`);
                return {
                    success: true,
                    transactionHash: tx.hash
                };
            } else {
                return {
                    success: false,
                    error: 'Approval transaction failed'
                };
            }

        } catch (error) {
            console.error('Approval execution failed:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown approval error'
            };
        }
    }

    /**
     * Get recommended approval amount (unlimited vs exact)
     */
    static getRecommendedApprovalAmount(requiredAmount: string, strategy: 'exact' | 'unlimited' = 'unlimited'): string {
        if (strategy === 'unlimited') {
            // Use max uint256 for unlimited approval
            return '115792089237316195423570985008687907853269984665640564039457584007913129639935';
        } else {
            // Use exact amount + small buffer (10% extra)
            const required = BigInt(requiredAmount);
            const buffer = required / BigInt(10); // 10% buffer
            return (required + buffer).toString();
        }
    }

    /**
     * Check if approval is needed for a token swap
     */
    static isApprovalNeeded(fromTokenAddress: string): boolean {
        return !NATIVE_TOKENS.includes(fromTokenAddress.toLowerCase()) && 
               fromTokenAddress.toLowerCase() !== 'pls';
    }

    /**
     * Format approval amount for display
     */
    static formatApprovalAmount(amount: string, decimals: number = 18): string {
        try {
            const maxUint256 = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
            
            if (amount === maxUint256) {
                return 'Unlimited';
            }
            
            const amountBigInt = BigInt(amount);
            const divisor = BigInt(10) ** BigInt(decimals);
            const formatted = Number(amountBigInt) / Number(divisor);
            
            if (formatted > 1000000) {
                return `${(formatted / 1000000).toFixed(2)}M`;
            } else if (formatted > 1000) {
                return `${(formatted / 1000).toFixed(2)}K`;
            } else {
                return formatted.toFixed(2);
            }
        } catch (error) {
            return 'Unknown';
        }
    }
}