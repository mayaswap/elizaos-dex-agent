"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.POPULAR_TOKENS = exports.DEFAULT_CHAIN = exports.NINMM_CONTRACTS = exports.CHAIN_CONFIGS = void 0;
/**
 * Chain configurations for supported networks
 * Based on the established configurations from dex-interface-resources
 */
exports.CHAIN_CONFIGS = {
    pulsechain: {
        chainId: 369,
        name: 'PulseChain',
        symbol: 'PLS',
        rpcUrl: 'https://rpc.pulsechain.com',
        explorerUrl: 'https://scan.pulsechain.com',
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
 * 9mm DEX Contract Addresses on Pulsechain
 * From our established configuration in pulsechain-config.json
 */
exports.NINMM_CONTRACTS = {
    pulsechain: {
        // V2 Contracts
        v2Factory: '0x3a0Fa7884dD93f3cd234bBE2A0958Ef04b05E13b',
        v2Router: '0xcC73b59F8D7b7c532703bDfea2808a28a488cF47',
        // V3 Contracts
        v3Factory: '0xe50DbDC88E87a2C92984d794bcF3D1d76f619C68',
        v3SmartRouter: '0xa9444246d80d6E3496C9242395213B4f22226a59',
        v3QuoterV2: '0x500260dD7C27eCE20b89ea0808d05a13CF867279',
        v3NonfungiblePositionManager: '0xCC05bf158202b4F461Ede8843d76dcd7Bbad07f2',
        // Multicall & Utils
        multicall3: '0x4c3781eaA6cCe2EA1EC0A8b3cF4d2e6a29e95b14',
        universalRouter: '0x3C5Fd0000EdDAc70d3A69f9648f7D1f9f1C4D97b',
    },
};
/**
 * Default chain for the DEX interface
 */
exports.DEFAULT_CHAIN = 'pulsechain';
/**
 * Popular token addresses for each chain
 */
exports.POPULAR_TOKENS = {
    pulsechain: {
        PLS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native PLS
        WPLS: '0xA1077a294dDE1B09bB078844df40758a5D0f9a27',
        USDC: '0x15D38573d2feeb82e7ad5187aB8c1D52810B1f07', // Correct USDC address
        USDT: '0x0Cb6F5a34ad42ec934882A05265A7d5F59b51A2f', // Correct USDT address  
        DAI: '0xefD766cCb38EaF1dfd701853BFCe31359239F305', // Correct DAI address
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
