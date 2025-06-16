import { GraphQLClient, gql } from 'graphql-request';
import { EventEmitter } from 'events';
import { logInfo, logError, logWarn } from './logger.js';
import { cleanupManager } from '../utils/cleanupManager.js';

interface PriceAlert {
    id: string;
    token: string;
    targetPrice: number;
    condition: 'above' | 'below';
    callback: (currentPrice: number) => void;
    created: Date;
    active: boolean;
}

export class PriceMonitorService extends EventEmitter {
    private alerts: Map<string, PriceAlert> = new Map();
    private priceCache: Map<string, number> = new Map();
    private subgraphClient: GraphQLClient;
    private monitoringInterval: NodeJS.Timeout | null = null;
    private readonly POLL_INTERVAL = 60000; // 1 minute

    constructor() {
        super();
        this.subgraphClient = new GraphQLClient("https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest");
        
        // Register cleanup task
        cleanupManager.registerCleanup(
            'priceMonitor',
            'PriceMonitor cleanup',
            () => this.destroy(),
            200 // Medium priority
        );
    }

    /**
     * Add a price alert for monitoring
     */
    addAlert(alert: Omit<PriceAlert, 'id' | 'created'>): string {
        const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const fullAlert: PriceAlert = {
            ...alert,
            id,
            created: new Date(),
        };

        this.alerts.set(id, fullAlert);
        
        // Start monitoring if this is the first alert
        if (this.alerts.size === 1) {
            this.startMonitoring();
        }

        logInfo(`📋 Price alert added: ${alert.token} ${alert.condition} $${alert.targetPrice}`);
        return id;
    }

    /**
     * Remove a price alert
     */
    removeAlert(alertId: string): boolean {
        const removed = this.alerts.delete(alertId);
        
        // Stop monitoring if no alerts remain
        if (this.alerts.size === 0) {
            this.stopMonitoring();
        }

        return removed;
    }

    /**
     * Get all active alerts
     */
    getAlerts(): PriceAlert[] {
        return Array.from(this.alerts.values());
    }

    /**
     * Start the monitoring service
     */
    private startMonitoring(): void {
        if (this.monitoringInterval) return;

        logInfo('🚀 Starting price monitoring service...');
        
        this.monitoringInterval = cleanupManager.trackInterval(
            setInterval(async () => {
                await this.checkPrices();
            }, this.POLL_INTERVAL),
            'PriceMonitor polling interval'
        );

        // Initial check
        this.checkPrices();
    }

    /**
     * Stop the monitoring service
     */
    private stopMonitoring(): void {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            logInfo('⏹️ Price monitoring service stopped');
        }
    }

    /**
     * Check current prices and trigger alerts
     */
    private async checkPrices(): Promise<void> {
        try {
            const uniqueTokens = [...new Set(Array.from(this.alerts.values()).map(alert => alert.token))];
            
            for (const token of uniqueTokens) {
                const currentPrice = await this.fetchTokenPrice(token);
                
                if (currentPrice !== null) {
                    this.priceCache.set(token, currentPrice);
                    await this.checkAlertsForToken(token, currentPrice);
                }
            }
        } catch (error) {
            logError(error as Error, { context: 'Error checking prices' });
            this.emit('error', error);
        }
    }

    /**
     * Fetch current price for a token from subgraph
     */
    private async fetchTokenPrice(token: string): Promise<number | null> {
        try {
            // This would need to be adapted based on actual token addresses
            const tokenAddresses = {
                'HEX': '0x2b591e99afE9f32eAA6214f7B7629768c40Eeb39',
                'PLS': '0x70499adEBB11Efd915E3b69E700c331778628707', // WPLS
                'PLSX': '0x95B303987A60C71504D99Aa1b13B4DA07b0790ab',
                'USDC': '0x15D38573d2feeb82e7ad5187aB8c1D52'
            };

            const tokenAddress = tokenAddresses[token as keyof typeof tokenAddresses];
            if (!tokenAddress) return null;

            const query = gql`
                query GetTokenPrice($tokenAddress: String!) {
                    token(id: $tokenAddress) {
                        derivedETH
                        symbol
                    }
                    bundle(id: "1") {
                        ethPriceUSD
                    }
                }
            `;

            const result = await this.subgraphClient.request(query, { tokenAddress: tokenAddress.toLowerCase() }) as any;
            
            if (result.token && result.bundle) {
                const priceInETH = parseFloat(result.token.derivedETH);
                const ethPriceUSD = parseFloat(result.bundle.ethPriceUSD);
                return priceInETH * ethPriceUSD;
            }

            return null;
        } catch (error) {
            logError(error as Error, { context: `Error fetching price for ${token}` });
            return null;
        }
    }

    /**
     * Check alerts for a specific token
     */
    private async checkAlertsForToken(token: string, currentPrice: number): Promise<void> {
        const tokenAlerts = Array.from(this.alerts.values()).filter(alert => 
            alert.token === token && alert.active
        );

        for (const alert of tokenAlerts) {
            let triggered = false;

            if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
                triggered = true;
            } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
                triggered = true;
            }

            if (triggered) {
                logWarn(`🚨 PRICE ALERT TRIGGERED: ${token} ${alert.condition} $${alert.targetPrice} (current: $${currentPrice.toFixed(6)})`);
                
                // Trigger the callback
                try {
                    alert.callback(currentPrice);
                } catch (error) {
                    logError(error as Error, { context: 'Error executing alert callback' });
                }

                // Emit event
                this.emit('alertTriggered', {
                    alert,
                    currentPrice,
                    triggeredAt: new Date()
                });

                // Deactivate the alert (one-time trigger)
                alert.active = false;
            }
        }

        // Clean up inactive alerts
        for (const [id, alert] of this.alerts.entries()) {
            if (!alert.active) {
                this.alerts.delete(id);
            }
        }

        // Stop monitoring if no active alerts
        if (this.alerts.size === 0) {
            this.stopMonitoring();
        }
    }

    /**
     * Get cached price for a token
     */
    getCachedPrice(token: string): number | null {
        return this.priceCache.get(token) || null;
    }

    /**
     * Cleanup and stop monitoring
     */
    destroy(): void {
        this.stopMonitoring();
        this.alerts.clear();
        this.priceCache.clear();
        this.removeAllListeners();
    }
}

// Global instance
export const priceMonitor = new PriceMonitorService();

// Example usage:
/*
priceMonitor.addAlert({
    token: 'HEX',
    targetPrice: 0.005,
    condition: 'below',
    active: true,
    callback: (price) => {
        console.log(`🔔 HEX hit $${price}! Time to buy!`);
        // Send notification, execute trade, etc.
    }
});
*/ 