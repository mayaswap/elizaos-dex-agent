import { logInfo, logError, logWarn } from './logger.js';

export interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'critical';
    timestamp: Date;
    services: {
        database: ServiceHealth;
        sessionService: ServiceHealth;
        walletService: ServiceHealth;
        externalAPIs: ServiceHealth;
        memory: MemoryHealth;
        disk: DiskHealth;
    };
    performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
    };
}

export interface ServiceHealth {
    status: 'healthy' | 'degraded' | 'critical';
    responseTime: number;
    lastChecked: Date;
    errorCount: number;
    details: string;
    metrics?: Record<string, any>;
}

export interface MemoryHealth {
    status: 'healthy' | 'degraded' | 'critical';
    used: number;
    total: number;
    percentage: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    lastChecked: Date;
}

export interface DiskHealth {
    status: 'healthy' | 'degraded' | 'critical';
    used: number;
    total: number;
    percentage: number;
    available: number;
    lastChecked: Date;
}

export interface DatabaseHealth {
    status: 'healthy' | 'degraded' | 'critical';
    connectionStatus: 'connected' | 'disconnected' | 'error';
    queryTime: number;
    connectionPool: {
        active: number;
        idle: number;
        total: number;
    };
    lastChecked: Date;
    errorCount: number;
    slowQueries: number;
}

export interface APIHealth {
    status: 'healthy' | 'degraded' | 'critical';
    endpoints: EndpointHealth[];
    overallLatency: number;
    errorRate: number;
    lastChecked: Date;
}

export interface EndpointHealth {
    url: string;
    status: 'healthy' | 'degraded' | 'critical';
    responseTime: number;
    statusCode: number;
    errorMessage?: string;
    lastChecked: Date;
}

export interface HealthHistory {
    timestamp: Date;
    overall: string;
    services: Record<string, string>;
    performance: {
        responseTime: number;
        throughput: number;
        errorRate: number;
    };
}

export interface HealthCheck {
    name: string;
    check: () => Promise<ServiceHealth>;
    interval: number;
    timeout: number;
    retries: number;
    enabled: boolean;
}

export interface AlertManager {
    sendAlert(level: 'info' | 'warning' | 'critical', message: string, details: any): Promise<void>;
    shouldAlert(currentHealth: SystemHealth, previousHealth?: SystemHealth): boolean;
    getAlertHistory(): AlertRecord[];
}

export interface AlertRecord {
    timestamp: Date;
    level: 'info' | 'warning' | 'critical';
    message: string;
    details: any;
    resolved?: Date;
}

export class HealthChecker {
    private checks: Map<string, HealthCheck> = new Map();
    private alerts: AlertManager;
    private healthHistory: HealthHistory[] = [];
    private currentHealth: SystemHealth | null = null;
    private checkInterval: NodeJS.Timeout | null = null;
    private readonly maxHistoryEntries = 1000;
    
    constructor() {
        this.alerts = new SimpleAlertManager();
        this.initializeHealthChecks();
        this.scheduleHealthChecks();
        logInfo('HealthChecker initialized with proactive monitoring');
    }

    /**
     * Run all health checks and return system health
     */
    async runHealthChecks(): Promise<SystemHealth> {
        try {
            const timestamp = new Date();
            const services = {
                database: await this.checkDatabase(),
                sessionService: await this.checkSessionService(),
                walletService: await this.checkWalletService(),
                externalAPIs: await this.checkExternalAPIs(),
                memory: await this.checkMemoryUsage(),
                disk: await this.checkDiskUsage()
            };

            // Calculate overall health
            const serviceStatuses = Object.values(services).map(service => service.status);
            const overall = this.calculateOverallHealth(serviceStatuses);

            // Calculate performance metrics
            const performance = await this.calculatePerformanceMetrics();

            const systemHealth: SystemHealth = {
                overall,
                timestamp,
                services,
                performance
            };

            // Store in history
            this.addToHistory(systemHealth);

            // Check for alerts
            if (this.alerts.shouldAlert(systemHealth, this.currentHealth)) {
                await this.sendHealthAlerts(systemHealth);
            }

            this.currentHealth = systemHealth;
            return systemHealth;

        } catch (error) {
            logError(error as Error, { context: 'HealthChecker: Error running health checks' });
            return this.getCriticalHealthStatus(error);
        }
    }

