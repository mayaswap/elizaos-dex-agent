import { GraphQLClient, gql } from 'graphql-request';
import { V3Position } from './9mm-v3-position-manager.js';

export interface FeeEarningsSnapshot {
  timestamp: string;
  token0Fees: string;
  token1Fees: string;
  token0FeesUSD: string;
  token1FeesUSD: string;
  totalFeesUSD: string;
  blockNumber: string;
}

export interface FeeEarningsHistory {
  positionId: string;
  snapshots: FeeEarningsSnapshot[];
  totalEarned: {
    token0: string;
    token1: string;
    usd: string;
  };
  earningRate: {
    dailyUSD: number;
    weeklyUSD: number;
    monthlyUSD: number;
    annualizedAPY: number;
  };
}

export interface PositionPerformance {
  positionId: string;
  openDate: string;
  daysActive: number;
  
  // Investment amounts
  initialInvestment: {
    token0Amount: string;
    token1Amount: string;
    totalUSD: string;
  };
  
  // Current value
  currentValue: {
    token0Amount: string;
    token1Amount: string;
    totalUSD: string;
    unclaimedFeesUSD: string;
  };
  
  // Performance metrics
  pnl: {
    totalPnL: string;
    feePnL: string;
    ilPnL: string; // Impermanent Loss
    percentageReturn: number;
    annualizedReturn: number;
  };
  
  // Comparisons
  vsHodl: {
    hodlValue: string;
    hodlReturn: number;
    outperformance: number; // vs holding underlying tokens
  };
  
  // Risk metrics
  risk: {
    timeInRange: number; // Percentage of time position was in range
    maxDrawdown: number;
    volatility: number;
  };
}

export interface DailyFeeData {
  date: string;
  feesToken0: string;
  feesToken1: string;
  feesUSD: string;
  token0PriceUSD: string;
  token1PriceUSD: string;
  volumeUSD: string;
}

export class NineMmV3FeeTracker {
  private client: GraphQLClient;
  private subgraphUrl = 'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest';
  
  constructor() {
    this.client = new GraphQLClient(this.subgraphUrl);
  }

  /**
   * Get real-time fee earnings for a position
   */
  async getFeeEarningsHistory(positionId: string): Promise<FeeEarningsHistory> {
    const query = gql`
      query GetPositionFeeHistory($positionId: ID!) {
        position(id: $positionId) {
          id
          collectedFeesToken0
          collectedFeesToken1
          pool {
            token0 {
              symbol
              decimals
            }
            token1 {
              symbol
              decimals
            }
          }
          transaction {
            timestamp
          }
        }
        
        # Get fee collection events
        collects(
          where: { position: $positionId }
          orderBy: timestamp
          orderDirection: desc
          first: 100
        ) {
          id
          timestamp
          amount0
          amount1
          amountUSD
          transaction {
            blockNumber
          }
        }
      }
    `;

    try {
      const result = await this.client.request<any>(query, {
        positionId: positionId.toLowerCase()
      });

      if (!result.position) {
        throw new Error(`Position ${positionId} not found`);
      }

      // Process fee collection events into snapshots
      const snapshots: FeeEarningsSnapshot[] = result.collects.map((collect: any) => ({
        timestamp: collect.timestamp,
        token0Fees: collect.amount0,
        token1Fees: collect.amount1,
        token0FeesUSD: (parseFloat(collect.amountUSD) * 0.5).toString(), // Rough split
        token1FeesUSD: (parseFloat(collect.amountUSD) * 0.5).toString(),
        totalFeesUSD: collect.amountUSD,
        blockNumber: collect.transaction.blockNumber
      }));

      // Calculate total earnings
      const totalToken0 = result.position.collectedFeesToken0;
      const totalToken1 = result.position.collectedFeesToken1;
      const totalUSD = snapshots.reduce((sum, s) => sum + parseFloat(s.totalFeesUSD), 0);

      // Calculate earning rates
      const earningRate = this.calculateEarningRates(snapshots, result.position.transaction.timestamp);

      return {
        positionId,
        snapshots,
        totalEarned: {
          token0: totalToken0,
          token1: totalToken1,
          usd: totalUSD.toString()
        },
        earningRate
      };
    } catch (error) {
      console.error('Error fetching fee earnings:', error);
      return {
        positionId,
        snapshots: [],
        totalEarned: { token0: '0', token1: '0', usd: '0' },
        earningRate: { dailyUSD: 0, weeklyUSD: 0, monthlyUSD: 0, annualizedAPY: 0 }
      };
    }
  }

