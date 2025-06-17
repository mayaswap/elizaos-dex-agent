import { ethers } from 'ethers';
import { CHAIN_CONFIGS, POPULAR_TOKENS } from '../config/chains.js';

/**
 * WPLS Wrapper Service
 * Handles direct interaction with WPLS contract for wrapping/unwrapping PLS
 */

// Standard WETH9/WPLS ABI - contains deposit(), withdraw(), balanceOf()
const WPLS_ABI = [
    // Standard WETH9 functions
    "function deposit() external payable",
    "function withdraw(uint256 amount) external",
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    
    // Events
    "event Deposit(address indexed dst, uint256 wad)",
    "event Withdrawal(address indexed src, uint256 wad)"
];

export interface WrapTransaction {
    hash: string;
    blockNumber?: number;
    gasUsed?: string;
    status: 'pending' | 'confirmed' | 'failed';
}

export interface WrapQuote {
    fromToken: string;
    toToken: string;
    amount: string;
    gasEstimate: string;
    isWrap: boolean; // true for PLS->WPLS, false for WPLS->PLS
}

export class WrapperService {
    private provider: ethers.providers.JsonRpcProvider;
    private wplsContract: any; // ethers.Contract with WPLS interface
    private wplsAddress: string;
    
    constructor(chainId: number = 369) {
        const chainConfig = Object.values(CHAIN_CONFIGS).find(c => c.chainId === chainId);
        if (!chainConfig) {
            throw new Error(`Chain ${chainId} not supported`);
        }
        
        this.provider = new ethers.providers.JsonRpcProvider(chainConfig.rpcUrl);
        this.wplsAddress = chainConfig.wrappedToken;
        this.wplsContract = new ethers.Contract(this.wplsAddress, WPLS_ABI, this.provider);
        
        console.log(`🔄 WrapperService initialized for ${chainConfig.name}`);
        console.log(`🔄 WPLS Contract: ${this.wplsAddress}`);
    }
    
    /**
     * Check if a swap is actually a wrap/unwrap operation
     */
    static isWrapOperation(fromToken: string, toToken: string): boolean {
        const pulsechainTokens = POPULAR_TOKENS.pulsechain;
        
        // PLS -> WPLS (wrap)
        const isWrap = (fromToken === 'PLS' && toToken === 'WPLS') ||
                      (fromToken.toLowerCase() === pulsechainTokens.PLS.toLowerCase() && 
                       toToken.toLowerCase() === pulsechainTokens.WPLS.toLowerCase());
        
        // WPLS -> PLS (unwrap)
        const isUnwrap = (fromToken === 'WPLS' && toToken === 'PLS') ||
                        (fromToken.toLowerCase() === pulsechainTokens.WPLS.toLowerCase() && 
                         toToken.toLowerCase() === pulsechainTokens.PLS.toLowerCase());
        
        return isWrap || isUnwrap;
    }
    
    /**
     * Get quote for wrapping/unwrapping
     */
    async getWrapQuote(fromToken: string, toToken: string, amount: string): Promise<WrapQuote> {
        if (!WrapperService.isWrapOperation(fromToken, toToken)) {
            throw new Error('Not a wrap/unwrap operation');
        }
        
        const isWrap = fromToken === 'PLS' || fromToken === 'pls';
        const amountWei = ethers.utils.parseEther(amount);
        
        // For wrapping/unwrapping, it's 1:1 ratio, so no price impact
        // Just estimate gas
        let gasEstimate: bigint;
        
        try {
            if (isWrap) {
                // Estimate gas for deposit()
                gasEstimate = await this.wplsContract.deposit.estimateGas({
                    value: amountWei
                });
            } else {
                // Estimate gas for withdraw()
                gasEstimate = await this.wplsContract.withdraw.estimateGas(amountWei);
            }
        } catch (error) {
            console.warn('Gas estimation failed, using default:', error);
            gasEstimate = BigInt(25000); // Default gas for wrap/unwrap
        }
        
        return {
            fromToken,
            toToken,
            amount,
            gasEstimate: gasEstimate.toString(),
            isWrap
        };
    }
    
    /**
     * Execute wrap operation (PLS -> WPLS)
     */
    async wrap(privateKey: string, amount: string): Promise<WrapTransaction> {
        try {
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const contractWithSigner = this.wplsContract.connect(wallet);
            
            const amountWei = ethers.utils.parseEther(amount);
            
            console.log(`🔄 Wrapping ${amount} PLS to WPLS...`);
            console.log(`🔄 Amount in wei: ${amountWei.toString()}`);
            
            // Call deposit() with PLS value
            const tx = await contractWithSigner.deposit({
                value: amountWei,
                gasLimit: 50000 // Safe gas limit for wrap
            });
            
            console.log(`✅ Wrap transaction sent: ${tx.hash}`);
            console.log(`🔗 Explorer: ${CHAIN_CONFIGS.pulsechain.explorerUrl}/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            return {
                hash: tx.hash,
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed?.toString(),
                status: receipt?.status === 1 ? 'confirmed' : 'failed'
            };
            
        } catch (error) {
            console.error('Wrap operation failed:', error);
            throw new Error(`Wrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Execute unwrap operation (WPLS -> PLS)
     */
    async unwrap(privateKey: string, amount: string): Promise<WrapTransaction> {
        try {
            const wallet = new ethers.Wallet(privateKey, this.provider);
            const contractWithSigner = this.wplsContract.connect(wallet);
            
            const amountWei = ethers.utils.parseEther(amount);
            
            console.log(`🔄 Unwrapping ${amount} WPLS to PLS...`);
            console.log(`🔄 Amount in wei: ${amountWei.toString()}`);
            
            // First check WPLS balance
            const balance = await contractWithSigner.balanceOf(wallet.address);
            if (balance < amountWei) {
                throw new Error(`Insufficient WPLS balance. Have: ${ethers.utils.formatEther(balance)}, Need: ${amount}`);
            }
            
            // Call withdraw()
            const tx = await contractWithSigner.withdraw(amountWei, {
                gasLimit: 50000 // Safe gas limit for unwrap
            });
            
            console.log(`✅ Unwrap transaction sent: ${tx.hash}`);
            console.log(`🔗 Explorer: ${CHAIN_CONFIGS.pulsechain.explorerUrl}/tx/${tx.hash}`);
            
            // Wait for confirmation
            const receipt = await tx.wait();
            
            return {
                hash: tx.hash,
                blockNumber: receipt?.blockNumber,
                gasUsed: receipt?.gasUsed?.toString(),
                status: receipt?.status === 1 ? 'confirmed' : 'failed'
            };
            
        } catch (error) {
            console.error('Unwrap operation failed:', error);
            throw new Error(`Unwrap failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Get WPLS balance for an address
     */
    async getWPLSBalance(address: string): Promise<string> {
        try {
            const balance = await this.wplsContract.balanceOf(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Failed to get WPLS balance:', error);
            return '0';
        }
    }
    
    /**
     * Get native PLS balance for an address
     */
    async getPLSBalance(address: string): Promise<string> {
        try {
            const balance = await this.provider.getBalance(address);
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error('Failed to get PLS balance:', error);
            return '0';
        }
    }
}