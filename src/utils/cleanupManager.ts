/**
 * Cleanup Manager for ElizaOS DEX Agent
 * Prevents memory leaks and ensures proper resource disposal
 */

import { logger } from './logger.js';
import { EventEmitter } from 'events';

export type CleanupTask = () => void | Promise<void>;

export interface CleanupResource {
    id: string;
    name: string;
    cleanup: CleanupTask;
    priority: number; // Lower numbers = higher priority
    created: Date;
}

/**
 * Universal cleanup manager to prevent memory leaks
 */
export class CleanupManager extends EventEmitter {
    private static instance: CleanupManager;
    private cleanupTasks: Map<string, CleanupResource> = new Map();
    private timers: Set<NodeJS.Timeout> = new Set();
    private intervals: Set<NodeJS.Timeout> = new Set();
    private shutdownHooks: Set<() => void | Promise<void>> = new Set();
    private isShuttingDown = false;

    private constructor() {
        super();
        this.setupProcessHandlers();
    }

    static getInstance(): CleanupManager {
        if (!CleanupManager.instance) {
            CleanupManager.instance = new CleanupManager();
        }
        return CleanupManager.instance;
    }

    /**
     * Register a cleanup task
     */
    registerCleanup(
        id: string,
        name: string,
        cleanup: CleanupTask,
        priority: number = 1000
    ): string {
        const resource: CleanupResource = {
            id,
            name,
            cleanup,
            priority,
            created: new Date()
        };

        this.cleanupTasks.set(id, resource);
        
        logger.debug(`Registered cleanup task: ${name}`, { 
            id, 
            priority,
            totalTasks: this.cleanupTasks.size 
        }, 'CleanupManager');
        
        return id;
    }

    /**
     * Unregister a cleanup task
     */
    unregisterCleanup(id: string): boolean {
        const resource = this.cleanupTasks.get(id);
        if (resource) {
            this.cleanupTasks.delete(id);
            logger.debug(`Unregistered cleanup task: ${resource.name}`, { id }, 'CleanupManager');
            return true;
        }
        return false;
    }

    /**
     * Track a timer for automatic cleanup
     */
    trackTimer(timer: NodeJS.Timeout, description?: string): NodeJS.Timeout {
        this.timers.add(timer);
        
        if (description) {
            logger.debug(`Tracking timer: ${description}`, { 
                totalTimers: this.timers.size 
            }, 'CleanupManager');
        }
        
        return timer;
    }

    /**
     * Track an interval for automatic cleanup
     */
    trackInterval(interval: NodeJS.Timeout, description?: string): NodeJS.Timeout {
        this.intervals.add(interval);
        
        if (description) {
            logger.debug(`Tracking interval: ${description}`, { 
                totalIntervals: this.intervals.size 
            }, 'CleanupManager');
        }
        
        return interval;
    }

    /**
     * Clear a specific timer
     */
    clearTimer(timer: NodeJS.Timeout): void {
        clearTimeout(timer);
        this.timers.delete(timer);
    }

    /**
     * Clear a specific interval
     */
    clearInterval(interval: NodeJS.Timeout): void {
        clearInterval(interval);
        this.intervals.delete(interval);
    }

    /**
     * Add a shutdown hook (runs on process exit)
     */
    addShutdownHook(hook: () => void | Promise<void>): void {
        this.shutdownHooks.add(hook);
    }

    /**
     * Remove a shutdown hook
     */
    removeShutdownHook(hook: () => void | Promise<void>): void {
        this.shutdownHooks.delete(hook);
    }

    /**
     * Perform cleanup of all registered resources
     */
    async performCleanup(reason: string = 'manual'): Promise<void> {
        if (this.isShuttingDown) {
            logger.warn('Cleanup already in progress', undefined, 'CleanupManager');
            return;
        }

        this.isShuttingDown = true;
        
        logger.info(`Starting cleanup: ${reason}`, {
            tasks: this.cleanupTasks.size,
            timers: this.timers.size,
            intervals: this.intervals.size
        }, 'CleanupManager');

        try {
            // 1. Clear all timers and intervals first
            await this.clearAllTimers();

            // 2. Execute cleanup tasks by priority
            await this.executeCleanupTasks();

            // 3. Run shutdown hooks
            await this.executeShutdownHooks();

            logger.info('Cleanup completed successfully', undefined, 'CleanupManager');
            this.emit('cleanupComplete');

        } catch (error) {
            logger.error('Error during cleanup', error instanceof Error ? error : new Error(String(error)), undefined, 'CleanupManager');
            this.emit('cleanupError', error);
        } finally {
            this.isShuttingDown = false;
        }
    }

