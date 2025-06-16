import { metricsCollector, RealtimeMetrics, UserInsights, PerformanceMetrics } from './metricsCollector.js';
import { healthChecker, SystemHealth } from './healthChecker.js';

export interface DashboardData {
    timestamp: Date;
    systemHealth: SystemHealth;
    realtimeMetrics: RealtimeMetrics;
    userInsights: UserInsights;
    performanceMetrics: PerformanceMetrics;
    alerts: DashboardAlert[];
}

export interface DashboardAlert {
    id: string;
    level: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: Date;
    resolved: boolean;
}

export class MonitoringDashboard {
    private dashboardData: DashboardData | null = null;
    private alerts: DashboardAlert[] = [];
    private updateInterval: NodeJS.Timeout | null = null;
    private subscribers: Set<(data: DashboardData) => void> = new Set();

    constructor() {
        this.startDashboardUpdates();
        console.log('📊 MonitoringDashboard initialized');
    }

    /**
     * Get current dashboard data
     */
    async getDashboardData(): Promise<DashboardData> {
        if (!this.dashboardData) {
            await this.updateDashboardData();
        }
        return this.dashboardData!;
    }

    /**
     * Subscribe to dashboard updates
     */
    subscribe(callback: (data: DashboardData) => void): () => void {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Get formatted console dashboard
     */
    async getConsoleDashboard(): Promise<string> {
        const data = await this.getDashboardData();
        
        return `
╔══════════════════════════════════════════════════════════════╗
║                    🚀 ELIZAOS DEX AGENT DASHBOARD            ║
║                        ${new Date().toLocaleString()}                     ║
╠══════════════════════════════════════════════════════════════╣
║ 🏥 SYSTEM HEALTH                                             ║
║   Overall Status: ${this.getHealthIcon(data.systemHealth.overall)} ${data.systemHealth.overall.toUpperCase()}   ║
║   Database: ${this.getHealthIcon(data.systemHealth.services.database.status)} ${data.systemHealth.services.database.status}      ║
║   Memory: ${this.getHealthIcon(data.systemHealth.services.memory.status)} ${data.systemHealth.services.memory.percentage.toFixed(1)}% used   ║
║   APIs: ${this.getHealthIcon(data.systemHealth.services.externalAPIs.status)} ${data.systemHealth.services.externalAPIs.details}    ║
╠══════════════════════════════════════════════════════════════╣
║ 📊 REAL-TIME METRICS                                         ║
║   Active Users: ${data.realtimeMetrics.activeUsers.toString().padStart(8)} users          ║
║   Transactions/Min: ${data.realtimeMetrics.transactionsPerMinute.toString().padStart(4)} tx/min     ║
║   Avg Response: ${data.realtimeMetrics.averageResponseTime.toFixed(0).padStart(6)}ms            ║
║   Error Rate: ${(data.realtimeMetrics.errorRate * 100).toFixed(2).padStart(6)}%              ║
║   Memory Usage: ${(data.realtimeMetrics.memoryUsage / 1024 / 1024).toFixed(1).padStart(6)}MB             ║
║   Uptime: ${this.formatUptime(data.realtimeMetrics.uptime).padStart(10)}                    ║
╠══════════════════════════════════════════════════════════════╣
║ 👥 USER INSIGHTS                                             ║
║   Total Users: ${data.userInsights.totalUsers.toString().padStart(9)} users          ║
║   New Today: ${data.userInsights.newUsersToday.toString().padStart(11)} users          ║
║   Active Today: ${data.userInsights.activeUsersToday.toString().padStart(8)} users          ║
║   Retention Rate: ${(data.userInsights.userRetentionRate * 100).toFixed(1).padStart(5)}%            ║
╠══════════════════════════════════════════════════════════════╣
║ 🔥 POPULAR ACTIONS (Last Hour)                               ║
${this.formatPopularActions(data.realtimeMetrics.popularActions)}
╠══════════════════════════════════════════════════════════════╣
║ 🌐 PLATFORM BREAKDOWN                                        ║
${this.formatPlatformBreakdown(data.realtimeMetrics.platformBreakdown)}
╠══════════════════════════════════════════════════════════════╣
║ ⚠️  ACTIVE ALERTS                                            ║
${this.formatAlerts(data.alerts)}
╚══════════════════════════════════════════════════════════════╝
        `.trim();
    }

    /**
     * Get simplified status for health monitoring
     */
    async getHealthStatus(): Promise<{
        status: string;
        message: string;
        details: any;
    }> {
        const health = await healthChecker.runHealthChecks();
        const metrics = metricsCollector.getRealtimeStats();
        
        return {
            status: health.overall,
            message: this.getHealthMessage(health.overall),
            details: {
                activeUsers: metrics.activeUsers,
                errorRate: metrics.errorRate,
                memoryUsage: (metrics.memoryUsage / 1024 / 1024).toFixed(1) + 'MB',
                uptime: this.formatUptime(metrics.uptime)
            }
        };
    }

    /**
     * Add alert to dashboard
     */
    addAlert(level: 'info' | 'warning' | 'critical', message: string): void {
        const alert: DashboardAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            level,
            message,
            timestamp: new Date(),
            resolved: false
        };

        this.alerts.unshift(alert);
        
        // Keep only last 10 alerts
        if (this.alerts.length > 10) {
            this.alerts = this.alerts.slice(0, 10);
        }

        // Auto-resolve info alerts after 5 minutes
        if (level === 'info') {
            setTimeout(() => {
                this.resolveAlert(alert.id);
            }, 5 * 60 * 1000);
        }

        console.log(`🚨 [${level.toUpperCase()}] ${message}`);
    }

