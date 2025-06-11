interface DexScreenerToken {
    url: string;
    chainId: string;
    tokenAddress: string;
    icon?: string;
    header?: string;
    openGraph?: string;
    description?: string;
    links?: Array<{
        label?: string;
        type?: string;
        url: string;
    }>;
}

interface TokenPairData {
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
        address: string;
        name: string;
        symbol: string;
    };
    quoteToken: {
        address: string;
        name: string;
        symbol: string;
    };
    priceNative: string;
    priceUsd?: string;
    txns: {
        m5: { buys: number; sells: number };
        h1: { buys: number; sells: number };
        h6: { buys: number; sells: number };
        h24: { buys: number; sells: number };
    };
    volume: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    priceChange: {
        m5: number;
        h1: number;
        h6: number;
        h24: number;
    };
    liquidity?: {
        usd?: number;
        base: number;
        quote: number;
    };
    fdv?: number;
    marketCap?: number;
}

class DexScreenerService {
    private baseUrl = 'https://api.dexscreener.com';
    private requestCount = 0;
    private requestWindow = Date.now();
    private readonly rateLimit = 60; // 60 requests per minute
    private readonly windowDuration = 60000; // 1 minute in milliseconds

    private async checkRateLimit(): Promise<void> {
        const now = Date.now();
        
        // Reset counter if window has passed
        if (now - this.requestWindow >= this.windowDuration) {
            this.requestCount = 0;
            this.requestWindow = now;
        }
        
        // Check if we've hit the rate limit
        if (this.requestCount >= this.rateLimit) {
            const waitTime = this.windowDuration - (now - this.requestWindow);
            throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`);
        }
        
        this.requestCount++;
    }

    async getLatestTokenProfiles(): Promise<DexScreenerToken[]> {
        await this.checkRateLimit();
        
        const response = await fetch(`${this.baseUrl}/token-profiles/latest/v1`);
        
        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
        }
        
        return response.json();
    }

    async getTokenPairs(tokenAddress: string): Promise<TokenPairData[]> {
        await this.checkRateLimit();
        
        const response = await fetch(`${this.baseUrl}/tokens/${tokenAddress}`);
        
        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.pairs || [];
    }

    async searchPairs(query: string): Promise<TokenPairData[]> {
        await this.checkRateLimit();
        
        const response = await fetch(`${this.baseUrl}/search/?q=${encodeURIComponent(query)}`);
        
        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.pairs || [];
    }

    async getPairsByChain(chainId: string): Promise<TokenPairData[]> {
        await this.checkRateLimit();
        
        const response = await fetch(`${this.baseUrl}/pairs/${chainId}`);
        
        if (!response.ok) {
            throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.pairs || [];
    }

    async getTokenPrice(tokenAddress: string, chainId: string = 'pulsechain'): Promise<{
        priceUSD: number;
        priceChange24h: number;
        volume24h: number;
        liquidity?: number;
        marketCap?: number;
        fdv?: number;
    }> {
        const pairs = await this.getTokenPairs(tokenAddress);
        
        // Filter for the specified chain and find the pair with highest liquidity
        const chainPairs = pairs.filter(pair => 
            pair.chainId.toLowerCase() === chainId.toLowerCase()
        );
        
        if (chainPairs.length === 0) {
            throw new Error(`No trading pairs found for token ${tokenAddress} on ${chainId}`);
        }
        
        // Sort by liquidity and take the most liquid pair
        const bestPair = chainPairs.sort((a, b) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
        )[0];
        
        if (!bestPair) {
            throw new Error(`No valid trading pair found for token ${tokenAddress} on ${chainId}`);
        }
        
        return {
            priceUSD: parseFloat(bestPair.priceUsd || '0'),
            priceChange24h: bestPair.priceChange.h24,
            volume24h: bestPair.volume.h24,
            liquidity: bestPair.liquidity?.usd,
            marketCap: bestPair.marketCap,
            fdv: bestPair.fdv
        };
    }

    getRateLimitStatus(): {
        requestCount: number;
        remainingRequests: number;
        resetTime: number;
    } {
        const now = Date.now();
        const timeRemaining = this.windowDuration - (now - this.requestWindow);
        
        return {
            requestCount: this.requestCount,
            remainingRequests: Math.max(0, this.rateLimit - this.requestCount),
            resetTime: timeRemaining > 0 ? timeRemaining : 0
        };
    }
}

export default DexScreenerService;
export type { DexScreenerToken, TokenPairData }; 