    /**
     * Clear all tracked timers and intervals
     */
    private async clearAllTimers(): Promise<void> {
        // Clear all timers
        for (const timer of this.timers) {
            try {
                clearTimeout(timer);
            } catch (error) {
                logger.warn('Error clearing timer', { error }, 'CleanupManager');
            }
        }
        this.timers.clear();

        // Clear all intervals
        for (const interval of this.intervals) {
            try {
                clearInterval(interval);
            } catch (error) {
                logger.warn('Error clearing interval', { error }, 'CleanupManager');
            }
        }
        this.intervals.clear();

        logger.debug('All timers and intervals cleared', undefined, 'CleanupManager');
    }

    /**
     * Execute cleanup tasks in priority order
     */
    private async executeCleanupTasks(): Promise<void> {
        // Sort tasks by priority (lower number = higher priority)
        const sortedTasks = Array.from(this.cleanupTasks.values())
            .sort((a, b) => a.priority - b.priority);

        for (const resource of sortedTasks) {
            try {
                logger.debug(`Executing cleanup: ${resource.name}`, { 
                    id: resource.id, 
                    priority: resource.priority 
                }, 'CleanupManager');
                
                await resource.cleanup();
                
            } catch (error) {
                logger.error(`Error in cleanup task: ${resource.name}`, 
                    error instanceof Error ? error : new Error(String(error)), 
                    { id: resource.id }, 
                    'CleanupManager'
                );
            }
        }

        this.cleanupTasks.clear();
    }

    /**
     * Execute shutdown hooks
     */
    private async executeShutdownHooks(): Promise<void> {
        for (const hook of this.shutdownHooks) {
            try {
                await hook();
            } catch (error) {
                logger.error('Error in shutdown hook', 
                    error instanceof Error ? error : new Error(String(error)), 
                    undefined, 
                    'CleanupManager'
                );
            }
        }

        this.shutdownHooks.clear();
    }

    /**
     * Setup process event handlers for graceful shutdown
     */
    private setupProcessHandlers(): void {
        const gracefulShutdown = async (signal: string) => {
            logger.info(`Received ${signal}, performing graceful shutdown...`, undefined, 'CleanupManager');
            await this.performCleanup(`process ${signal}`);
            // Give time for cleanup to complete before force exit
            setTimeout(() => {
                logger.warn('Force exit after cleanup timeout', undefined, 'CleanupManager');
                process.exit(0);
            }, 5000);
        };

        // Handle various shutdown signals
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

        // Handle uncaught exceptions
        process.on('uncaughtException', async (error) => {
            logger.error('Uncaught exception, performing emergency cleanup', error, undefined, 'CleanupManager');
            await this.performCleanup('uncaught exception');
            process.exit(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', async (reason, promise) => {
            logger.error('Unhandled promise rejection, performing cleanup', 
                reason instanceof Error ? reason : new Error(String(reason)), 
                { promise: promise.toString() }, 
                'CleanupManager'
            );
            await this.performCleanup('unhandled rejection');
        });
    }

    /**
     * Get status information about tracked resources
     */
    getStatus(): {
        tasks: number;
        timers: number;
        intervals: number;
        shutdownHooks: number;
        isShuttingDown: boolean;
    } {
        return {
            tasks: this.cleanupTasks.size,
            timers: this.timers.size,
            intervals: this.intervals.size,
            shutdownHooks: this.shutdownHooks.size,
            isShuttingDown: this.isShuttingDown
        };
    }

    /**
     * Create a managed timer that auto-registers for cleanup
     */
    static createManagedTimer(
        callback: () => void,
        delay: number,
        description?: string
    ): NodeJS.Timeout {
        const manager = CleanupManager.getInstance();
        const timer = setTimeout(callback, delay);
        return manager.trackTimer(timer, description);
    }

    /**
     * Create a managed interval that auto-registers for cleanup
     */
    static createManagedInterval(
        callback: () => void,
        interval: number,
        description?: string
    ): NodeJS.Timeout {
        const manager = CleanupManager.getInstance();
        const intervalId = setInterval(callback, interval);
        return manager.trackInterval(intervalId, description);
    }
}

// Export singleton instance
export const cleanupManager = CleanupManager.getInstance();

// Convenience functions for common patterns
export function managedTimeout(callback: () => void, delay: number, description?: string): NodeJS.Timeout {
    return CleanupManager.createManagedTimer(callback, delay, description);
}

export function managedInterval(callback: () => void, interval: number, description?: string): NodeJS.Timeout {
    return CleanupManager.createManagedInterval(callback, interval, description);
}

export function registerCleanup(id: string, name: string, cleanup: CleanupTask, priority?: number): string {
    return cleanupManager.registerCleanup(id, name, cleanup, priority);
}

export default CleanupManager; 