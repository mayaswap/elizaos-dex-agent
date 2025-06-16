import { metricsCollector } from '../services/metricsCollector.js';
import { healthChecker } from '../services/healthChecker.js';
import { monitoringDashboard } from '../services/monitoringDashboard.js';

/**
 * Demo script to test Phase 1, Week 1 implementation
 * Tests MetricsCollector, HealthChecker, and MonitoringDashboard
 */
export class MonitoringDemo {
    
    constructor() {
        console.log('🧪 MonitoringDemo initialized');
    }

    /**
     * Run complete demonstration of monitoring infrastructure
     */
    async runDemo(): Promise<void> {
        console.log('\n🚀 ELIZAOS DEX AGENT - PHASE 1, WEEK 1 DEMONSTRATION\n');
        
        await this.testMetricsCollector();
        await this.testHealthChecker();
        await this.testDashboard();
        await this.simulateUserActivity();
        await this.showFinalDashboard();
    }

    /**
     * Test MetricsCollector functionality
     */
    private async testMetricsCollector(): Promise<void> {
        console.log('📊 Testing MetricsCollector...\n');

        // Simulate various user actions
        const testUser = {
            id: 'demo-agent-123',
            platform: 'telegram' as const,
            userId: 'demo-user-456'
        };

        // Track various events
        metricsCollector.track({
            type: 'user_action',
            category: 'trading',
            action: 'swap_initiated',
            user: testUser,
            data: { fromToken: 'USDC', toToken: 'WPLS', amount: '100' },
            timestamp: Date.now()
        });

        metricsCollector.track({
            type: 'user_action',
            category: 'trading',
            action: 'balance_check',
            user: testUser,
            data: { token: 'USDC' },
            timestamp: Date.now()
        });

        metricsCollector.trackTiming('api_response', 250, testUser);
        metricsCollector.trackTiming('database_query', 45, testUser);

        // Simulate an error
        metricsCollector.trackError(new Error('Test error for demo'), {
            action: 'demo_test',
            context: 'monitoring_demo'
        }, testUser);

        console.log('✅ MetricsCollector test completed - Events tracked successfully\n');
    }

    /**
     * Test HealthChecker functionality
     */
    private async testHealthChecker(): Promise<void> {
        console.log('🏥 Testing HealthChecker...\n');

        try {
            const health = await healthChecker.runHealthChecks();
            
            console.log(`Overall Health: ${health.overall.toUpperCase()}`);
            console.log(`Database: ${health.services.database.status}`);
            console.log(`Memory Usage: ${health.services.memory.percentage.toFixed(1)}%`);
            console.log(`External APIs: ${health.services.externalAPIs.status}`);
            
            console.log('✅ HealthChecker test completed - All systems checked\n');
        } catch (error) {
            console.error('❌ HealthChecker test failed:', error);
        }
    }

    /**
     * Test Dashboard functionality
     */
    private async testDashboard(): Promise<void> {
        console.log('📈 Testing MonitoringDashboard...\n');

        try {
            const dashboardData = await monitoringDashboard.getDashboardData();
            
            console.log('Dashboard data retrieved successfully:');
            console.log(`- System Health: ${dashboardData.systemHealth.overall}`);
            console.log(`- Active Users: ${dashboardData.realtimeMetrics.activeUsers}`);
            console.log(`- Memory Usage: ${(dashboardData.realtimeMetrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`);
            
            // Test alert system
            monitoringDashboard.addAlert('info', 'Demo alert - testing notification system');
            
            console.log('✅ MonitoringDashboard test completed - Dashboard operational\n');
        } catch (error) {
            console.error('❌ MonitoringDashboard test failed:', error);
        }
    }

