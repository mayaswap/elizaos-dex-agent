import type { ChainConfig, SupportedChain } from '../types/index.js';

/**
 * Chain configurations for supported networks
 * Based on the established configurations from dex-interface-resources
 */
export const CHAIN_CONFIGS: Record<SupportedChain, ChainConfig> = {
  pulsechain: {
    chainId: 369,
    name: 'PulseChain',
    symbol: 'PLS',
    rpcUrl: 'https://rpc.pulsechain.com',
    explorerUrl: 'https://kekxplorer.avecdra.pro',
    wrappedToken: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27', // WPLS
    aggregatorBaseUrl: 'https://api.9mm.pro',
  },
  base: {
    chainId: 8453,
    name: 'Base',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org',
    wrappedToken: '0x4200000000000000000000000000000000000006', // WETH on Base
    aggregatorBaseUrl: 'https://api.0x.org',
  },
  sonic: {
    chainId: 146,
    name: 'Sonic',
    symbol: 'S',
    rpcUrl: 'https://rpc.sonic.network',
    explorerUrl: 'https://explorer.sonic.network',
    wrappedToken: '0x0000000000000000000000000000000000000000', // Update with actual WSONIC
    aggregatorBaseUrl: 'https://api.sonic.swap',
  },
};

/**
 * 9MM Company Contract Addresses on Pulsechain
 * 
 * 9X Aggregator routes across these DEX sources for best prices:
 * - 9MM V2/V3 (their own DEXs - PancakeSwap forks)
 * - PulseX V1/V2, Uniswap V2/V3, PancakeSwap V2/V3
 * - SushiSwap, Balancer V2, Curve, ShibaSwap, EasySwap
 * - CryptoCom, Dextop, NineInch V2/V3, MultiHop
 */
export const NINMM_CONTRACTS = {
  pulsechain: {
    // 9X Aggregator System (Routes across all DEXs below)
    aggregatorRouter: '0x4491dbefc128e2de184baba03e7c991356f733ce', // 9X aggregator proxy
    routerHub: '0x9b35124b7212be7145985bc6b95e4a8a2ef825c9', // Core routing hub
    routerImplementation: '0x8ffebe284f6c829aab9981656637db3aec637c4c', // Main implementation
    
    // 9MM DEX V2 Contracts (PancakeSwap V2 fork)
    nineMM_V2_Factory: '0x3a0Fa7884dD93f3cd234bBE2A0958Ef04b05E13b',
    nineMM_V2_Router: '0xcC73b59F8D7b7c532703bDfea2808a28a488cF47',
    
    // 9MM DEX V3 Contracts (PancakeSwap V3 fork)
    nineMM_V3_Factory: '0xe50DbDC88E87a2C92984d794bcF3D1d76f619C68',
    nineMM_V3_PoolDeployer: '0x00f37661fA1b2B8A530cfb7B6d5A5a6AEd74177b',
    nineMM_V3_SwapRouter: '0x7bE8fbe502191bBBCb38b02f2d4fA0D628301bEA',
    nineMM_V3_PositionManager: '0xCC05bf158202b4F461Ede8843d76dcd7Bbad07f2',
    nineMM_V3_Quoter: '0x500260dD7C27eCE20b89ea0808d05a13CF867279',
    nineMM_V3_QuoterV2: '0x500260dD7C27eCE20b89ea0808d05a13CF867279',
    nineMM_V3_TickLens: '0x9f6d34fCC7cB8f98dfC0A5CB414f6539B414d26a',
    nineMM_V3_NftDescriptor: '0xfc6D8b33211c1ACe98d34b3b4b0DF35F4E3186d1',
    nineMM_V3_Migrator: '0xdee0BDC4cc82872f7D35941aBFA872F744FdF064',
    nineMM_V3_MasterChef: '0x842f3eD1C390637C99F82833D01D37695BF22066',
    nineMM_V3_LmPoolDeployer: '0xa887a9F1A0Ebc94bBB1C868bD32189d078d5eeCf',
    
    // Smart Router System (Routes across V2/V3)
    smartRouter: '0xa9444246d80d6E3496C9242395213B4f22226a59',
    smartRouterHelper: '0xb7ef0a4d0EC7DEE58a7762EfB707ed0a646E92A9',
    mixedRouteQuoter: '0xBa53762F281A293B6bE73C9D2d3b740C433635cA',
    tokenValidator: '0x623942Bb33b72f02061324A74C4718bC4b9366a1',
    
    // External DEX Routers (aggregated by 9X)
    pulseXV1Router: '0x165c3410fc91ef562c50559f7d2289febed552d9', // From trace analysis
    pulseXV2Router: '0x165c3410fc91ef562c50559f7d2289febed552d9', // From trace analysis
    
    // Multicall & Utils
    multicall3: '0x4c3781eaA6cCe2EA1EC0A8b3cF4d2e6a29e95b14',
    interfaceMulticall: '0xC8edb20cA86A0c6B3dbd38A1D47579C625a23dF4',
    universalRouter: '0x4491dbefc128e2de184baba03e7c991356f733ce', // Alias for aggregator
  },
};

/**
 * Default chain for the DEX interface
 */
export const DEFAULT_CHAIN: SupportedChain = 'pulsechain';

/**
 * Popular token addresses for each chain
 */
export const POPULAR_TOKENS = {
  pulsechain: {
    PLS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native PLS
    WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
    USDC: '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07', // Correct USDC address
    USDT: '0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f', // Correct USDT address  
    DAI: '0xefD766cCb38EaF1dfd701853BFCe31359239F305',   // Correct DAI address
    HEX: '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
    PLSX: '0x95b303987a60c71504d99aa1b13b4da07b0790ab', // PulseX token
    '9MM': '0x7b39712Ef45F7dcED2bBDF11F3D5046bA61dA719', // 9mm token
    WETH: '0x02DcdD04e3F455D838cd1249292C58f3B79e3C3C',
  },
  base: {
    ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
  },
  sonic: {
    S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    WSONIC: '0x0000000000000000000000000000000000000000', // Update when available
  },
}; 