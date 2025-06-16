export interface MetricEvent {
    type: 'user_action' | 'system_event' | 'error' | 'performance';
    category: string;
    action: string;
    user?: PlatformUser;
    data: any;
    timestamp: number;
}

export interface PlatformUser {
    id: string;
    platform: 'telegram' | 'discord' | 'web' | 'api';
    userId: string;
}

export interface MetricEntry {
    event: MetricEvent;
    processingTime?: number;
    memoryUsage?: number;
    correlationId?: string;
}

export interface AggregatedMetric {
    key: string;
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
    lastUpdated: Date;
    percentiles: {
        p50: number;
        p95: number;
        p99: number;
    };
}

export interface RealtimeMetrics {
    activeUsers: number;
    transactionsPerMinute: number;
    errorRate: number;
    averageResponseTime: number;
    popularActions: ActionCount[];
    platformBreakdown: PlatformStats[];
    memoryUsage: number;
    uptime: number;
}

export interface ActionCount {
    action: string;
    count: number;
    averageTime: number;
    errorRate: number;
}

export interface PlatformStats {
    platform: string;
    activeUsers: number;
    totalActions: number;
    errorCount: number;
    averageResponseTime: number;
}

export interface UserInsights {
    totalUsers: number;
    newUsersToday: number;
    activeUsersToday: number;
    userRetentionRate: number;
    mostActiveUsers: UserActivity[];
    commonUserJourneys: UserJourney[];
    platformPreferences: PlatformPreference[];
}

export interface UserActivity {
    userId: string;
    platform: string;
    actionCount: number;
    lastActivity: Date;
    favoriteActions: string[];
}

export interface UserJourney {
    sequence: string[];
    frequency: number;
    averageTime: number;
    successRate: number;
}

export interface PlatformPreference {
    platform: string;
    userCount: number;
    averageActionsPerUser: number;
    retentionRate: number;
}

export interface PerformanceMetrics {
    systemLoad: number;
    memoryUsage: {
        used: number;
        total: number;
        percentage: number;
    };
    responseTime: {
        average: number;
        p50: number;
        p95: number;
        p99: number;
    };
    errorRate: number;
    throughput: number;
    databasePerformance: {
        queryTime: number;
        connectionPool: number;
        slowQueries: number;
    };
}

export class MetricsCollector {
    private metrics: Map<string, MetricEntry[]> = new Map();
    private aggregations: Map<string, AggregatedMetric> = new Map();
    private activeUsers: Set<string> = new Set();
    private startTime: Date = new Date();
    
    // Sliding window for recent metrics (last hour)
    private readonly WINDOW_SIZE = 60 * 60 * 1000; // 1 hour in milliseconds
    private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    
    constructor() {
        // Start periodic cleanup of old metrics
        setInterval(() => this.cleanupOldMetrics(), this.CLEANUP_INTERVAL);
        
        // Initialize system monitoring
        this.startSystemMonitoring();
    }

    /**
     * Track a metric event
     */
    track(event: MetricEvent): void {
        try {
            const entry: MetricEntry = {
                event,
                processingTime: 0,
                memoryUsage: process.memoryUsage().heapUsed,
                correlationId: this.generateCorrelationId()
            };

            const key = `${event.type}:${event.category}:${event.action}`;
            
            if (!this.metrics.has(key)) {
                this.metrics.set(key, []);
            }
            
            this.metrics.get(key)!.push(entry);
            
            // Track active users
            if (event.user) {
                this.activeUsers.add(`${event.user.platform}:${event.user.userId}`);
            }
            
            // Update aggregations
            this.updateAggregations(key, entry);
            
        } catch (error) {
            console.error('MetricsCollector: Error tracking event:', error);
        }
    }

    /**
     * Track timing for operations
     */
    trackTiming(operation: string, duration: number, user?: PlatformUser): void {
        this.track({
            type: 'performance',
            category: 'timing',
            action: operation,
            user,
            data: { duration },
            timestamp: Date.now()
        });
    }

    /**
     * Track errors with context
     */
    trackError(error: Error, context: any, user?: PlatformUser): void {
        this.track({
            type: 'error',
            category: 'system',
            action: 'error_occurred',
            user,
            data: {
                message: error.message,
                stack: error.stack,
                context
            },
            timestamp: Date.now()
        });
    }

