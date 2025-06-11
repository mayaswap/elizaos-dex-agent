import { gql } from 'graphql-request';
import { GraphQLClient } from 'graphql-request';

// 9mm V3 Subgraph URL
const SUBGRAPH_URL = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';

// Types
export interface V3Token {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
}

export interface V3PoolDayData {
  date: string;
  volumeUSD: string;
  feesUSD: string;
  tvlUSD: string;
}

export interface V3Pool {
  id: string;
  token0: V3Token;
  token1: V3Token;
  feeTier: string;
  liquidity: string;
  totalValueLockedUSD: string;
  volumeUSD: string;
  feesUSD: string;
  txCount: string;
  token0Price: string;
  token1Price: string;
  poolDayData?: V3PoolDayData[];
}

export interface PoolSelectionCriteria {
  minimumTVL?: number;
  preferredFeeTier?: string;
  sortBy: 'volumeUSD' | 'totalValueLockedUSD' | 'feesUSD';
  sortDirection: 'desc' | 'asc';
}

export class NineMmPoolDiscoveryService {
  private client: GraphQLClient;

  constructor() {
    this.client = new GraphQLClient(SUBGRAPH_URL);
  }

  /**
   * Find all pools for a specific token pair
   */
  async findPools(token0Address: string, token1Address: string): Promise<V3Pool[]> {
    // Normalize addresses to lowercase
    const token0 = token0Address.toLowerCase();
    const token1 = token1Address.toLowerCase();

    const query = gql`
      query FindPools($token0: String!, $token1: String!) {
        pools(
          where: {
            or: [
              { token0: $token0, token1: $token1 },
              { token0: $token1, token1: $token0 }
            ]
          }
          orderBy: volumeUSD
          orderDirection: desc
        ) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          feeTier
          liquidity
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          token0Price
          token1Price
        }
      }
    `;

    try {
      const result = await this.client.request<{ pools: V3Pool[] }>(query, {
        token0,
        token1
      });
      return result.pools;
    } catch (error) {
      console.error('Error fetching pools:', error);
      return [];
    }
  }

  /**
   * Get all pools with optional filtering and sorting
   */
  async getAllAvailablePools(criteria: PoolSelectionCriteria): Promise<V3Pool[]> {
    const query = gql`
      query GetAllPools($orderBy: String!, $orderDirection: String!, $minTVL: BigDecimal) {
        pools(
          first: 100,
          orderBy: $orderBy,
          orderDirection: $orderDirection,
          where: { totalValueLockedUSD_gte: $minTVL }
        ) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          feeTier
          liquidity
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          token0Price
          token1Price
          poolDayData(first: 7, orderBy: date, orderDirection: desc) {
            date
            volumeUSD
            feesUSD
            tvlUSD
          }
        }
      }
    `;

    try {
      const result = await this.client.request<{ pools: V3Pool[] }>(query, {
        orderBy: criteria.sortBy,
        orderDirection: criteria.sortDirection,
        minTVL: criteria.minimumTVL?.toString() || '0'
      });
      
      // Filter by preferred fee tier if specified
      if (criteria.preferredFeeTier) {
        return result.pools.filter(pool => pool.feeTier === criteria.preferredFeeTier);
      }
      
      return result.pools;
    } catch (error) {
      console.error('Error fetching all pools:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific pool
   */
  async getPoolDetails(poolAddress: string): Promise<V3Pool | null> {
    const query = gql`
      query GetPoolDetails($poolId: ID!) {
        pool(id: $poolId) {
          id
          token0 {
            id
            symbol
            name
            decimals
          }
          token1 {
            id
            symbol
            name
            decimals
          }
          feeTier
          liquidity
          totalValueLockedUSD
          volumeUSD
          feesUSD
          txCount
          token0Price
          token1Price
          sqrtPrice
          tick
          observationIndex
          feeProtocol
          untrackedVolumeUSD
          collectedFeesToken0
          collectedFeesToken1
          collectedFeesUSD
        }
      }
    `;

    try {
      const result = await this.client.request<{ pool: V3Pool }>(query, {
        poolId: poolAddress.toLowerCase()
      });
      return result.pool;
    } catch (error) {
      console.error('Error fetching pool details:', error);
      return null;
    }
  }

  /**
   * Format fee tier for display
   */
  formatFeeTier(feeTier: string): string {
    const tierMap: { [key: string]: string } = {
      '2500': '0.25%',
      '10000': '1%',
      '20000': '2%'
    };
    return tierMap[feeTier] || `${parseInt(feeTier) / 10000}%`;
  }

  /**
   * Calculate estimated APY based on recent fees and TVL
   */
  calculateEstimatedAPY(pool: V3Pool): number {
    const tvl = parseFloat(pool.totalValueLockedUSD);
    
    if (tvl === 0) return 0;
    
    // Use recent poolDayData if available for more accurate APY
    if (pool.poolDayData && pool.poolDayData.length > 0) {
      // Calculate average daily fees from recent data (last 7 days)
      const recentDays = pool.poolDayData.slice(0, Math.min(7, pool.poolDayData.length));
      const totalRecentFees = recentDays.reduce((sum, day) => sum + parseFloat(day.feesUSD), 0);
      const avgDailyFees = totalRecentFees / recentDays.length;
      
      // Estimate annual fees based on recent daily average
      const annualFees = avgDailyFees * 365;
      const apy = (annualFees / tvl) * 100;
      
      return Math.round(apy * 100) / 100; // Round to 2 decimal places
    }
    
    // Fallback: If no recent data, return 0 or use a conservative estimate
    // Don't use total historical fees as it's misleading
    return 0;
  }

  /**
   * Get recommendation based on pool metrics
   */
  getPoolRecommendation(pool: V3Pool): string {
    const tvl = parseFloat(pool.totalValueLockedUSD);
    const volume = parseFloat(pool.volumeUSD);
    const txCount = parseInt(pool.txCount);
    
    if (tvl > 1000000 && volume > 500000) {
      return 'Most Liquid & Active';
    } else if (volume > 100000) {
      return 'High Volume';
    } else if (tvl > 500000) {
      return 'Stable TVL';
    } else if (txCount > 1000) {
      return 'Active Trading';
    } else {
      return 'Emerging Pool';
    }
  }

  /**
   * Format pool for display in chat
   */
  formatPoolForDisplay(pool: V3Pool, index: number): string {
    const feeTier = this.formatFeeTier(pool.feeTier);
    const tvl = this.formatUSD(pool.totalValueLockedUSD);
    
    // Show recent volume (24h) if available, otherwise show total with warning
    let volumeDisplay: string;
    if (pool.poolDayData && pool.poolDayData.length > 0) {
      const recentVolume = pool.poolDayData[0].volumeUSD; // Most recent day
      volumeDisplay = `${this.formatUSD(recentVolume)} (24h)`;
    } else {
      volumeDisplay = `${this.formatUSD(pool.volumeUSD)} (total)`;
    }
    
    const apy = this.calculateEstimatedAPY(pool);
    const recommendation = this.getPoolRecommendation(pool);
    
    return `${index}. **${feeTier} Fee Tier** - Vol: ${volumeDisplay} | TVL: ${tvl} | APY: ~${apy}% | ${recommendation}`;
  }

  /**
   * Format USD amounts
   */
  private formatUSD(amount: string): string {
    const value = parseFloat(amount);
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }
} 