import { GraphQLClient, gql } from 'graphql-request';
import { ethers } from 'ethers';
import { NineMmV3FeeTracker } from './9mm-v3-fee-tracker.js';

// V3 Position Manager ABI - only the functions we need
const V3_POSITION_MANAGER_ABI = [
  // Mint new position
  "function mint((address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, address recipient, uint256 deadline)) external payable returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1)",
  // Increase liquidity for existing position
  "function increaseLiquidity((uint256 tokenId, uint256 amount0Desired, uint256 amount1Desired, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint128 liquidity, uint256 amount0, uint256 amount1)",
  // Collect fees
  "function collect((uint256 tokenId, address recipient, uint128 amount0Max, uint128 amount1Max)) external payable returns (uint256 amount0, uint256 amount1)",
  // Remove liquidity
  "function decreaseLiquidity((uint256 tokenId, uint128 liquidity, uint256 amount0Min, uint256 amount1Min, uint256 deadline)) external payable returns (uint256 amount0, uint256 amount1)",
  // Get position details
  "function positions(uint256 tokenId) external view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)"
];

// V3 Pool ABI for getting current state
const V3_POOL_ABI = [
  "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
  "function token0() external view returns (address)",
  "function token1() external view returns (address)",
  "function fee() external view returns (uint24)",
  "function liquidity() external view returns (uint128)",
  "function tickSpacing() external view returns (int24)"
];

// V3 Factory ABI
const V3_FACTORY_ABI = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)"
];

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

export interface MintPositionParams {
  token0: string;
  token1: string;
  fee: number;
  tickLower: number;
  tickUpper: number;
  amount0Desired: string;
  amount1Desired: string;
  amount0Min: string;
  amount1Min: string;
  recipient: string;
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
  
  // 9mm V3 contract addresses on PulseChain - Updated with actual addresses
  private nftPositionManager = '0xCC05bf158202b4F461Ede8843d76dcd7Bbad07f2'; // Actual 9mm V3 Position Manager
  private factory = '0xe50DbDC88E87a2C92984d794bcF3D1d76f619C68'; // Actual 9mm V3 Factory
  private provider: ethers.providers.JsonRpcProvider;
  
