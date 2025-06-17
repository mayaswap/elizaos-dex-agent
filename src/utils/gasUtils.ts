/**
 * Gas Utilities for Enhanced Gas Limit Calculations
 * 
 * This module provides consistent gas limit calculation logic across the ElizaOS DEX Agent
 * to prevent transaction failures due to insufficient gas limits from 9X API estimates.
 */

export interface GasCalculationResult {
    apiEstimate: number;
    safetyBuffer: number;
    bufferedEstimate: number;
    minimumRequired: number;
    finalGasLimit: number;
    increasePercentage: string;
}

export interface TransactionType {
    fromToken: string;
    toToken: string;
}

/**
 * Calculate enhanced gas limit with safety buffer and minimum requirements
 * 
 * @param apiGasEstimate - Gas estimate from 9X API
 * @param transaction - Transaction details for complexity analysis
 * @returns Enhanced gas calculation result
 */
export function calculateEnhancedGasLimit(
    apiGasEstimate: number | string,
    transaction: TransactionType
): GasCalculationResult {
    // Parse API estimate
    const baseGasEstimate = typeof apiGasEstimate === 'string' 
        ? parseInt(apiGasEstimate) 
        : apiGasEstimate;
    
    // Apply 30% safety buffer for complex DEX swaps
    const safetyBuffer = Math.floor(baseGasEstimate * 0.3);
    const bufferedEstimate = baseGasEstimate + safetyBuffer;
    
    // Set minimum gas limits based on transaction complexity
    const minimumGasLimits = {
        simpleSwap: 300000,     // Simple token-to-token swap
        complexSwap: 500000,    // Multi-hop or complex routing  
        nativeSwap: 400000,     // Involving native PLS
        fallback: 600000        // Conservative fallback
    };
    
    // Determine transaction complexity
    let minimumRequired = minimumGasLimits.fallback;
    if (transaction.fromToken === 'PLS' || transaction.toToken === 'PLS') {
        minimumRequired = minimumGasLimits.nativeSwap;
    } else if (bufferedEstimate > 400000) {
        minimumRequired = minimumGasLimits.complexSwap;
    } else {
        minimumRequired = minimumGasLimits.simpleSwap;
    }
    
    // Use the higher of: buffered estimate OR minimum requirement
    const finalGasLimit = Math.max(bufferedEstimate, minimumRequired);
    
    // Calculate increase percentage
    const increasePercentage = ((finalGasLimit - baseGasEstimate) / baseGasEstimate * 100).toFixed(1);
    
    return {
        apiEstimate: baseGasEstimate,
        safetyBuffer,
        bufferedEstimate,
        minimumRequired,
        finalGasLimit,
        increasePercentage: increasePercentage + '%'
    };
}

/**
 * Format gas estimate for display (in K format)
 * 
 * @param gasAmount - Gas amount in units
 * @returns Formatted string like "~300K"
 */
export function formatGasEstimate(gasAmount: number): string {
    return `~${Math.round(gasAmount / 1000)}K`;
}

/**
 * Get gas calculation summary for logging
 * 
 * @param result - Gas calculation result
 * @returns Formatted logging object
 */
export function getGasCalculationSummary(result: GasCalculationResult) {
    return {
        apiEstimate: result.apiEstimate,
        safetyBuffer: result.safetyBuffer,
        bufferedEstimate: result.bufferedEstimate,
        minimumRequired: result.minimumRequired,
        finalGasLimit: result.finalGasLimit,
        increaseFromAPI: result.increasePercentage
    };
}

/**
 * Default gas limits for different operation types
 */
export const DEFAULT_GAS_LIMITS = {
    // Swap operations
    SIMPLE_SWAP: 300000,
    COMPLEX_SWAP: 500000,
    NATIVE_SWAP: 400000,
    FALLBACK_SWAP: 600000,
    
    // Wrap/Unwrap operations
    WRAP_PLS: 100000,
    UNWRAP_WPLS: 80000,
    
    // Token operations
    TOKEN_TRANSFER: 21000,
    TOKEN_APPROVAL: 60000,
    
    // Liquidity operations
    ADD_LIQUIDITY: 350000,
    REMOVE_LIQUIDITY: 300000
} as const; 