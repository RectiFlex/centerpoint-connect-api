/**
 * Enhanced logging and monitoring system
 */

import { maskToken } from './security.js';
import { config } from './config.js';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  toolName?: string;
  requestId?: string;
  userId?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  [key: string]: any;
}

export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  stack?: string;
}

/**
 * Enhanced logger with structured logging and filtering
 */
export class Logger {
  private readonly minLevel: LogLevel;
  private readonly enableMetrics: boolean;
  private readonly enableRequestLogging: boolean;
  private readonly enableTokenMasking: boolean;
  private readonly logFormat: 'json' | 'text';

  constructor() {
    const logConfig = config.getLogging();
    this.minLevel = this.parseLogLevel(logConfig.level);
    this.enableMetrics = logConfig.enableMetrics;
    this.enableRequestLogging = logConfig.enableRequestLogging;
    this.enableTokenMasking = logConfig.enableTokenMasking;
    this.logFormat = logConfig.logFormat;
  }

  private parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'error': return LogLevel.ERROR;
      case 'warn': return LogLevel.WARN;
      case 'info': return LogLevel.INFO;
      case 'debug': return LogLevel.DEBUG;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.minLevel;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const entry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message: this.maskSensitiveData(message),
      context: context ? this.maskSensitiveContext(context) : undefined,
    };

    if (context?.error) {
      entry.stack = context.error.stack;
    }

    if (this.logFormat === 'json') {
      return JSON.stringify(entry);
    }

    // Text format
    const parts = [entry.timestamp, `[${entry.level}]`, entry.message];
    
    if (entry.context) {
      const contextStr = Object.entries(entry.context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ');
      parts.push(`(${contextStr})`);
    }

    return parts.join(' ');
  }

  private maskSensitiveData(message: string): string {
    if (!this.enableTokenMasking) return message;

    // Mask potential tokens in messages
    return message
      .replace(/Bearer\s+[A-Za-z0-9+/=]{20,}/g, (match) => maskToken(match))
      .replace(/[A-Za-z0-9+/=]{32,}/g, (match) => {
        // Potential raw token
        if (match.length > 30) {
          return maskToken(match);
        }
        return match;
      });
  }

  private maskSensitiveContext(context: LogContext): LogContext {
    if (!this.enableTokenMasking) return context;

    const masked = { ...context };
    
    // Mask authorization-related fields
    if (masked.authorization) {
      masked.authorization = maskToken(String(masked.authorization));
    }
    if (masked.token) {
      masked.token = maskToken(String(masked.token));
    }

    return masked;
  }

  error(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, context));
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, context));
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, context));
    }
  }

  /**
   * Log API request with timing
   */
  logRequest(toolName: string, method: string, url: string, duration: number, statusCode?: number, error?: Error): void {
    if (!this.enableRequestLogging) return;

    const context: LogContext = {
      toolName,
      duration,
      statusCode,
      error,
    };

    if (error) {
      this.error(`${method} ${url} failed after ${duration}ms`, context);
    } else {
      this.info(`${method} ${url} completed in ${duration}ms`, context);
    }
  }

  /**
   * Log authentication events
   */
  logAuth(event: 'success' | 'failure' | 'ratelimited', context?: LogContext): void {
    const message = {
      success: 'Authentication successful',
      failure: 'Authentication failed',
      ratelimited: 'Authentication rate limited',
    }[event];

    switch (event) {
      case 'success':
        this.info(message, context);
        break;
      case 'failure':
      case 'ratelimited':
        this.warn(message, context);
        break;
    }
  }
}

/**
 * Performance and health monitoring
 */
export class HealthMonitor {
  private metrics = {
    startTime: Date.now(),
    requests: {
      total: 0,
      successful: 0,
      failed: 0,
      avgResponseTime: 0,
    },
    auth: {
      successful: 0,
      failed: 0,
      rateLimited: 0,
    },
    cache: {
      hits: 0,
      misses: 0,
    },
    errors: {
      count: 0,
      lastError: null as string | null,
      lastErrorTime: null as number | null,
    },
  };

  private responseTimes: number[] = [];

  recordRequest(success: boolean, responseTime: number): void {
    this.metrics.requests.total++;
    
    if (success) {
      this.metrics.requests.successful++;
    } else {
      this.metrics.requests.failed++;
    }

    // Track response times (keep last 1000)
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 1000) {
      this.responseTimes.shift();
    }

    // Update average
    this.metrics.requests.avgResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
  }

  recordAuth(event: 'success' | 'failure' | 'ratelimited'): void {
    switch (event) {
      case 'success':
        this.metrics.auth.successful++;
        break;
      case 'failure':
        this.metrics.auth.failed++;
        break;
      case 'ratelimited':
        this.metrics.auth.rateLimited++;
        break;
    }
  }

  recordCacheHit(hit: boolean): void {
    if (hit) {
      this.metrics.cache.hits++;
    } else {
      this.metrics.cache.misses++;
    }
  }

  recordError(error: Error): void {
    this.metrics.errors.count++;
    this.metrics.errors.lastError = error.message;
    this.metrics.errors.lastErrorTime = Date.now();
  }

  getHealthStatus() {
    const uptime = Date.now() - this.metrics.startTime;
    const successRate = this.metrics.requests.total > 0 
      ? (this.metrics.requests.successful / this.metrics.requests.total) * 100 
      : 100;
    const cacheHitRate = (this.metrics.cache.hits + this.metrics.cache.misses) > 0
      ? (this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)) * 100
      : 0;

    const checks = {
      highSuccessRate: successRate >= 95,
      noRecentErrors: !this.metrics.errors.lastErrorTime || 
        (Date.now() - this.metrics.errors.lastErrorTime) > 5 * 60 * 1000, // 5 minutes
      reasonableResponseTime: this.metrics.requests.avgResponseTime < 5000, // 5 seconds
      authWorking: this.metrics.auth.failed < this.metrics.auth.successful * 0.1, // Less than 10% failures
    };

    const healthyChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyChecks === totalChecks) {
      status = 'healthy';
    } else if (healthyChecks >= totalChecks * 0.7) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      uptime,
      metrics: {
        ...this.metrics,
        requests: {
          ...this.metrics.requests,
          successRate: Math.round(successRate * 100) / 100,
        },
        cache: {
          ...this.metrics.cache,
          hitRate: Math.round(cacheHitRate * 100) / 100,
        },
      },
      checks,
    };
  }

  reset(): void {
    this.metrics = {
      startTime: Date.now(),
      requests: { total: 0, successful: 0, failed: 0, avgResponseTime: 0 },
      auth: { successful: 0, failed: 0, rateLimited: 0 },
      cache: { hits: 0, misses: 0 },
      errors: { count: 0, lastError: null, lastErrorTime: null },
    };
    this.responseTimes = [];
  }
}

// Global instances
export const logger = new Logger();
export const healthMonitor = new HealthMonitor();