  constructor() {
    this.client = new GraphQLClient(this.subgraphUrl);
    this.feeTracker = new NineMmV3FeeTracker();
    this.provider = new ethers.providers.JsonRpcProvider('https://rpc.pulsechain.com');
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
    
    const liquidity = ethers.utils.formatUnits(position.liquidity, 18);
    const value0 = ethers.utils.formatUnits(position.depositedToken0, position.pool.token0.decimals);
    const value1 = ethers.utils.formatUnits(position.depositedToken1, position.pool.token1.decimals);
    
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

  /**
   * Get pool information from factory
   */
  async getPoolInfo(token0: string, token1: string, fee: number): Promise<{
    poolAddress: string;
    currentTick: number;
    sqrtPriceX96: string;
    liquidity: string;
  } | null> {
    try {
      const factoryContract = new ethers.Contract(this.factory, V3_FACTORY_ABI, this.provider);
      const poolAddress = await factoryContract.getPool(token0, token1, fee);
      
      if (poolAddress === ethers.constants.AddressZero) {
        return null;
      }

      const poolContract = new ethers.Contract(poolAddress, V3_POOL_ABI, this.provider);
      const slot0 = await poolContract.slot0();
      const liquidity = await poolContract.liquidity();

      return {
        poolAddress,
        currentTick: slot0.tick,
        sqrtPriceX96: slot0.sqrtPriceX96.toString(),
        liquidity: liquidity.toString()
      };
    } catch (error) {
      console.error('Error getting pool info:', error);
      return null;
    }
  }

  /**
   * Calculate optimal amounts for liquidity based on current price and range
   */
  calculateOptimalAmounts(
    amount0Desired: string,
    amount1Desired: string,
    currentTick: number,
    tickLower: number,
    tickUpper: number,
    token0Decimals: number,
    token1Decimals: number
  ): { amount0: string; amount1: string } {
    // This is a simplified calculation
    // In production, you'd use more complex math based on the concentrated liquidity formula
    
    // If current price is within range
    if (currentTick >= tickLower && currentTick <= tickUpper) {
      // Use provided amounts with some adjustment
      return {
        amount0: amount0Desired,
        amount1: amount1Desired
      };
    }
    
    // If current price is below range, only need token0
    if (currentTick < tickLower) {
      return {
        amount0: amount0Desired,
        amount1: "0"
      };
    }
    
    // If current price is above range, only need token1
    return {
      amount0: "0",
      amount1: amount1Desired
    };
  }

  /**
   * Execute mint transaction to create new position
   */
  async mintNewPosition(
    params: MintPositionParams,
    privateKey: string
  ): Promise<{
    success: boolean;
    tokenId?: string;
    liquidity?: string;
    amount0?: string;
    amount1?: string;
    transactionHash?: string;
    error?: string;
  }> {
    try {
      // Create wallet instance
      const wallet = new ethers.Wallet(privateKey, this.provider);
      
      // Create position manager contract instance
      const positionManager = new ethers.Contract(
        this.nftPositionManager,
        V3_POSITION_MANAGER_ABI,
        wallet
      );

      // Prepare mint parameters
      const mintParams = {
        token0: params.token0,
        token1: params.token1,
        fee: params.fee,
        tickLower: params.tickLower,
        tickUpper: params.tickUpper,
        amount0Desired: params.amount0Desired,
        amount1Desired: params.amount1Desired,
        amount0Min: params.amount0Min,
        amount1Min: params.amount1Min,
        recipient: params.recipient,
        deadline: params.deadline
      };

      console.log('🚀 Executing mint transaction:', {
        ...mintParams,
        amount0Desired: ethers.utils.formatUnits(params.amount0Desired, 18),
        amount1Desired: ethers.utils.formatUnits(params.amount1Desired, 18)
      });

      // Estimate gas with buffer
      const gasEstimate = await positionManager.estimateGas.mint(mintParams);
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

      // Execute mint transaction
      const tx = await positionManager.mint(mintParams, {
        gasLimit,
        // Include value if one of the tokens is native (WPLS will be handled by router)
        value: params.token0.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' 
          ? params.amount0Desired 
          : params.token1.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
          ? params.amount1Desired
          : 0
      });

      console.log(`⏳ Mint transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // Parse the mint event to get return values
        const mintEvent = receipt.events?.find(e => e.event === 'IncreaseLiquidity');
        
        console.log(`✅ Position minted successfully in block ${receipt.blockNumber}`);
        
        return {
          success: true,
          tokenId: mintEvent?.args?.tokenId?.toString() || 'Unknown',
          liquidity: mintEvent?.args?.liquidity?.toString() || 'Unknown',
          amount0: mintEvent?.args?.amount0?.toString() || params.amount0Desired,
          amount1: mintEvent?.args?.amount1?.toString() || params.amount1Desired,
          transactionHash: tx.hash
        };
      } else {
        return {
          success: false,
          error: 'Transaction failed'
        };
      }

    } catch (error) {
      console.error('Mint position error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Build mint transaction for confirmation flow
   */
  async buildMintTransaction(
    params: MintPositionParams
  ): Promise<{
    to: string;
    data: string;
    value: string;
    gasEstimate: string;
  }> {
    const positionManager = new ethers.Contract(
      this.nftPositionManager,
      V3_POSITION_MANAGER_ABI,
      this.provider
    );

    // Encode the mint function call
    const data = positionManager.interface.encodeFunctionData('mint', [{
      token0: params.token0,
      token1: params.token1,
      fee: params.fee,
      tickLower: params.tickLower,
      tickUpper: params.tickUpper,
      amount0Desired: params.amount0Desired,
      amount1Desired: params.amount1Desired,
      amount0Min: params.amount0Min,
      amount1Min: params.amount1Min,
      recipient: params.recipient,
      deadline: params.deadline
    }]);

    // Calculate value if native token is involved
    const value = params.token0.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' 
      ? params.amount0Desired 
      : params.token1.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
      ? params.amount1Desired
      : "0";

    // Estimate gas
    try {
      const gasEstimate = await this.provider.estimateGas({
        to: this.nftPositionManager,
        data,
        value,
        from: params.recipient
      });
      
      return {
        to: this.nftPositionManager,
        data,
        value,
        gasEstimate: gasEstimate.mul(120).div(100).toString() // 20% buffer
      };
    } catch (error) {
      // If estimation fails, use a reasonable default
      return {
        to: this.nftPositionManager,
        data,
        value,
        gasEstimate: "500000" // Default gas limit
      };
    }
  }
} 