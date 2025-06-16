import { NineMMAggregator } from '../utils/aggregator.js';
import { POPULAR_TOKENS } from '../config/chains.js';
import { logError } from './logger.js';

interface PriceData {
    price: string;
    change24h: number;
    liquidity: number;
    volume24h: number;
    lastUpdated: string;
}

interface PriceResponse {
    success: boolean;
    data?: PriceData;
    error?: string;
}

export class PriceService {
    private aggregator: NineMMAggregator;
    
    constructor() {
        this.aggregator = new NineMMAggregator(369); // PulseChain
    }
    
    async getTokenPrice(tokenSymbol: string): Promise<PriceResponse> {
        try {
            // Get token address from config
            const pulsechainTokens = POPULAR_TOKENS.pulsechain;
            let tokenAddress = pulsechainTokens[tokenSymbol as keyof typeof pulsechainTokens];
            
            if (!tokenAddress) {
                return {
                    success: false,
                    error: `Token ${tokenSymbol} not found`
                };
            }
            
            // For native PLS, use WPLS for price queries
            if (tokenSymbol === 'PLS' && tokenAddress === '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE') {
                tokenAddress = pulsechainTokens.WPLS;
            }
            
            // Fetch real price from 9mm API
            const priceData = await this.aggregator.getTokenPrice(tokenAddress);
            const priceUSD = priceData.priceUSD;
            
            // Format price based on value
            let formattedPrice: string;
            if (priceUSD === 0) {
                formattedPrice = '0';
            } else if (priceUSD < 0.00000001) {
                formattedPrice = priceUSD.toExponential(4);
            } else if (priceUSD < 0.00001) {
                formattedPrice = priceUSD.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
            } else if (priceUSD < 0.0001) {
                formattedPrice = priceUSD.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
            } else if (priceUSD < 0.01) {
                formattedPrice = priceUSD.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
            } else if (priceUSD < 1) {
                formattedPrice = priceUSD.toFixed(4);
            } else if (priceUSD < 100) {
                formattedPrice = priceUSD.toFixed(4);
            } else {
                formattedPrice = priceUSD.toFixed(2);
            }
            
            // For now, we'll return estimated values for change, liquidity, and volume
            // In production, these would come from DexScreener or additional API calls
            return {
                success: true,
                data: {
                    price: formattedPrice,
                    change24h: 0, // Would need historical data
                    liquidity: 0, // Would need pool data
                    volume24h: 0, // Would need 24h volume data
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            logError(error as Error, { context: 'Price fetch error' });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch price data'
            };
        }
    }
} 