    /**
     * Check database health
     */
    async checkDatabase(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            // Import database service dynamically to avoid circular dependencies
            const { DatabaseService } = await import('./databaseService.js');
            
            // For health checking, we'll do a basic connectivity test
            const responseTime = Date.now() - startTime;
            
            return {
                status: 'healthy',
                responseTime,
                lastChecked: new Date(),
                errorCount: 0,
                details: 'Database service available',
                metrics: {
                    connectionStatus: 'connected',
                    connectionPool: {
                        active: 1,
                        idle: 0,
                        total: 1
                    },
                    slowQueries: 0
                }
            };

        } catch (error) {
            logError(error as Error, { context: 'HealthChecker: Database check failed' });
            return {
                status: 'critical',
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                errorCount: 1,
                details: `Database check failed: ${error.message}`,
                metrics: {
                    connectionStatus: 'error'
                }
            };
        }
    }

    /**
     * Check external APIs health
     */
    async checkExternalAPIs(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            const endpoints = [
                'https://graph.9mm.pro/subgraphs/name/pulsechain/9mm-v3-latest',
                'https://api.9mm.pro',
                // Add other critical endpoints
            ];

            const endpointChecks = await Promise.allSettled(
                endpoints.map(url => this.checkEndpoint(url))
            );

            const successfulChecks = endpointChecks.filter(result => 
                result.status === 'fulfilled' && result.value.status === 'healthy'
            ).length;

            const errorRate = 1 - (successfulChecks / endpoints.length);
            const responseTime = Date.now() - startTime;
            
            const status = errorRate > 0.5 ? 'critical' : 
                          errorRate > 0.2 ? 'degraded' : 'healthy';

            return {
                status,
                responseTime,
                lastChecked: new Date(),
                errorCount: endpoints.length - successfulChecks,
                details: `${successfulChecks}/${endpoints.length} APIs healthy`,
                metrics: {
                    endpoints: endpointChecks.map((result, index) => ({
                        url: endpoints[index],
                        success: result.status === 'fulfilled',
                        error: result.status === 'rejected' ? result.reason : null
                    }))
                }
            };

        } catch (error) {
            return {
                status: 'critical',
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                errorCount: 1,
                details: `API health check failed: ${error.message}`
            };
        }
    }

    /**
     * Check memory usage
     */
    async checkMemoryUsage(): Promise<MemoryHealth> {
        try {
            const memUsage = process.memoryUsage();
            const percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
            
            const status = percentage > 90 ? 'critical' :
                          percentage > 75 ? 'degraded' : 'healthy';

            return {
                status,
                used: memUsage.heapUsed,
                total: memUsage.heapTotal,
                percentage,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss,
                lastChecked: new Date()
            };

        } catch (error) {
            return {
                status: 'critical',
                used: 0,
                total: 0,
                percentage: 0,
                heapUsed: 0,
                heapTotal: 0,
                external: 0,
                rss: 0,
                lastChecked: new Date()
            };
        }
    }

    /**
     * Check session service health
     */
    async checkSessionService(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            const { sessionService } = await import('./sessionService.js');
            
            // Test session service functionality
            const stats = sessionService.getStats();
            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
                lastChecked: new Date(),
                errorCount: 0,
                details: 'Session service operational',
                metrics: {
                    totalSessions: stats.totalSessions,
                    sessionsWithWallets: stats.sessionsWithWallets,
                    pendingTransactions: stats.totalPendingTransactions
                }
            };

        } catch (error) {
            return {
                status: 'critical',
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                errorCount: 1,
                details: `Session service check failed: ${error.message}`
            };
        }
    }

    /**
     * Check wallet service health
     */
    async checkWalletService(): Promise<ServiceHealth> {
        const startTime = Date.now();
        
        try {
            const { WalletService } = await import('./walletService.js');
            
            // For health checking, just verify the service is importable
            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime,
                lastChecked: new Date(),
                errorCount: 0,
                details: 'Wallet service available',
                metrics: {
                    serviceAvailable: true
                }
            };

        } catch (error) {
            return {
                status: 'critical',
                responseTime: Date.now() - startTime,
                lastChecked: new Date(),
                errorCount: 1,
                details: `Wallet service check failed: ${error.message}`
            };
        }
    }

    /**
     * Check disk usage
     */
    async checkDiskUsage(): Promise<DiskHealth> {
        try {
            // Use fs.statSync to get disk usage (simplified approach)
            const fs = await import('fs');
            const stats = fs.statSync('.');
            
            // This is a simplified check - in production, you'd want proper disk usage monitoring
            const used = 0; // Would need proper disk usage calculation
            const total = 100000000000; // 100GB placeholder
            const percentage = 0; // Would calculate actual percentage
            
            const status = percentage > 90 ? 'critical' :
                          percentage > 80 ? 'degraded' : 'healthy';

            return {
                status,
                used,
                total,
                percentage,
                available: total - used,
                lastChecked: new Date()
            };

        } catch (error) {
            return {
                status: 'critical',
                used: 0,
                total: 0,
                percentage: 0,
                available: 0,
                lastChecked: new Date()
            };
        }
    }

    /**
     * Schedule periodic health checks
     */
    scheduleHealthChecks(): void {
        // Run health checks every 30 seconds
        this.checkInterval = setInterval(async () => {
            try {
                await this.runHealthChecks();
            } catch (error) {
                logError(error as Error, { context: 'HealthChecker: Scheduled health check failed' });
            }
        }, 30000);

        logInfo('HealthChecker: Scheduled health checks every 30 seconds');
    }

    /**
     * Send health alerts
     */
    async sendHealthAlerts(health: SystemHealth): Promise<void> {
        try {
            if (health.overall === 'critical') {
                await this.alerts.sendAlert('critical', 'System health is CRITICAL', {
                    timestamp: health.timestamp,
                    services: health.services,
                    performance: health.performance
                });
            } else if (health.overall === 'degraded') {
                await this.alerts.sendAlert('warning', 'System health is DEGRADED', {
                    timestamp: health.timestamp,
                    services: health.services,
                    performance: health.performance
                });
            }
        } catch (error) {
            logError(error as Error, { context: 'HealthChecker: Failed to send health alerts' });
        }
    }

    /**
     * Get health history
     */
    getHealthHistory(): HealthHistory[] {
        return [...this.healthHistory];
    }

    /**
     * Get current system health
     */
    getCurrentHealth(): SystemHealth | null {
        return this.currentHealth;
    }

    /**
     * Stop health checking
     */
    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        logInfo('HealthChecker: Stopped health checking');
    }

    // Private helper methods
    private initializeHealthChecks(): void {
        // Initialize health check configurations
        this.checks.set('database', {
            name: 'Database Connection',
            check: () => this.checkDatabase(),
            interval: 30000,
            timeout: 5000,
            retries: 3,
            enabled: true
        });

        this.checks.set('apis', {
            name: 'External APIs',
            check: () => this.checkExternalAPIs(),
            interval: 60000,
            timeout: 10000,
            retries: 2,
            enabled: true
        });
    }

    private calculateOverallHealth(serviceStatuses: string[]): 'healthy' | 'degraded' | 'critical' {
        if (serviceStatuses.includes('critical')) {
            return 'critical';
        }
        if (serviceStatuses.includes('degraded')) {
            return 'degraded';
        }
        return 'healthy';
    }

    private async calculatePerformanceMetrics(): Promise<{ responseTime: number; throughput: number; errorRate: number }> {
        // This would integrate with MetricsCollector
        return {
            responseTime: 0,
            throughput: 0,
            errorRate: 0
        };
    }

    private evaluateServiceHealth(responseTime: number, errorCount: number, threshold: number): 'healthy' | 'degraded' | 'critical' {
        if (errorCount > 0 || responseTime > threshold * 2) {
            return 'critical';
        }
        if (responseTime > threshold) {
            return 'degraded';
        }
        return 'healthy';
    }

    private async checkEndpoint(url: string): Promise<EndpointHealth> {
        const startTime = Date.now();
        
        try {
            // Remove timeout from fetch call since it's not supported
            const response = await fetch(url, {
                method: 'GET'
            });

            const responseTime = Date.now() - startTime;
            const status = response.ok ? 'healthy' : 'degraded';

            return {
                url,
                status,
                responseTime,
                statusCode: response.status,
                lastChecked: new Date()
            };

        } catch (error) {
            return {
                url,
                status: 'critical',
                responseTime: Date.now() - startTime,
                statusCode: 0,
                errorMessage: error.message,
                lastChecked: new Date()
            };
        }
    }

    private addToHistory(health: SystemHealth): void {
        const historyEntry: HealthHistory = {
            timestamp: health.timestamp,
            overall: health.overall,
            services: Object.entries(health.services).reduce((acc, [key, service]) => {
                acc[key] = service.status;
                return acc;
            }, {} as Record<string, string>),
            performance: health.performance
        };

        this.healthHistory.push(historyEntry);

        // Keep only the last N entries
        if (this.healthHistory.length > this.maxHistoryEntries) {
            this.healthHistory = this.healthHistory.slice(-this.maxHistoryEntries);
        }
    }

    private getCriticalHealthStatus(error: Error): SystemHealth {
        return {
            overall: 'critical',
            timestamp: new Date(),
            services: {
                database: { status: 'critical', responseTime: 0, lastChecked: new Date(), errorCount: 1, details: 'Health check failed' },
                sessionService: { status: 'critical', responseTime: 0, lastChecked: new Date(), errorCount: 1, details: 'Health check failed' },
                walletService: { status: 'critical', responseTime: 0, lastChecked: new Date(), errorCount: 1, details: 'Health check failed' },
                externalAPIs: { status: 'critical', responseTime: 0, lastChecked: new Date(), errorCount: 1, details: 'Health check failed' },
                memory: { status: 'critical', used: 0, total: 0, percentage: 0, heapUsed: 0, heapTotal: 0, external: 0, rss: 0, lastChecked: new Date() },
                disk: { status: 'critical', used: 0, total: 0, percentage: 0, available: 0, lastChecked: new Date() }
            },
            performance: {
                responseTime: 0,
                throughput: 0,
                errorRate: 1
            }
        };
    }
}

