import type { SwapQuote, SwapRequest } from '../types/index.js';
import { CHAIN_CONFIGS } from '../config/chains.js';

/**
 * 9mm Aggregator API Client
 * Handles interaction with the 9mm DEX aggregator (0x API v1 fork)
 */
export class NineMMAggregator {
  private baseUrl: string;
  private priceApiBaseUrl: string;

  constructor(chainId: number) {
    const chainConfig = Object.values(CHAIN_CONFIGS).find(c => c.chainId === chainId);
    if (!chainConfig?.aggregatorBaseUrl) {
      throw new Error(`Aggregator not available for chain ${chainId}`);
    }
    
    this.baseUrl = chainConfig.aggregatorBaseUrl;
    this.priceApiBaseUrl = 'https://price-api.9mm.pro'; // Dedicated price API
  }

  /**
   * Get swap quote from 9mm aggregator
   */
  async getSwapQuote(request: SwapRequest): Promise<SwapQuote> {
    try {
      const params = new URLSearchParams({
        sellToken: request.fromToken,
        buyToken: request.toToken,
        sellAmount: request.amount,
        slippagePercentage: request.slippagePercentage.toString(),
        takerAddress: request.userAddress,
      });

      const url = `${this.baseUrl}/swap/v1/quote?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Aggregator API error: ${response.status}`);
      }

      const quoteData = await response.json();
      
      return this.transformQuoteResponse(quoteData);
      
    } catch (error) {
      throw new Error(
        `Failed to get swap quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get individual token price in USD from dedicated price API
   */
  async getTokenPrice(tokenAddress: string): Promise<{
    price: string;
    priceUSD: number;
  }> {
    try {
      // Normalize address to lowercase for consistent comparison
      const normalizedAddress = tokenAddress.toLowerCase();
      
      const url = `${this.priceApiBaseUrl}/api/price/pulsechain/?address=${normalizedAddress}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const priceData = await response.json();
      
      return {
        price: priceData.price,
        priceUSD: parseFloat(priceData.price),
      };
      
    } catch (error) {
      throw new Error(
        `Failed to get token price: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get price information only (no transaction data)
   */
  async getPrice(fromToken: string, toToken: string, amount: string): Promise<{
    price: string;
    buyAmount: string;
    estimatedPriceImpact?: string;
  }> {
    try {
      const params = new URLSearchParams({
        sellToken: fromToken,
        buyToken: toToken,
        sellAmount: amount,
      });

      const url = `${this.baseUrl}/swap/v1/price?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Price API error: ${response.status}`);
      }

      const priceData = await response.json();
      
      return {
        price: priceData.price,
        buyAmount: priceData.buyAmount,
        estimatedPriceImpact: priceData.estimatedPriceImpact,
      };
      
    } catch (error) {
      throw new Error(
        `Failed to get price: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get available liquidity sources
   */
  async getSources(): Promise<Array<{ name: string; proportion: string }>> {
    try {
      const url = `${this.baseUrl}/swap/v1/sources`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Sources API error: ${response.status}`);
      }

      const sourcesData = await response.json();
      
      // Handle the actual API response format: {"records": [...]}
      const records = sourcesData.records || [];
      return records.map((name: string) => ({
        name,
        proportion: '1.0', // Equal weight since we don't have specific proportions
      }));
      
    } catch (error) {
      throw new Error(
        `Failed to get sources: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Transform 9mm API response to our SwapQuote schema
   */
  private transformQuoteResponse(data: any): SwapQuote {
    // Handle BigInt values from API by converting to string
    const safeStringify = (value: any): string => {
      if (typeof value === 'bigint') {
        return value.toString();
      }
      if (typeof value === 'number') {
        return value.toString();
      }
      return value || '0';
    };

    // Handle sources array - API might return different formats
    let sources = [];
    if (Array.isArray(data.sources)) {
      sources = data.sources.map((source: any) => {
        if (typeof source === 'string') {
          return { name: source, proportion: '1' };
        }
        return {
          name: source.name || 'Unknown',
          proportion: source.proportion || '1'
        };
      });
    }

    return {
      sellToken: data.sellToken || '',
      buyToken: data.buyToken || '',
      sellAmount: safeStringify(data.sellAmount),
      buyAmount: safeStringify(data.buyAmount),
      price: safeStringify(data.price),
      guaranteedPrice: safeStringify(data.guaranteedPrice || data.price),
      gas: safeStringify(data.gas),
      gasPrice: safeStringify(data.gasPrice),
      protocolFee: safeStringify(data.protocolFee),
      minimumProtocolFee: safeStringify(data.minimumProtocolFee),
      buyTokenAddress: data.buyTokenAddress || data.buyToken || '',
      sellTokenAddress: data.sellTokenAddress || data.sellToken || '',
      value: safeStringify(data.value),
      to: data.to || '',
      data: data.data || '',
      estimatedPriceImpact: data.estimatedPriceImpact,
      sources: sources,
    };
  }

  /**
   * Format amount to wei based on token decimals
   */
  static formatAmount(amount: string, decimals: number): string {
    try {
      const amountFloat = parseFloat(amount);
      if (isNaN(amountFloat)) {
        throw new Error('Invalid amount');
      }
      
      // Convert to wei by multiplying by 10^decimals
      const wei = Math.floor(amountFloat * Math.pow(10, decimals));
      return wei.toString();
    } catch (error) {
      throw new Error(`Failed to format amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse amount from wei to human readable format based on token decimals
   */
  static parseAmount(amount: string | number | bigint, decimals: number): string {
    try {
      let amountString: string;
      
      if (typeof amount === 'bigint') {
        amountString = amount.toString();
      } else if (typeof amount === 'number') {
        amountString = amount.toString();
      } else {
        amountString = amount;
      }
      
      const amountBigInt = BigInt(amountString);
      const divisor = BigInt(Math.pow(10, decimals));
      
      // Convert from wei by dividing by 10^decimals
      const wholePart = amountBigInt / divisor;
      const fractionalPart = amountBigInt % divisor;
      
      if (fractionalPart === BigInt(0)) {
        return wholePart.toString();
      }
      
      // Format with appropriate decimal places
      const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
      const trimmedFractional = fractionalStr.replace(/0+$/, '');
      
      if (trimmedFractional === '') {
        return wholePart.toString();
      }
      
      return `${wholePart}.${trimmedFractional}`;
    } catch (error) {
      throw new Error(`Failed to parse amount: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate price impact percentage
   */
  static calculatePriceImpact(inputAmount: string, outputAmount: string, marketPrice: string): string {
    try {
      const input = parseFloat(inputAmount);
      const output = parseFloat(outputAmount);
      const price = parseFloat(marketPrice);
      
      const expectedOutput = input * price;
      const impact = ((expectedOutput - output) / expectedOutput) * 100;
      
      return Math.abs(impact).toFixed(2);
    } catch (error) {
      return '0.00';
    }
  }

  /**
   * Validate slippage percentage
   */
  static validateSlippage(slippage: number): boolean {
    return slippage >= 0.1 && slippage <= 50; // 0.1% to 50%
  }

  /**
   * Calculate minimum received amount considering slippage
   */
  static getMinimumReceived(buyAmount: string, slippagePercentage: number): string {
    try {
      const amount = parseFloat(buyAmount);
      const slippage = slippagePercentage / 100;
      const minimum = amount * (1 - slippage);
      return minimum.toString();
    } catch (error) {
      return '0';
    }
  }
} 