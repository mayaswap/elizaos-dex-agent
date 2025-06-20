// Export all individual actions
export { default as swapAction } from './swap.js';
export { default as priceAction } from './price.js';
export { default as balanceAction } from './balance.js';
export { default as portfolioAction } from './portfolio.js';
export { default as walletAction } from './wallet.js';
export { default as addLiquidityAction } from './addLiquidity.js';
export { default as removeLiquidityAction } from './removeLiquidity.js';
export { default as queryPoolsAction } from './queryPools.js';
export { default as gasPriceAction } from './gasPrice.js';
export { default as transactionHistoryAction } from './transactionHistory.js';
export { default as multiChainAction } from './multiChain.js';
export { default as slippageManagementAction } from './slippageManagement.js';
export { default as defiAnalyticsAction } from './defiAnalytics.js';
export { default as tokenAllowanceAction } from './tokenAllowance.js';
export { default as positionTrackingAction } from './positionTracking.js';
export { default as advancedOrdersAction } from './advancedOrders.js';
export { default as startMonitoringAction } from './startMonitoring.js';
export { default as walletManagementAction } from './walletManagement.js';
export { default as walletAddressAction } from './walletAddress.js';
export { default as transactionConfirmationAction } from './transactionConfirmation.js';
export { default as contextualResponseAction } from './contextualResponse.js';

// Export all actions as an array for easy registration with ElizaOS runtime
export const allActions = async () => {
    const { default: swapAction } = await import('./swap.js');
    const { default: priceAction } = await import('./price.js');
    const { default: balanceAction } = await import('./balance.js');
    const { default: portfolioAction } = await import('./portfolio.js');
    // const { default: walletAction } = await import('./wallet.js'); // REMOVED: Legacy wallet action
    const { default: walletV2Action } = await import('./walletV2.js');
    const { default: addLiquidityAction } = await import('./addLiquidity.js');
    const { default: removeLiquidityAction } = await import('./removeLiquidity.js');
    const { default: queryPoolsAction } = await import('./queryPools.js');
    const { default: gasPriceAction } = await import('./gasPrice.js');
    const { default: transactionHistoryAction } = await import('./transactionHistory.js');
    const { default: multiChainAction } = await import('./multiChain.js');
    const { default: slippageManagementAction } = await import('./slippageManagement.js');
    const { default: defiAnalyticsAction } = await import('./defiAnalytics.js');
    const { default: tokenAllowanceAction } = await import('./tokenAllowance.js');
    const { default: positionTrackingAction } = await import('./positionTracking.js');
    const { default: advancedOrdersAction } = await import('./advancedOrders.js');
    const { default: startMonitoringAction } = await import('./startMonitoring.js');
    // const { default: walletManagementAction } = await import('./walletManagement.js'); // REMOVED: Conflicts with WALLET_V2
    
    // New database-powered actions
    const { default: tradingAnalyticsAction } = await import('./tradingAnalytics.js');
    const { default: priceAlertsAction } = await import('./priceAlerts.js');
    const { default: watchlistsAction } = await import('./watchlists.js');
    const { default: walletAddressAction } = await import('./walletAddress.js');
    const { default: transactionConfirmationAction } = await import('./transactionConfirmation.js');
    const { default: contextualResponseAction } = await import('./contextualResponse.js');
    
    return [
        // Wallet system - PRIORITIZED FIRST
        walletV2Action, // Primary database-backed wallet system
        
        // Trading actions
        swapAction,
        transactionConfirmationAction, // Handle transaction confirmations
        contextualResponseAction, // Handle context switching with pending transactions
        priceAction,
        balanceAction,
        portfolioAction,
        addLiquidityAction,
        removeLiquidityAction,
        queryPoolsAction,
        gasPriceAction,
        transactionHistoryAction,
        multiChainAction,
        slippageManagementAction,
        defiAnalyticsAction,
        tokenAllowanceAction,
        positionTrackingAction,
        advancedOrdersAction,
        startMonitoringAction,
        
        // Display actions
        walletAddressAction, // Wallet address display
        
        // Analytics actions
        tradingAnalyticsAction,
        priceAlertsAction,
        watchlistsAction
    ];
};

// For convenience - export as named export too
export const actions = allActions; 