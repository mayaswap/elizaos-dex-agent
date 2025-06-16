import { IAgentRuntime, Memory, HandlerCallback } from "@elizaos/core";
import { sessionService, PlatformUser } from "../services/sessionService.js";
import { WalletService, createPlatformUser } from "../services/walletService.js";

/**
 * WalletGuard - Ensures users have wallets before executing transaction actions
 */
export class WalletGuard {
    private static walletService: WalletService;

    /**
     * Initialize wallet service
     */
    public static initialize(runtime: IAgentRuntime): void {
        if (!this.walletService) {
            this.walletService = new WalletService(runtime);
        }
    }

    /**
     * Check if user has a wallet and create platform user object
     */
    public static async checkWalletRequired(
        runtime: IAgentRuntime,
        message: Memory,
        callback?: HandlerCallback
    ): Promise<{ hasWallet: boolean; platformUser: PlatformUser } | null> {
        
        // Initialize wallet service if not done already
        if (!this.walletService) {
            this.initialize(runtime);
        }

        // Create platform user from message
        const platformUser = createPlatformUser(runtime as any, message);
        
        if (!platformUser) {
            if (callback) {
                callback({
                    text: "❌ Unable to identify user platform. Please try again."
                });
            }
            return null;
        }

        // Check session first (fast in-memory check)
        const hasWalletInSession = sessionService.hasWallet(platformUser);
        
        if (hasWalletInSession) {
            return { hasWallet: true, platformUser };
        }

        // Check database for actual wallets
        try {
            const wallets = await this.walletService.getUserWallets(platformUser);
            const hasWallet = wallets.length > 0;
            
            // Update session with current wallet status
            if (hasWallet) {
                const activeWallet = wallets.find(w => w.isActive) || wallets[0];
                sessionService.updateWalletStatus(platformUser, true, activeWallet!.id);
            }

            return { hasWallet, platformUser };
        } catch (error) {
            console.error('Error checking wallet status:', error);
            if (callback) {
                callback({
                    text: "❌ Error checking wallet status. Please try again."
                });
            }
            return null;
        }
    }

    /**
     * Enforce wallet requirement for transaction actions
     */
    public static async enforceWalletRequired(
        runtime: IAgentRuntime,
        message: Memory,
        callback?: HandlerCallback
    ): Promise<{ platformUser: PlatformUser; activeWalletId: string } | null> {
        
        const result = await this.checkWalletRequired(runtime, message, callback);
        
        if (!result) {
            return null;
        }

        const { hasWallet, platformUser } = result;

        if (!hasWallet) {
            if (callback) {
                callback({
                    text: sessionService.getWalletRequiredMessage()
                });
            }
            return null;
        }

        // Get active wallet ID
        const session = sessionService.getSession(platformUser);
        const activeWalletId = session.activeWalletId;

        if (!activeWalletId) {
            if (callback) {
                callback({
                    text: `⚠️ **Wallet Status Issue**

Your wallet status is inconsistent. Please run:
• "List wallets" - to check your wallets
• "Switch to [wallet name]" - to activate a wallet

Or create a new wallet if needed.`
                });
            }
            return null;
        }

        return { platformUser, activeWalletId };
    }



    /**
     * Get wallet guard status message
     */
    public static getWalletGuardMessage(action: string): string {
        return `🔒 **Wallet Required for ${action}**

${sessionService.getWalletRequiredMessage()}

**Why This Matters:**
• Real transactions require real wallets
• Your funds are secured with AES-256 encryption
• Multi-platform support with isolated accounts
• Full control over your private keys

**Next Steps:**
1. Create or import a wallet
2. Fund it with some PLS for gas fees
3. Start trading with confidence

Ready to set up your wallet? 🚀`;
    }

    /**
     * Validate transaction parameters
     */
    public static validateTransactionParams(params: {
        fromToken?: string;
        toToken?: string;
        amount?: string;
    }): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!params.fromToken) {
            errors.push("Source token is required");
        }

        if (!params.toToken) {
            errors.push("Destination token is required");
        }

        if (!params.amount) {
            errors.push("Amount is required");
        } else {
            const amount = parseFloat(params.amount);
            if (isNaN(amount) || amount <= 0) {
                errors.push("Amount must be a positive number");
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

/**
 * Action types that require wallets
 */
export const WALLET_REQUIRED_ACTIONS = [
    'EXECUTE_SWAP',
    'ADD_LIQUIDITY',
    'REMOVE_LIQUIDITY',
    'ADVANCED_ORDERS',
    'TOKEN_ALLOWANCE',
    'TRANSACTION_HISTORY'
];

/**
 * Action types that don't require wallets (read-only)
 */
export const WALLET_NOT_REQUIRED_ACTIONS = [
    'GET_PRICE',
    'QUERY_POOLS',
    'DEFI_ANALYTICS',
    'GAS_PRICE'
];

/**
 * Check if action requires wallet
 */
export function actionRequiresWallet(actionName: string): boolean {
    return WALLET_REQUIRED_ACTIONS.includes(actionName);
}

/**
 * Decorator for actions that require wallets
 */
export function requiresWallet(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function(...args: any[]) {
        const [runtime, message, state, options, callback] = args;
        
        const walletCheck = await WalletGuard.enforceWalletRequired(runtime, message, callback);
        if (!walletCheck) {
            return false;
        }

        // Add wallet info to options for the action
        const enhancedOptions = {
            ...options,
            walletInfo: walletCheck
        };

        return method.apply(this, [runtime, message, state, enhancedOptions, callback]);
    };

    return descriptor;
} 