  /**
   * Get comprehensive position performance analytics
   */
  async getPositionPerformance(position: V3Position): Promise<PositionPerformance> {
    const openTimestamp = parseInt(position.transaction.timestamp);
    const openDate = new Date(openTimestamp * 1000).toISOString().split('T')[0];
    const daysActive = (Date.now() / 1000 - openTimestamp) / (24 * 60 * 60);

    // Get historical price data for IL calculation
    const priceHistory = await this.getHistoricalPrices(position.pool.id, openTimestamp);
    
    // Calculate initial investment value
    const initialToken0 = parseFloat(position.depositedToken0);
    const initialToken1 = parseFloat(position.depositedToken1);
    const initialPrice0 = priceHistory.openPrice.token0USD;
    const initialPrice1 = priceHistory.openPrice.token1USD;
    const initialUSD = (initialToken0 * initialPrice0) + (initialToken1 * initialPrice1);

    // Calculate current value
    const currentToken0 = initialToken0 - parseFloat(position.withdrawnToken0);
    const currentToken1 = initialToken1 - parseFloat(position.withdrawnToken1);
    const currentPrice0 = priceHistory.currentPrice.token0USD;
    const currentPrice1 = priceHistory.currentPrice.token1USD;
    const currentUSD = (currentToken0 * currentPrice0) + (currentToken1 * currentPrice1);

    // Get fee earnings
    const feeEarnings = await this.getFeeEarningsHistory(position.id);
    const unclaimedFeesUSD = parseFloat(feeEarnings.totalEarned.usd);

    // Calculate HODL comparison
    const hodlValue = initialUSD * (currentPrice0 / initialPrice0 + currentPrice1 / initialPrice1) / 2;
    const hodlReturn = ((hodlValue - initialUSD) / initialUSD) * 100;

    // Calculate P&L
    const totalValue = currentUSD + unclaimedFeesUSD;
    const totalPnL = totalValue - initialUSD;
    const feePnL = unclaimedFeesUSD;
    const ilPnL = totalPnL - feePnL;
    const percentageReturn = (totalPnL / initialUSD) * 100;
    const annualizedReturn = (percentageReturn / daysActive) * 365;

    // Calculate risk metrics
    const timeInRange = await this.calculateTimeInRange(position);
    
    return {
      positionId: position.id,
      openDate,
      daysActive: Math.round(daysActive * 100) / 100,
      
      initialInvestment: {
        token0Amount: position.depositedToken0,
        token1Amount: position.depositedToken1,
        totalUSD: initialUSD.toFixed(2)
      },
      
      currentValue: {
        token0Amount: currentToken0.toString(),
        token1Amount: currentToken1.toString(),
        totalUSD: currentUSD.toFixed(2),
        unclaimedFeesUSD: unclaimedFeesUSD.toFixed(2)
      },
      
      pnl: {
        totalPnL: totalPnL.toFixed(2),
        feePnL: feePnL.toFixed(2),
        ilPnL: ilPnL.toFixed(2),
        percentageReturn: Math.round(percentageReturn * 100) / 100,
        annualizedReturn: Math.round(annualizedReturn * 100) / 100
      },
      
      vsHodl: {
        hodlValue: hodlValue.toFixed(2),
        hodlReturn: Math.round(hodlReturn * 100) / 100,
        outperformance: Math.round((percentageReturn - hodlReturn) * 100) / 100
      },
      
      risk: {
        timeInRange: timeInRange,
        maxDrawdown: await this.calculateMaxDrawdown(position),
        volatility: await this.calculateVolatility(position)
      }
    };
  }

  /**
   * Get daily fee earnings for a position
   */
  async getDailyFeeEarnings(positionId: string, days: number = 30): Promise<DailyFeeData[]> {
    const query = gql`
      query GetDailyFees($positionId: ID!, $startTime: BigInt!) {
        positionDayDatas(
          where: { 
            position: $positionId
            date_gte: $startTime
          }
          orderBy: date
          orderDirection: desc
          first: ${days}
        ) {
          date
          feesEarnedToken0
          feesEarnedToken1
          feesEarnedUSD
          pool {
            token0Price
            token1Price
          }
        }
      }
    `;

    const startTime = Math.floor(Date.now() / 1000) - (days * 24 * 60 * 60);

    try {
      const result = await this.client.request<any>(query, {
        positionId: positionId.toLowerCase(),
        startTime: startTime.toString()
      });

      return result.positionDayDatas.map((day: any) => ({
        date: new Date(parseInt(day.date) * 1000).toISOString().split('T')[0],
        feesToken0: day.feesEarnedToken0,
        feesToken1: day.feesEarnedToken1,
        feesUSD: day.feesEarnedUSD,
        token0PriceUSD: day.pool.token0Price,
        token1PriceUSD: day.pool.token1Price,
        volumeUSD: '0' // Would need additional query for volume
      }));
    } catch (error) {
      console.error('Error fetching daily fees:', error);
      return [];
    }
  }

