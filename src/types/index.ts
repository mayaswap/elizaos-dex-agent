export type SupportedChain = "pulsechain" | "base" | "sonic";

export interface ChainConfig {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  wrappedToken: string;
  aggregatorBaseUrl: string;
}

export interface SwapRequest {
  fromToken: string;
  toToken: string;
  amount: string;
  slippagePercentage: number;
  userAddress: string;
  chainId: number;
}

export interface SwapQuote {
  sellToken: string;
  buyToken: string;
  sellAmount: string;
  buyAmount: string;
  price: string;
  guaranteedPrice: string;
  gas: string;
  gasPrice: string;
  protocolFee: string;
  minimumProtocolFee: string;
  buyTokenAddress: string;
  sellTokenAddress: string;
  value: string;
  to: string;
  data: string;
  estimatedPriceImpact?: string;
  sources: Array<{ name: string; proportion: string }>;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
}

export class DEXError extends Error {
  constructor(
    message: string,
    public code?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'DEXError';
  }
}

export interface PriceQuote {
  price: string;
  buyAmount: string;
  estimatedPriceImpact?: string;
}

export interface SwapParams {
  fromToken: string;
  toToken: string;
  amount: string;
  slippage?: number;
}

export interface NaturalLanguageSwapParams {
  fromToken?: string;
  toToken?: string;
  amount?: string;
  slippage?: number;
  intent: 'swap' | 'price' | 'balance' | 'unknown';
} 