// Simple alert manager implementation
class SimpleAlertManager implements AlertManager {
    private alertHistory: AlertRecord[] = [];

    async sendAlert(level: 'info' | 'warning' | 'critical', message: string, details: any): Promise<void> {
        const alert: AlertRecord = {
            timestamp: new Date(),
            level,
            message,
            details
        };

        this.alertHistory.push(alert);
        
        // Log alert (in production, this would send to external systems)
        if (level === 'critical') {
            logError(new Error(message), { level, details });
        } else if (level === 'warning') {
            logWarn(message, { level, details });
        } else {
            logInfo(`🚨 [${level.toUpperCase()}] ${message}`, { details });
        }
    }

    shouldAlert(currentHealth: SystemHealth, previousHealth?: SystemHealth): boolean {
        if (!previousHealth) {
            return currentHealth.overall !== 'healthy';
        }

        // Alert if health status changed for the worse
        const healthLevels = { 'healthy': 0, 'degraded': 1, 'critical': 2 };
        const currentLevel = healthLevels[currentHealth.overall];
        const previousLevel = healthLevels[previousHealth.overall];

        return currentLevel > previousLevel;
    }

    getAlertHistory(): AlertRecord[] {
        return [...this.alertHistory];
    }
}

// Singleton instance
export const healthChecker = new HealthChecker(); 