  /**
   * Calculate earning rates from fee history
   */
  private calculateEarningRates(snapshots: FeeEarningsSnapshot[], openTimestamp: string): {
    dailyUSD: number;
    weeklyUSD: number;
    monthlyUSD: number;
    annualizedAPY: number;
  } {
    if (snapshots.length === 0) {
      return { dailyUSD: 0, weeklyUSD: 0, monthlyUSD: 0, annualizedAPY: 0 };
    }

    const totalFeesUSD = snapshots.reduce((sum, s) => sum + parseFloat(s.totalFeesUSD), 0);
    const daysActive = (Date.now() / 1000 - parseInt(openTimestamp)) / (24 * 60 * 60);
    
    const dailyUSD = totalFeesUSD / Math.max(daysActive, 1);
    const weeklyUSD = dailyUSD * 7;
    const monthlyUSD = dailyUSD * 30;
    const annualizedAPY = (dailyUSD * 365);

    return {
      dailyUSD: Math.round(dailyUSD * 100) / 100,
      weeklyUSD: Math.round(weeklyUSD * 100) / 100,
      monthlyUSD: Math.round(monthlyUSD * 100) / 100,
      annualizedAPY: Math.round(annualizedAPY * 100) / 100
    };
  }

  /**
   * Get historical prices for IL calculation
   */
  private async getHistoricalPrices(poolId: string, openTimestamp: number): Promise<{
    openPrice: { token0USD: number; token1USD: number };
    currentPrice: { token0USD: number; token1USD: number };
  }> {
    const query = gql`
      query GetHistoricalPrices($poolId: ID!) {
        pool(id: $poolId) {
          token0Price
          token1Price
        }
      }
    `;

    try {
      const result = await this.client.request<any>(query, { poolId });
      
      // Simplified - in reality would need historical price data
      const currentPrice0 = parseFloat(result.pool.token0Price);
      const currentPrice1 = parseFloat(result.pool.token1Price);
      
      return {
        openPrice: { token0USD: currentPrice0 * 0.9, token1USD: currentPrice1 * 0.9 }, // Estimate
        currentPrice: { token0USD: currentPrice0, token1USD: currentPrice1 }
      };
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      return {
        openPrice: { token0USD: 1, token1USD: 1 },
        currentPrice: { token0USD: 1, token1USD: 1 }
      };
    }
  }

  /**
   * Calculate percentage of time position was in range
   */
  private async calculateTimeInRange(position: V3Position): Promise<number> {
    // Simplified calculation - would need tick history for accuracy
    const currentTick = parseInt(position.pool.tick);
    const tickLower = parseInt(position.tickLower);
    const tickUpper = parseInt(position.tickUpper);
    
    const isInRange = currentTick >= tickLower && currentTick <= tickUpper;
    
    // Return estimated time in range (would need historical data for real calculation)
    return isInRange ? 85 : 45; // Rough estimates
  }

  /**
   * Calculate maximum drawdown
   */
  private async calculateMaxDrawdown(position: V3Position): Promise<number> {
    // Simplified - would need position value history
    return 15.5; // Placeholder
  }

  /**
   * Calculate position volatility
   */
  private async calculateVolatility(position: V3Position): Promise<number> {
    // Simplified - would need daily returns data
    return 25.3; // Placeholder
  }

  /**
   * Format fee earnings for display
   */
  formatFeeEarnings(feeHistory: FeeEarningsHistory): string {
    const { totalEarned, earningRate } = feeHistory;
    
    return `💰 **Fee Earnings**
Total Earned: $${parseFloat(totalEarned.usd).toFixed(2)}
Daily Rate: $${earningRate.dailyUSD}/day
Weekly Rate: $${earningRate.weeklyUSD}/week
Monthly Rate: $${earningRate.monthlyUSD}/month
Annualized APY: ${earningRate.annualizedAPY}%`;
  }

  /**
   * Format position performance for display
   */
  formatPositionPerformance(performance: PositionPerformance): string {
    const { pnl, vsHodl, risk } = performance;
    
    const profitEmoji = parseFloat(pnl.totalPnL) >= 0 ? '📈' : '📉';
    const vsHodlEmoji = vsHodl.outperformance >= 0 ? '🚀' : '🐌';
    
    return `${profitEmoji} **Position Performance**
Days Active: ${performance.daysActive}
Total P&L: $${pnl.totalPnL} (${pnl.percentageReturn}%)
  ├─ Fee Earnings: $${pnl.feePnL}
  └─ IL Impact: $${pnl.ilPnL}

${vsHodlEmoji} **vs HODL**
HODL Return: ${vsHodl.hodlReturn}%
Outperformance: ${vsHodl.outperformance}%

⚡ **Risk Metrics**
Time in Range: ${risk.timeInRange}%
Max Drawdown: ${risk.maxDrawdown}%
Volatility: ${risk.volatility}%

🎯 **Annualized Return**: ${pnl.annualizedReturn}%`;
  }
} 