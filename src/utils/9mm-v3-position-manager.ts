import { GraphQLClient, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { NineMmV3FeeTracker } from './9mm-v3-fee-tracker.js';

export interface V3Position {
  id: string;
  owner: string;
  pool: {
    id: string;
    token0: {
      id: string;
      symbol: string;
      decimals: string;
    };
    token1: {
      id: string;
      symbol: string;
      decimals: string;
    };
    feeTier: string;
    sqrtPrice: string;
    tick: string;
  };
  liquidity: string;
  tickLower: string;
  tickUpper: string;
  depositedToken0: string;
  depositedToken1: string;
  withdrawnToken0: string;
  withdrawnToken1: string;
  collectedFeesToken0: string;
  collectedFeesToken1: string;
  transaction: {
    timestamp: string;
  };
}

export interface PriceRange {
  lower: number;
  upper: number;
  currentPrice: number;
  estimatedAPY?: number;
  inRange?: boolean;
}

export interface TickRange {
  tickLower: number;
  tickUpper: number;
}

export interface AddLiquidityV3Params {
  poolAddress: string;
  token0Amount: string;
  token1Amount: string;
  tickLower: number;
  tickUpper: number;
  slippageTolerance: number;
  deadline: number;
}

export interface RemovalResult {
  token0Amount: string;
  token1Amount: string;
  feesCollected0: string;
  feesCollected1: string;
}

export class NineMmV3PositionManager {
  private client: GraphQLClient;
  private feeTracker: NineMmV3FeeTracker;
  private subgraphUrl = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';
  
  // 9mm V3 contract addresses on PulseChain
  private nftPositionManager = '0x01CEF6B55a31B8fE39F951bc67b41D5DA6F96B1D'; // Example address
  private factory = '0x0e410Fa377115581470D00248f4401E6C8B02171'; // Example address
  
  constructor() {
    this.client = new GraphQLClient(this.subgraphUrl);
    this.feeTracker = new NineMmV3FeeTracker();
  }

  /**
   * Get all positions for a specific user
   */
  async getUserPositions(userAddress: string): Promise<V3Position[]> {
    const query = gql`
      query GetUserPositions($owner: String!) {
        positions(
          where: { 
            owner: $owner, 
            liquidity_gt: 0 
          }
          orderBy: liquidity
          orderDirection: desc
        ) {
          id
          owner
          pool {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            feeTier
            sqrtPrice
            tick
          }
          liquidity
          tickLower
          tickUpper
          depositedToken0
          depositedToken1
          withdrawnToken0
          withdrawnToken1
          collectedFeesToken0
          collectedFeesToken1
          transaction {
            timestamp
          }
        }
      }
    `;

    try {
      const result = await this.client.request<{ positions: V3Position[] }>(query, {
        owner: userAddress.toLowerCase()
      });
      return result.positions;
    } catch (error) {
      console.error('Error fetching user positions:', error);
      return [];
    }
  }

  /**
   * Get detailed information about a specific position
   */
  async getPositionDetails(positionId: string): Promise<V3Position | null> {
    const query = gql`
      query GetPositionDetails($id: ID!) {
        position(id: $id) {
          id
          owner
          pool {
            id
            token0 {
              id
              symbol
              decimals
            }
            token1 {
              id
              symbol
              decimals
            }
            feeTier
            sqrtPrice
            tick
            token0Price
            token1Price
          }
          liquidity
          tickLower
          tickUpper
          depositedToken0
          depositedToken1
          withdrawnToken0
          withdrawnToken1
          collectedFeesToken0
          collectedFeesToken1
          transaction {
            timestamp
          }
        }
      }
    `;

    try {
      const result = await this.client.request<{ position: V3Position | null }>(query, {
        id: positionId.toLowerCase()
      });
      return result.position;
    } catch (error) {
      console.error('Error fetching position details:', error);
      return null;
    }
  }

  /**
   * Convert price to tick for V3
   * Formula: tick = log(price) / log(1.0001)
   */
  priceToTick(price: number): number {
    return Math.floor(Math.log(price) / Math.log(1.0001));
  }

  /**
   * Convert tick to price for V3
   * Formula: price = 1.0001^tick
   */
  tickToPrice(tick: number): number {
    return Math.pow(1.0001, tick);
  }

  /**
   * Calculate tick range from price range
   */
  calculateTickRange(priceLower: number, priceUpper: number, tickSpacing: number): TickRange {
    const tickLower = Math.floor(this.priceToTick(priceLower) / tickSpacing) * tickSpacing;
    const tickUpper = Math.ceil(this.priceToTick(priceUpper) / tickSpacing) * tickSpacing;
    
    return { tickLower, tickUpper };
  }

  /**
   * Get tick spacing for fee tier
   */
  getTickSpacing(feeTier: string): number {
    const tickSpacingMap: { [key: string]: number } = {
      '2500': 50,   // 0.25%
      '10000': 200, // 1%
      '20000': 200  // 2%
    };
    return tickSpacingMap[feeTier] || 60;
  }

  /**
   * Suggest optimal price ranges based on strategy
   */
  async suggestOptimalRange(
    poolAddress: string,
    currentPrice: number,
    strategy: 'conservative' | 'moderate' | 'aggressive',
    feeTier: string
  ): Promise<PriceRange> {
    const ranges = {
      conservative: { lower: 0.8, upper: 1.2 },   // ±20%
      moderate: { lower: 0.9, upper: 1.1 },       // ±10%
      aggressive: { lower: 0.95, upper: 1.05 }    // ±5%
    };
    
    const multiplier = ranges[strategy];
    const tickSpacing = this.getTickSpacing(feeTier);
    
    const priceLower = currentPrice * multiplier.lower;
    const priceUpper = currentPrice * multiplier.upper;
    
    // Align to tick spacing
    const tickRange = this.calculateTickRange(priceLower, priceUpper, tickSpacing);
    
    return {
      lower: this.tickToPrice(tickRange.tickLower),
      upper: this.tickToPrice(tickRange.tickUpper),
      currentPrice,
      estimatedAPY: await this.estimateAPYForRange(poolAddress, tickRange),
      inRange: true
    };
  }

  /**
   * Estimate APY for a specific tick range
   */
  async estimateAPYForRange(poolAddress: string, tickRange: TickRange): Promise<number> {
    // Query historical fee data for the pool
    const query = gql`
      query GetPoolFeeData($poolId: ID!) {
        pool(id: $poolId) {
          totalValueLockedUSD
          feesUSD
          poolDayData(first: 7, orderBy: date, orderDirection: desc) {
            date
            feesUSD
            tvlUSD
            volumeUSD
          }
        }
      }
    `;

    try {
      const result = await this.client.request<any>(query, {
        poolId: poolAddress.toLowerCase()
      });
      
      if (!result.pool || !result.pool.poolDayData || result.pool.poolDayData.length === 0) {
        return 0;
      }
      
      // Calculate average daily fees
      const recentDays = result.pool.poolDayData;
      const avgDailyFees = recentDays.reduce((sum: number, day: any) => 
        sum + parseFloat(day.feesUSD), 0) / recentDays.length;
      
      // Estimate concentration factor based on range width
      const rangeWidth = tickRange.tickUpper - tickRange.tickLower;
      const fullRangeWidth = 887272; // Approximate full range ticks
      const concentrationFactor = fullRangeWidth / rangeWidth;
      
      // Estimate APY with concentration bonus
      const tvl = parseFloat(result.pool.totalValueLockedUSD);
      const baseAPY = (avgDailyFees * 365 / tvl) * 100;
      const concentratedAPY = baseAPY * Math.sqrt(concentrationFactor); // Square root for conservative estimate
      
      return Math.round(concentratedAPY * 100) / 100;
    } catch (error) {
      console.error('Error estimating APY:', error);
      return 0;
    }
  }

  /**
   * Check if position is in range
   */
  isPositionInRange(position: V3Position): boolean {
    const currentTick = parseInt(position.pool.tick);
    const tickLower = parseInt(position.tickLower);
    const tickUpper = parseInt(position.tickUpper);
    
    return currentTick >= tickLower && currentTick <= tickUpper;
  }

  /**
   * Calculate unclaimed fees for a position
   */
  calculateUnclaimedFees(position: V3Position): { fees0: string; fees1: string } {
    // This is a simplified calculation
    // In reality, would need to call the contract to get exact unclaimed fees
    const deposited0 = parseFloat(position.depositedToken0);
    const deposited1 = parseFloat(position.depositedToken1);
    const withdrawn0 = parseFloat(position.withdrawnToken0);
    const withdrawn1 = parseFloat(position.withdrawnToken1);
    const collected0 = parseFloat(position.collectedFeesToken0);
    const collected1 = parseFloat(position.collectedFeesToken1);
    
    // Rough estimate of fees earned (would need contract call for exact)
    const estimatedFees0 = Math.max(0, (deposited0 - withdrawn0) * 0.01); // 1% estimate
    const estimatedFees1 = Math.max(0, (deposited1 - withdrawn1) * 0.01);
    
    return {
      fees0: estimatedFees0.toString(),
      fees1: estimatedFees1.toString()
    };
  }

  /**
   * Format position for display
   */
  formatPositionForDisplay(position: V3Position, index: number): string {
    const token0 = position.pool.token0.symbol;
    const token1 = position.pool.token1.symbol;
    const feeTier = this.formatFeeTier(position.pool.feeTier);
    const inRange = this.isPositionInRange(position);
    const rangeStatus = inRange ? '🟢 In Range' : '🔴 Out of Range';
    const unclaimedFees = this.calculateUnclaimedFees(position);
    
    const liquidity = ethers.formatUnits(position.liquidity, 18);
    const value0 = ethers.formatUnits(position.depositedToken0, position.pool.token0.decimals);
    const value1 = ethers.formatUnits(position.depositedToken1, position.pool.token1.decimals);
    
    return `${index}. **${token0}/${token1} ${feeTier}** - ${rangeStatus}
   Position ID: #${position.id.slice(0, 8)}...
   Value: ${parseFloat(value0).toFixed(4)} ${token0} + ${parseFloat(value1).toFixed(4)} ${token1}
   Unclaimed Fees: ~${parseFloat(unclaimedFees.fees0).toFixed(4)} ${token0} + ~${parseFloat(unclaimedFees.fees1).toFixed(4)} ${token1}`;
  }

  /**
   * Get detailed position analytics with fee tracking
   */
  async getPositionAnalytics(positionId: string): Promise<{
    position: V3Position | null;
    feeEarnings: any;
    performance: any;
  }> {
    const position = await this.getPositionDetails(positionId);
    if (!position) {
      return { position: null, feeEarnings: null, performance: null };
    }

    // Get fee earnings and performance analytics
    const [feeEarnings, performance] = await Promise.all([
      this.feeTracker.getFeeEarningsHistory(positionId),
      this.feeTracker.getPositionPerformance(position)
    ]);

    return { position, feeEarnings, performance };
  }

  /**
   * Get daily fee earnings for a position
   */
  async getDailyFeeEarnings(positionId: string, days: number = 30) {
    return this.feeTracker.getDailyFeeEarnings(positionId, days);
  }

  /**
   * Format position with detailed analytics
   */
  async formatPositionWithAnalytics(position: V3Position, index: number): Promise<string> {
    const token0 = position.pool.token0.symbol;
    const token1 = position.pool.token1.symbol;
    const feeTier = this.formatFeeTier(position.pool.feeTier);
    const inRange = this.isPositionInRange(position);
    const rangeStatus = inRange ? '🟢 In Range' : '🔴 Out of Range';

    // Get analytics
    const [feeEarnings, performance] = await Promise.all([
      this.feeTracker.getFeeEarningsHistory(position.id),
      this.feeTracker.getPositionPerformance(position)
    ]);

    const dailyEarnings = feeEarnings.earningRate.dailyUSD;
    const totalReturn = performance.pnl.percentageReturn;
    const timeInRange = performance.risk.timeInRange;

    return `${index}. **${token0}/${token1} ${feeTier}** - ${rangeStatus}
   Position ID: #${position.id.slice(0, 8)}...
   
   💰 **Earnings**: $${feeEarnings.totalEarned.usd} total | $${dailyEarnings}/day
   📈 **Performance**: ${totalReturn}% total return | ${performance.pnl.annualizedReturn}% APY
   ⚡ **Range**: ${timeInRange}% in-range | ${performance.daysActive} days active
   
   🎯 **vs HODL**: ${performance.vsHodl.outperformance}% outperformance`;
  }

  /**
   * Get position summary with key metrics
   */
  async getPositionSummary(userAddress: string): Promise<{
    totalPositions: number;
    totalValueUSD: number;
    totalFeesEarned: number;
    avgAPY: number;
    inRangePositions: number;
  }> {
    const positions = await this.getUserPositions(userAddress);
    
    if (positions.length === 0) {
      return {
        totalPositions: 0,
        totalValueUSD: 0,
        totalFeesEarned: 0,
        avgAPY: 0,
        inRangePositions: 0
      };
    }

    // Calculate aggregated metrics
    let totalValueUSD = 0;
    let totalFeesEarned = 0;
    let totalAPY = 0;
    let inRangeCount = 0;

    for (const position of positions) {
      const feeEarnings = await this.feeTracker.getFeeEarningsHistory(position.id);
      const performance = await this.feeTracker.getPositionPerformance(position);
      
      totalValueUSD += parseFloat(performance.currentValue.totalUSD);
      totalFeesEarned += parseFloat(feeEarnings.totalEarned.usd);
      totalAPY += performance.pnl.annualizedReturn;
      
      if (this.isPositionInRange(position)) {
        inRangeCount++;
      }
    }

    return {
      totalPositions: positions.length,
      totalValueUSD: Math.round(totalValueUSD * 100) / 100,
      totalFeesEarned: Math.round(totalFeesEarned * 100) / 100,
      avgAPY: Math.round((totalAPY / positions.length) * 100) / 100,
      inRangePositions: inRangeCount
    };
  }

  /**
   * Format fee tier for display
   */
  private formatFeeTier(feeTier: string): string {
    const tierMap: { [key: string]: string } = {
      '2500': '0.25%',
      '10000': '1%',
      '20000': '2%'
    };
    return tierMap[feeTier] || `${parseInt(feeTier) / 10000}%`;
  }
} 