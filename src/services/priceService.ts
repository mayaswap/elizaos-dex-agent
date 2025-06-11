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
    private dexScreenerUrl = 'https://api.dexscreener.com/token-profiles/latest/v1';
    
    async getTokenPrice(tokenSymbol: string): Promise<PriceResponse> {
        try {
            // For demo purposes, return mock data structure
            // In production, this would fetch from DexScreener API
            return {
                success: true,
                data: {
                    price: '0.0001',
                    change24h: 2.5,
                    liquidity: 50000,
                    volume24h: 15000,
                    lastUpdated: new Date().toISOString()
                }
            };
        } catch (error) {
            return {
                success: false,
                error: 'Failed to fetch price data'
            };
        }
    }
} 