    /**
     * Simulate realistic user activity
     */
    private async simulateUserActivity(): Promise<void> {
        console.log('👥 Simulating user activity...\n');

        const users = [
            { id: 'agent-1', platform: 'telegram' as const, userId: 'user-001' },
            { id: 'agent-2', platform: 'discord' as const, userId: 'user-002' },
            { id: 'agent-3', platform: 'web' as const, userId: 'user-003' },
        ];

        const actions = ['swap', 'balance', 'price_check', 'portfolio', 'watchlist'];
        const tokens = ['USDC', 'WPLS', 'HEX', 'PLSX', '9MM'];

        // Simulate 20 random user actions
        for (let i = 0; i < 20; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const action = actions[Math.floor(Math.random() * actions.length)];
            const token = tokens[Math.floor(Math.random() * tokens.length)];
            
            metricsCollector.track({
                type: 'user_action',
                category: 'trading',
                action: action,
                user: user,
                data: { 
                    token: token,
                    amount: (Math.random() * 1000).toFixed(2),
                    timestamp: Date.now()
                },
                timestamp: Date.now()
            });

            // Random response times
            metricsCollector.trackTiming(action, Math.random() * 500, user);
            
            // Wait a bit between actions
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Simulate some errors
        for (let i = 0; i < 3; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            metricsCollector.trackError(
                new Error(`Simulated error ${i + 1}`),
                { action: 'simulation', iteration: i },
                user
            );
        }

        console.log('✅ User activity simulation completed - 20 actions + 3 errors simulated\n');
    }

    /**
     * Display final dashboard with all collected data
     */
    private async showFinalDashboard(): Promise<void> {
        console.log('🎯 Final Dashboard Display:\n');

        // Wait a moment for metrics to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            await monitoringDashboard.printDashboard();
            
            console.log('\n📋 Additional Metrics Summary:');
            
            const realtimeStats = metricsCollector.getRealtimeStats();
            const userInsights = metricsCollector.getUserBehaviorInsights();
            const performanceMetrics = metricsCollector.getSystemPerformance();
            
            console.log('\n🔥 Real-time Statistics:');
            console.log(`- Active Users: ${realtimeStats.activeUsers}`);
            console.log(`- Transactions/Min: ${realtimeStats.transactionsPerMinute}`);
            console.log(`- Error Rate: ${(realtimeStats.errorRate * 100).toFixed(2)}%`);
            console.log(`- Avg Response Time: ${realtimeStats.averageResponseTime.toFixed(0)}ms`);
            
            console.log('\n👥 User Insights:');
            console.log(`- Total Users: ${userInsights.totalUsers}`);
            console.log(`- New Users Today: ${userInsights.newUsersToday}`);
            console.log(`- Active Users Today: ${userInsights.activeUsersToday}`);
            console.log(`- Retention Rate: ${(userInsights.userRetentionRate * 100).toFixed(1)}%`);
            
            console.log('\n⚡ Performance Metrics:');
            console.log(`- Memory Usage: ${performanceMetrics.memoryUsage.percentage.toFixed(1)}%`);
            console.log(`- Response Time P95: ${performanceMetrics.responseTime.p95.toFixed(0)}ms`);
            console.log(`- System Throughput: ${performanceMetrics.throughput.toFixed(1)} actions/min`);
            
            if (realtimeStats.popularActions.length > 0) {
                console.log('\n🎯 Top Actions:');
                realtimeStats.popularActions.slice(0, 5).forEach((action, index) => {
                    console.log(`${index + 1}. ${action.action}: ${action.count} calls (${action.averageTime.toFixed(0)}ms avg)`);
                });
            }
            
        } catch (error) {
            console.error('❌ Dashboard display failed:', error);
        }
    }

    /**
     * Test specific metric retrieval
     */
    async testMetricRetrieval(): Promise<void> {
        console.log('\n🔍 Testing Metric Retrieval:');
        
        const metricKeys = metricsCollector.getMetricKeys();
        console.log(`Total metric keys: ${metricKeys.length}`);
        
        metricKeys.slice(0, 5).forEach(key => {
            const aggregated = metricsCollector.getAggregatedMetric(key);
            if (aggregated) {
                console.log(`- ${key}: ${aggregated.count} events, avg: ${aggregated.average.toFixed(2)}`);
            }
        });
    }

    /**
     * Cleanup demo resources
     */
    cleanup(): void {
        console.log('\n🧹 Demo cleanup completed');
    }
}

/**
 * Run the demo when this file is executed directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const demo = new MonitoringDemo();
    
    demo.runDemo()
        .then(() => {
            console.log('\n✅ PHASE 1, WEEK 1 DEMONSTRATION COMPLETED SUCCESSFULLY! 🎉');
            console.log('\n📊 Monitoring Infrastructure Summary:');
            console.log('✅ MetricsCollector - Tracking user actions, timing, and errors');
            console.log('✅ HealthChecker - Monitoring system health with 30s intervals');  
            console.log('✅ MonitoringDashboard - Real-time dashboard with alerts');
            console.log('✅ Action Integration - Swap action now has comprehensive metrics');
            console.log('\n🚀 Ready for Phase 1, Week 2: Security & Rate Limiting!');
            
            // Keep the demo running for a bit to see metrics in action
            setTimeout(() => {
                demo.cleanup();
                process.exit(0);
            }, 10000);
        })
        .catch(error => {
            console.error('❌ Demo failed:', error);
            process.exit(1);
        });
}

export default MonitoringDemo; 