    /**
     * Resolve an alert
     */
    resolveAlert(alertId: string): void {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.resolved = true;
        }
    }

    /**
     * Get metrics for specific time range
     */
    getMetricsHistory(hours: number = 24): any[] {
        // This would return historical metrics if we had storage
        // For now, return current metrics as example
        return [{
            timestamp: new Date(),
            metrics: this.dashboardData?.realtimeMetrics || null
        }];
    }

    /**
     * Print dashboard to console
     */
    async printDashboard(): Promise<void> {
        const dashboard = await this.getConsoleDashboard();
        console.clear();
        console.log(dashboard);
    }

    /**
     * Start automatic dashboard updates
     */
    private startDashboardUpdates(): void {
        // Update dashboard every 10 seconds
        this.updateInterval = setInterval(async () => {
            try {
                await this.updateDashboardData();
                this.notifySubscribers();
            } catch (error) {
                console.error('Dashboard update failed:', error);
            }
        }, 10000);

        // Initial update
        this.updateDashboardData();
    }

    /**
     * Update dashboard data
     */
    private async updateDashboardData(): Promise<void> {
        try {
            const [systemHealth, realtimeMetrics, userInsights, performanceMetrics] = await Promise.all([
                healthChecker.runHealthChecks(),
                Promise.resolve(metricsCollector.getRealtimeStats()),
                Promise.resolve(metricsCollector.getUserBehaviorInsights()),
                Promise.resolve(metricsCollector.getSystemPerformance())
            ]);

            this.dashboardData = {
                timestamp: new Date(),
                systemHealth,
                realtimeMetrics,
                userInsights,
                performanceMetrics,
                alerts: this.alerts.filter(a => !a.resolved)
            };

            // Check for new alerts based on metrics
            this.checkForAlerts();

        } catch (error) {
            console.error('Failed to update dashboard data:', error);
        }
    }

    /**
     * Check metrics for alert conditions
     */
    private checkForAlerts(): void {
        if (!this.dashboardData) return;

        const { systemHealth, realtimeMetrics, performanceMetrics } = this.dashboardData;

        // Health alerts
        if (systemHealth.overall === 'critical') {
            this.addAlert('critical', 'System health is CRITICAL - immediate attention required');
        } else if (systemHealth.overall === 'degraded') {
            this.addAlert('warning', 'System health is DEGRADED - monitoring required');
        }

        // Performance alerts
        if (realtimeMetrics.errorRate > 0.05) { // 5% error rate
            this.addAlert('warning', `High error rate: ${(realtimeMetrics.errorRate * 100).toFixed(2)}%`);
        }

        if (realtimeMetrics.averageResponseTime > 1000) { // 1 second
            this.addAlert('warning', `Slow response time: ${realtimeMetrics.averageResponseTime.toFixed(0)}ms`);
        }

        // Memory alerts
        if (performanceMetrics.memoryUsage.percentage > 90) {
            this.addAlert('critical', `Critical memory usage: ${performanceMetrics.memoryUsage.percentage.toFixed(1)}%`);
        } else if (performanceMetrics.memoryUsage.percentage > 75) {
            this.addAlert('warning', `High memory usage: ${performanceMetrics.memoryUsage.percentage.toFixed(1)}%`);
        }
    }

    /**
     * Notify all subscribers of data updates
     */
    private notifySubscribers(): void {
        if (this.dashboardData) {
            this.subscribers.forEach(callback => {
                try {
                    callback(this.dashboardData!);
                } catch (error) {
                    console.error('Dashboard subscriber error:', error);
                }
            });
        }
    }

    // Utility formatting methods
    private getHealthIcon(status: string): string {
        switch (status) {
            case 'healthy': return '✅';
            case 'degraded': return '⚠️';
            case 'critical': return '🔴';
            default: return '❓';
        }
    }

    private getHealthMessage(status: string): string {
        switch (status) {
            case 'healthy': return 'All systems operational';
            case 'degraded': return 'Some services experiencing issues';
            case 'critical': return 'Critical system issues detected';
            default: return 'Unknown system status';
        }
    }

    private formatUptime(uptime: number): string {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    private formatPopularActions(actions: any[]): string {
        if (actions.length === 0) {
            return '║   No actions recorded yet                                   ║';
        }

        return actions.slice(0, 5).map(action => 
            `║   ${action.action.padEnd(20)} ${action.count.toString().padStart(4)} calls ${action.averageTime.toFixed(0).padStart(4)}ms avg ║`
        ).join('\n');
    }

    private formatPlatformBreakdown(platforms: any[]): string {
        if (platforms.length === 0) {
            return '║   No platform data available                                ║';
        }

        return platforms.map(platform => 
            `║   ${platform.platform.padEnd(12)} ${platform.activeUsers.toString().padStart(4)} users ${platform.totalActions.toString().padStart(5)} actions ║`
        ).join('\n');
    }

    private formatAlerts(alerts: DashboardAlert[]): string {
        const activeAlerts = alerts.filter(a => !a.resolved);
        
        if (activeAlerts.length === 0) {
            return '║   No active alerts - all systems normal! 🎉               ║';
        }

        return activeAlerts.slice(0, 3).map(alert => {
            const icon = alert.level === 'critical' ? '🔴' : alert.level === 'warning' ? '⚠️' : 'ℹ️';
            const message = alert.message.length > 45 ? alert.message.substring(0, 42) + '...' : alert.message;
            return `║   ${icon} ${message.padEnd(50)} ║`;
        }).join('\n');
    }

    /**
     * Cleanup when shutting down
     */
    stop(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('📊 MonitoringDashboard stopped');
    }
}

// Singleton instance
export const monitoringDashboard = new MonitoringDashboard(); 