    /**
     * Get real-time system statistics
     */
    getRealtimeStats(): RealtimeMetrics {
        try {
            const now = Date.now();
            const oneMinuteAgo = now - (60 * 1000);
            
            // Calculate transactions per minute
            let transactionsLastMinute = 0;
            let errorCount = 0;
            let totalResponseTime = 0;
            let responseTimeCount = 0;
            
            const actionCounts = new Map<string, { count: number; totalTime: number; errors: number }>();
            const platformCounts = new Map<string, { users: Set<string>; actions: number; errors: number; totalTime: number; timeCount: number }>();
            
            for (const [key, entries] of this.metrics) {
                const recentEntries = entries.filter(entry => entry.event.timestamp >= oneMinuteAgo);
                
                for (const entry of recentEntries) {
                    const { event } = entry;
                    
                    if (event.type === 'user_action') {
                        transactionsLastMinute++;
                        
                        // Track by action
                        if (!actionCounts.has(event.action)) {
                            actionCounts.set(event.action, { count: 0, totalTime: 0, errors: 0 });
                        }
                        const actionStat = actionCounts.get(event.action)!;
                        actionStat.count++;
                        
                        if (event.data?.duration) {
                            actionStat.totalTime += event.data.duration;
                            totalResponseTime += event.data.duration;
                            responseTimeCount++;
                        }
                        
                        // Track by platform
                        if (event.user) {
                            const platform = event.user.platform;
                            if (!platformCounts.has(platform)) {
                                platformCounts.set(platform, { 
                                    users: new Set(), 
                                    actions: 0, 
                                    errors: 0, 
                                    totalTime: 0, 
                                    timeCount: 0 
                                });
                            }
                            const platformStat = platformCounts.get(platform)!;
                            platformStat.users.add(`${event.user.platform}:${event.user.userId}`);
                            platformStat.actions++;
                            
                            if (event.data?.duration) {
                                platformStat.totalTime += event.data.duration;
                                platformStat.timeCount++;
                            }
                        }
                    }
                    
                    if (event.type === 'error') {
                        errorCount++;
                        
                        if (event.user) {
                            const platform = event.user.platform;
                            if (platformCounts.has(platform)) {
                                platformCounts.get(platform)!.errors++;
                            }
                        }
                        
                        // Also track errors by action if available
                        if (event.data?.context?.action && actionCounts.has(event.data.context.action)) {
                            actionCounts.get(event.data.context.action)!.errors++;
                        }
                    }
                }
            }
            
            // Build popular actions
            const popularActions: ActionCount[] = Array.from(actionCounts.entries())
                .map(([action, stats]) => ({
                    action,
                    count: stats.count,
                    averageTime: stats.count > 0 ? stats.totalTime / stats.count : 0,
                    errorRate: stats.count > 0 ? stats.errors / stats.count : 0
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            
            // Build platform breakdown
            const platformBreakdown: PlatformStats[] = Array.from(platformCounts.entries())
                .map(([platform, stats]) => ({
                    platform,
                    activeUsers: stats.users.size,
                    totalActions: stats.actions,
                    errorCount: stats.errors,
                    averageResponseTime: stats.timeCount > 0 ? stats.totalTime / stats.timeCount : 0
                }));
            
            return {
                activeUsers: this.activeUsers.size,
                transactionsPerMinute: transactionsLastMinute,
                errorRate: transactionsLastMinute > 0 ? errorCount / transactionsLastMinute : 0,
                averageResponseTime: responseTimeCount > 0 ? totalResponseTime / responseTimeCount : 0,
                popularActions,
                platformBreakdown,
                memoryUsage: process.memoryUsage().heapUsed,
                uptime: Date.now() - this.startTime.getTime()
            };
            
        } catch (error) {
            console.error('MetricsCollector: Error getting realtime stats:', error);
            return this.getEmptyRealtimeStats();
        }
    }

    /**
     * Get user behavior insights
     */
    getUserBehaviorInsights(): UserInsights {
        try {
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            const userActivities = new Map<string, UserActivity>();
            const journeyMap = new Map<string, { frequency: number; totalTime: number; successes: number; total: number }>();
            const platformPrefs = new Map<string, { users: Set<string>; totalActions: number }>();
            
            let newUsersToday = 0;
            const todayUsers = new Set<string>();
            
            for (const [key, entries] of this.metrics) {
                for (const entry of entries) {
                    const { event } = entry;
                    
                    if (event.user && event.type === 'user_action') {
                        const userKey = `${event.user.platform}:${event.user.userId}`;
                        
                        // Track today's active users
                        if (event.timestamp >= oneDayAgo) {
                            todayUsers.add(userKey);
                        }
                        
                        // Build user activity profiles
                        if (!userActivities.has(userKey)) {
                            userActivities.set(userKey, {
                                userId: event.user.userId,
                                platform: event.user.platform,
                                actionCount: 0,
                                lastActivity: new Date(event.timestamp),
                                favoriteActions: []
                            });
                            
                            // Check if this is a new user today
                            if (event.timestamp >= oneDayAgo) {
                                newUsersToday++;
                            }
                        }
                        
                        const userActivity = userActivities.get(userKey)!;
                        userActivity.actionCount++;
                        
                        if (event.timestamp > userActivity.lastActivity.getTime()) {
                            userActivity.lastActivity = new Date(event.timestamp);
                        }
                        
                        // Track platform preferences
                        if (!platformPrefs.has(event.user.platform)) {
                            platformPrefs.set(event.user.platform, { users: new Set(), totalActions: 0 });
                        }
                        const platformPref = platformPrefs.get(event.user.platform)!;
                        platformPref.users.add(userKey);
                        platformPref.totalActions++;
                    }
                }
            }
            
            // Calculate retention rate (users active today who were also active yesterday)
            const yesterdayStart = oneDayAgo - (24 * 60 * 60 * 1000);
            const yesterdayUsers = new Set<string>();
            
            for (const [key, entries] of this.metrics) {
                for (const entry of entries) {
                    if (entry.event.user && 
                        entry.event.timestamp >= yesterdayStart && 
                        entry.event.timestamp < oneDayAgo) {
                        yesterdayUsers.add(`${entry.event.user.platform}:${entry.event.user.userId}`);
                    }
                }
            }
            
            const retentionUsers = Array.from(todayUsers).filter(user => yesterdayUsers.has(user));
            const retentionRate = yesterdayUsers.size > 0 ? retentionUsers.length / yesterdayUsers.size : 0;
            
            // Get most active users
            const mostActiveUsers = Array.from(userActivities.values())
                .sort((a, b) => b.actionCount - a.actionCount)
                .slice(0, 10);
            
            // Build platform preferences
            const platformPreferences: PlatformPreference[] = Array.from(platformPrefs.entries())
                .map(([platform, data]) => ({
                    platform,
                    userCount: data.users.size,
                    averageActionsPerUser: data.users.size > 0 ? data.totalActions / data.users.size : 0,
                    retentionRate: 0 // Would need more sophisticated tracking for accurate retention per platform
                }));
            
            return {
                totalUsers: userActivities.size,
                newUsersToday,
                activeUsersToday: todayUsers.size,
                userRetentionRate: retentionRate,
                mostActiveUsers,
                commonUserJourneys: [], // Would need session tracking for accurate journey mapping
                platformPreferences
            };
            
        } catch (error) {
            console.error('MetricsCollector: Error getting user insights:', error);
            return this.getEmptyUserInsights();
        }
    }

    /**
     * Get system performance metrics
     */
    getSystemPerformance(): PerformanceMetrics {
        try {
            const memUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            
            // Calculate response times from recent performance metrics
            const performanceEntries = this.metrics.get('performance:timing') || [];
            const recentPerformance = performanceEntries
                .filter(entry => entry.event.timestamp >= Date.now() - this.WINDOW_SIZE)
                .map(entry => entry.event.data?.duration || 0);
            
            const responseTimes = recentPerformance.sort((a, b) => a - b);
            const avgResponseTime = responseTimes.length > 0 
                ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
                : 0;
            
            const p50 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.5)] : 0;
            const p95 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.95)] : 0;
            const p99 = responseTimes.length > 0 ? responseTimes[Math.floor(responseTimes.length * 0.99)] : 0;
            
            // Calculate error rate
            const totalActions = this.getTotalRecentActions();
            const totalErrors = this.getTotalRecentErrors();
            const errorRate = totalActions > 0 ? totalErrors / totalActions : 0;
            
            return {
                systemLoad: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
                memoryUsage: {
                    used: memUsage.heapUsed,
                    total: memUsage.heapTotal,
                    percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
                },
                responseTime: {
                    average: avgResponseTime,
                    p50,
                    p95,
                    p99
                },
                errorRate,
                throughput: totalActions / (this.WINDOW_SIZE / 1000 / 60), // Actions per minute
                databasePerformance: {
                    queryTime: 0, // Would need database integration
                    connectionPool: 0, // Would need database integration
                    slowQueries: 0 // Would need database integration
                }
            };
            
        } catch (error) {
            console.error('MetricsCollector: Error getting system performance:', error);
            return this.getEmptyPerformanceMetrics();
        }
    }

    /**
     * Get aggregated metrics for a specific key
     */
    getAggregatedMetric(key: string): AggregatedMetric | null {
        return this.aggregations.get(key) || null;
    }

    /**
     * Get all metric keys
     */
    getMetricKeys(): string[] {
        return Array.from(this.metrics.keys());
    }

    /**
     * Get raw metrics for a specific key
     */
    getRawMetrics(key: string, limit: number = 100): MetricEntry[] {
        const entries = this.metrics.get(key) || [];
        return entries.slice(-limit); // Return most recent entries
    }

    private updateAggregations(key: string, entry: MetricEntry): void {
        if (!this.aggregations.has(key)) {
            this.aggregations.set(key, {
                key,
                count: 0,
                sum: 0,
                average: 0,
                min: Infinity,
                max: -Infinity,
                lastUpdated: new Date(),
                percentiles: { p50: 0, p95: 0, p99: 0 }
            });
        }
        
        const agg = this.aggregations.get(key)!;
        const value = entry.event.data?.duration || entry.event.data?.value || 1;
        
        agg.count++;
        agg.sum += value;
        agg.average = agg.sum / agg.count;
        agg.min = Math.min(agg.min, value);
        agg.max = Math.max(agg.max, value);
        agg.lastUpdated = new Date();
        
        // Update percentiles (simplified - would need proper percentile calculation for accuracy)
        const entries = this.metrics.get(key) || [];
        const values = entries
            .map(e => e.event.data?.duration || e.event.data?.value || 1)
            .sort((a, b) => a - b);
        
        if (values.length > 0) {
            agg.percentiles.p50 = values[Math.floor(values.length * 0.5)];
            agg.percentiles.p95 = values[Math.floor(values.length * 0.95)];
            agg.percentiles.p99 = values[Math.floor(values.length * 0.99)];
        }
    }

    private cleanupOldMetrics(): void {
        const cutoff = Date.now() - this.WINDOW_SIZE;
        
        for (const [key, entries] of this.metrics) {
            const filtered = entries.filter(entry => entry.event.timestamp >= cutoff);
            this.metrics.set(key, filtered);
        }
        
        // Clean up active users (remove users not seen in last hour)
        // This is a simplified approach - in production, you might want more sophisticated user session tracking
        this.activeUsers.clear();
        
        for (const [key, entries] of this.metrics) {
            for (const entry of entries) {
                if (entry.event.user && entry.event.timestamp >= cutoff) {
                    this.activeUsers.add(`${entry.event.user.platform}:${entry.event.user.userId}`);
                }
            }
        }
    }

    private generateCorrelationId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private startSystemMonitoring(): void {
        // Monitor system metrics every minute
        setInterval(() => {
            const memUsage = process.memoryUsage();
            
            this.track({
                type: 'system_event',
                category: 'performance',
                action: 'memory_usage',
                data: {
                    heapUsed: memUsage.heapUsed,
                    heapTotal: memUsage.heapTotal,
                    external: memUsage.external,
                    rss: memUsage.rss
                },
                timestamp: Date.now()
            });
        }, 60000); // Every minute
    }

    private getTotalRecentActions(): number {
        let total = 0;
        const cutoff = Date.now() - this.WINDOW_SIZE;
        
        for (const [key, entries] of this.metrics) {
            if (key.startsWith('user_action:')) {
                total += entries.filter(entry => entry.event.timestamp >= cutoff).length;
            }
        }
        
        return total;
    }

    private getTotalRecentErrors(): number {
        const errorEntries = this.metrics.get('error:system:error_occurred') || [];
        const cutoff = Date.now() - this.WINDOW_SIZE;
        return errorEntries.filter(entry => entry.event.timestamp >= cutoff).length;
    }

    private getEmptyRealtimeStats(): RealtimeMetrics {
        return {
            activeUsers: 0,
            transactionsPerMinute: 0,
            errorRate: 0,
            averageResponseTime: 0,
            popularActions: [],
            platformBreakdown: [],
            memoryUsage: 0,
            uptime: 0
        };
    }

    private getEmptyUserInsights(): UserInsights {
        return {
            totalUsers: 0,
            newUsersToday: 0,
            activeUsersToday: 0,
            userRetentionRate: 0,
            mostActiveUsers: [],
            commonUserJourneys: [],
            platformPreferences: []
        };
    }

    private getEmptyPerformanceMetrics(): PerformanceMetrics {
        return {
            systemLoad: 0,
            memoryUsage: { used: 0, total: 0, percentage: 0 },
            responseTime: { average: 0, p50: 0, p95: 0, p99: 0 },
            errorRate: 0,
            throughput: 0,
            databasePerformance: { queryTime: 0, connectionPool: 0, slowQueries: 0 }
        };
    }
}

// Singleton instance
export const metricsCollector = new MetricsCollector(); 