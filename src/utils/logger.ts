/**
 * Professional Logging System for ElizaOS DEX Agent
 * Replaces all console.log statements with structured logging
 */

export enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    VERBOSE = 4
}

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    meta?: Record<string, unknown>;
    error?: Error;
    source?: string;
}

class Logger {
    private logLevel: LogLevel;
    private enableFileLogging: boolean;
    private logFilePath?: string;

    constructor(level: LogLevel = LogLevel.INFO, enableFileLogging = false, logFilePath?: string) {
        this.logLevel = level;
        this.enableFileLogging = enableFileLogging;
        this.logFilePath = logFilePath;
    }

    private formatLogEntry(entry: LogEntry): string {
        const { timestamp, level, message, meta, error, source } = entry;
        const levelName = LogLevel[level];
        const emoji = this.getLevelEmoji(level);
        
        let formatted = `${emoji} [${timestamp}] ${levelName}`;
        if (source) formatted += ` [${source}]`;
        formatted += `: ${message}`;
        
        if (meta && Object.keys(meta).length > 0) {
            formatted += ` | Meta: ${JSON.stringify(meta)}`;
        }
        
        if (error) {
            formatted += ` | Error: ${error.message}`;
            if (error.stack && this.logLevel >= LogLevel.DEBUG) {
                formatted += `\nStack: ${error.stack}`;
            }
        }
        
        return formatted;
    }

    private getLevelEmoji(level: LogLevel): string {
        switch (level) {
            case LogLevel.ERROR: return '❌';
            case LogLevel.WARN: return '⚠️';
            case LogLevel.INFO: return 'ℹ️';
            case LogLevel.DEBUG: return '🔧';
            case LogLevel.VERBOSE: return '📝';
            default: return '📋';
        }
    }

    private log(level: LogLevel, message: string, meta?: Record<string, unknown>, error?: Error, source?: string): void {
        if (level > this.logLevel) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            meta,
            error,
            source
        };

        const formatted = this.formatLogEntry(entry);
        
        // Console output
        switch (level) {
            case LogLevel.ERROR:
                console.error(formatted);
                break;
            case LogLevel.WARN:
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
                break;
        }

        // File logging (if enabled)
        if (this.enableFileLogging && this.logFilePath) {
            // Note: File logging would require fs import and proper setup
            // For now, we'll keep it simple with console output
        }
    }

    error(message: string, error?: Error, meta?: Record<string, unknown>, source?: string): void {
        this.log(LogLevel.ERROR, message, meta, error, source);
    }

    warn(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.log(LogLevel.WARN, message, meta, undefined, source);
    }

    info(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.log(LogLevel.INFO, message, meta, undefined, source);
    }

    debug(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.log(LogLevel.DEBUG, message, meta, undefined, source);
    }

    verbose(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.log(LogLevel.VERBOSE, message, meta, undefined, source);
    }

    // Compatibility methods for existing code
    success(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.info(`✅ ${message}`, meta, source);
    }

    progress(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.info(`🔄 ${message}`, meta, source);
    }

    alert(message: string, meta?: Record<string, unknown>, source?: string): void {
        this.warn(`🚨 ${message}`, meta, source);
    }
}

// Create global logger instance
const logLevel = process.env.LOG_LEVEL ? 
    LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] || LogLevel.INFO : 
    LogLevel.INFO;

const enableFileLogging = process.env.LOG_TO_FILE === 'true';
const logFilePath = process.env.LOG_FILE_PATH;

export const logger = new Logger(logLevel, enableFileLogging, logFilePath);

// Export individual methods for convenience
export const { error, warn, info, debug, verbose, success, progress, alert } = logger;

// Legacy compatibility for existing elizaLogger usage
export const elizaLogger = {
    info: (msg: string, meta?: Record<string, unknown>) => logger.info(msg, meta, 'ElizaOS'),
    warn: (msg: string, meta?: Record<string, unknown>) => logger.warn(msg, meta, 'ElizaOS'),
    error: (msg: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
        const errorObj = error instanceof Error ? error : undefined;
        const errorMeta = error instanceof Error ? meta : { ...meta, error };
        logger.error(msg, errorObj, errorMeta, 'ElizaOS');
    }
};

export default logger; 