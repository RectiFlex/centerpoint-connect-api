/**
 * Enhanced configuration management system
 */

import { z } from 'zod';

// Configuration schemas with validation
const AuthConfigSchema = z.object({
  token: z.string().optional(),
  rateLimitEnabled: z.boolean().default(true),
  rateLimitMaxAttempts: z.number().min(1).default(5),
  rateLimitWindowMs: z.number().min(1000).default(15 * 60 * 1000),
  tokenCacheTtlMs: z.number().min(0).default(5 * 60 * 1000),
  tokenValidationEnabled: z.boolean().default(true),
});

const PerformanceConfigSchema = z.object({
  cacheEnabled: z.boolean().default(true),
  cacheTtlMs: z.number().min(0).default(5 * 60 * 1000),
  cacheMaxSize: z.number().min(1).default(1000),
  batchingEnabled: z.boolean().default(false),
  batchWindowMs: z.number().min(10).default(100),
  maxBatchSize: z.number().min(1).default(10),
  requestTimeoutMs: z.number().min(1000).default(30000),
  retryAttempts: z.number().min(0).default(3),
  retryDelayMs: z.number().min(100).default(1000),
});

const LoggingConfigSchema = z.object({
  level: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  enableMetrics: z.boolean().default(true),
  enableRequestLogging: z.boolean().default(false),
  enableTokenMasking: z.boolean().default(true),
  logFormat: z.enum(['json', 'text']).default('text'),
});

const ServerConfigSchema = z.object({
  name: z.string().default('centerpoint-connect-api'),
  version: z.string().default('1.1.0'),
  baseUrl: z.string().url().default('https://api.centerpointconnect.io/centerpoint'),
  userAgent: z.string().optional(),
  customHeaders: z.record(z.string()).default({}),
});

const ConfigSchema = z.object({
  auth: AuthConfigSchema,
  performance: PerformanceConfigSchema,
  logging: LoggingConfigSchema,
  server: ServerConfigSchema,
  environment: z.enum(['development', 'staging', 'production']).default('production'),
});

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Configuration manager with environment variable support
 */
export class ConfigManager {
  private config: Config;
  private readonly envPrefix = 'CENTERPOINT_';

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): Config {
    const envConfig = this.loadFromEnvironment();
    const merged = this.mergeConfigs(this.getDefaultConfig(), envConfig);
    
    try {
      return ConfigSchema.parse(merged);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Configuration validation failed:', error.errors);
        throw new Error(`Invalid configuration: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`);
      }
      throw error;
    }
  }

  private getDefaultConfig(): Partial<Config> {
    return {
      environment: (process.env.NODE_ENV as any) || 'production',
    };
  }

  private loadFromEnvironment(): Partial<Config> {
    const env = process.env;
    
    const envConfig: any = {
      auth: {},
      performance: {},
      logging: {},
      server: {},
    };
    
    // Auth configuration
    if (env.CENTERPOINT_API_TOKEN) envConfig.auth.token = env.CENTERPOINT_API_TOKEN;
    if (env.CENTERPOINT_RATE_LIMIT_ENABLED !== undefined) envConfig.auth.rateLimitEnabled = this.parseBoolean(env.CENTERPOINT_RATE_LIMIT_ENABLED);
    if (env.CENTERPOINT_RATE_LIMIT_MAX_ATTEMPTS !== undefined) envConfig.auth.rateLimitMaxAttempts = this.parseNumber(env.CENTERPOINT_RATE_LIMIT_MAX_ATTEMPTS);
    if (env.CENTERPOINT_RATE_LIMIT_WINDOW_MS !== undefined) envConfig.auth.rateLimitWindowMs = this.parseNumber(env.CENTERPOINT_RATE_LIMIT_WINDOW_MS);
    if (env.CENTERPOINT_TOKEN_CACHE_TTL_MS !== undefined) envConfig.auth.tokenCacheTtlMs = this.parseNumber(env.CENTERPOINT_TOKEN_CACHE_TTL_MS);
    if (env.CENTERPOINT_TOKEN_VALIDATION_ENABLED !== undefined) envConfig.auth.tokenValidationEnabled = this.parseBoolean(env.CENTERPOINT_TOKEN_VALIDATION_ENABLED);
    
    // Performance configuration
    if (env.CENTERPOINT_CACHE_ENABLED !== undefined) envConfig.performance.cacheEnabled = this.parseBoolean(env.CENTERPOINT_CACHE_ENABLED);
    if (env.CENTERPOINT_CACHE_TTL_MS !== undefined) envConfig.performance.cacheTtlMs = this.parseNumber(env.CENTERPOINT_CACHE_TTL_MS);
    if (env.CENTERPOINT_CACHE_MAX_SIZE !== undefined) envConfig.performance.cacheMaxSize = this.parseNumber(env.CENTERPOINT_CACHE_MAX_SIZE);
    if (env.CENTERPOINT_BATCHING_ENABLED !== undefined) envConfig.performance.batchingEnabled = this.parseBoolean(env.CENTERPOINT_BATCHING_ENABLED);
    if (env.CENTERPOINT_BATCH_WINDOW_MS !== undefined) envConfig.performance.batchWindowMs = this.parseNumber(env.CENTERPOINT_BATCH_WINDOW_MS);
    if (env.CENTERPOINT_MAX_BATCH_SIZE !== undefined) envConfig.performance.maxBatchSize = this.parseNumber(env.CENTERPOINT_MAX_BATCH_SIZE);
    if (env.CENTERPOINT_REQUEST_TIMEOUT_MS !== undefined) envConfig.performance.requestTimeoutMs = this.parseNumber(env.CENTERPOINT_REQUEST_TIMEOUT_MS);
    if (env.CENTERPOINT_RETRY_ATTEMPTS !== undefined) envConfig.performance.retryAttempts = this.parseNumber(env.CENTERPOINT_RETRY_ATTEMPTS);
    if (env.CENTERPOINT_RETRY_DELAY_MS !== undefined) envConfig.performance.retryDelayMs = this.parseNumber(env.CENTERPOINT_RETRY_DELAY_MS);
    
    // Logging configuration
    if (env.CENTERPOINT_LOG_LEVEL) envConfig.logging.level = env.CENTERPOINT_LOG_LEVEL;
    if (env.CENTERPOINT_ENABLE_METRICS !== undefined) envConfig.logging.enableMetrics = this.parseBoolean(env.CENTERPOINT_ENABLE_METRICS);
    if (env.CENTERPOINT_ENABLE_REQUEST_LOGGING !== undefined) envConfig.logging.enableRequestLogging = this.parseBoolean(env.CENTERPOINT_ENABLE_REQUEST_LOGGING);
    if (env.CENTERPOINT_ENABLE_TOKEN_MASKING !== undefined) envConfig.logging.enableTokenMasking = this.parseBoolean(env.CENTERPOINT_ENABLE_TOKEN_MASKING);
    if (env.CENTERPOINT_LOG_FORMAT) envConfig.logging.logFormat = env.CENTERPOINT_LOG_FORMAT;
    
    // Server configuration
    if (env.CENTERPOINT_SERVER_NAME) envConfig.server.name = env.CENTERPOINT_SERVER_NAME;
    if (env.CENTERPOINT_SERVER_VERSION) envConfig.server.version = env.CENTERPOINT_SERVER_VERSION;
    if (env.CENTERPOINT_BASE_URL) envConfig.server.baseUrl = env.CENTERPOINT_BASE_URL;
    if (env.CENTERPOINT_USER_AGENT) envConfig.server.userAgent = env.CENTERPOINT_USER_AGENT;
    
    // Environment
    if (env.NODE_ENV) envConfig.environment = env.NODE_ENV;
    
    return envConfig;
  }
  private parseBoolean(value: string | undefined): boolean | undefined {
    if (!value) return undefined;
    return value.toLowerCase() === 'true' || value === '1';
  }

  private parseNumber(value: string | undefined): number | undefined {
    if (!value) return undefined;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  private mergeConfigs(base: Partial<Config>, override: Partial<Config>): Partial<Config> {
    return {
      ...base,
      auth: { ...base.auth, ...override.auth } as any,
      performance: { ...base.performance, ...override.performance } as any,
      logging: { ...base.logging, ...override.logging } as any,
      server: { ...base.server, ...override.server } as any,
      environment: override.environment || base.environment,
    };
  }

  get(): Config {
    return { ...this.config };
  }

  getAuth() {
    return this.config.auth;
  }

  getPerformance() {
    return this.config.performance;
  }

  getLogging() {
    return this.config.logging;
  }

  getServer() {
    return this.config.server;
  }

  isDevelopment(): boolean {
    return this.config.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.environment === 'production';
  }

  /**
   * Generate environment variable documentation
   */
  generateEnvDocs(): string {
    const docs = [
      '# Environment Variables Configuration',
      '',
      '## Authentication',
      '- `CENTERPOINT_API_TOKEN`: API token for authentication',
      '- `CENTERPOINT_RATE_LIMIT_ENABLED`: Enable rate limiting (true/false)',
      '- `CENTERPOINT_RATE_LIMIT_MAX_ATTEMPTS`: Max auth attempts per window',
      '- `CENTERPOINT_RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds',
      '- `CENTERPOINT_TOKEN_CACHE_TTL_MS`: Token cache TTL in milliseconds',
      '- `CENTERPOINT_TOKEN_VALIDATION_ENABLED`: Enable token validation (true/false)',
      '',
      '## Performance',
      '- `CENTERPOINT_CACHE_ENABLED`: Enable response caching (true/false)',
      '- `CENTERPOINT_CACHE_TTL_MS`: Cache TTL in milliseconds',
      '- `CENTERPOINT_CACHE_MAX_SIZE`: Maximum cache entries',
      '- `CENTERPOINT_BATCHING_ENABLED`: Enable request batching (true/false)',
      '- `CENTERPOINT_BATCH_WINDOW_MS`: Batch window in milliseconds',
      '- `CENTERPOINT_MAX_BATCH_SIZE`: Maximum batch size',
      '- `CENTERPOINT_REQUEST_TIMEOUT_MS`: Request timeout in milliseconds',
      '- `CENTERPOINT_RETRY_ATTEMPTS`: Number of retry attempts',
      '- `CENTERPOINT_RETRY_DELAY_MS`: Retry delay in milliseconds',
      '',
      '## Logging',
      '- `CENTERPOINT_LOG_LEVEL`: Log level (error/warn/info/debug)',
      '- `CENTERPOINT_ENABLE_METRICS`: Enable metrics collection (true/false)',
      '- `CENTERPOINT_ENABLE_REQUEST_LOGGING`: Enable request logging (true/false)',
      '- `CENTERPOINT_ENABLE_TOKEN_MASKING`: Enable token masking in logs (true/false)',
      '- `CENTERPOINT_LOG_FORMAT`: Log format (json/text)',
      '',
      '## Server',
      '- `CENTERPOINT_SERVER_NAME`: Server name identifier',
      '- `CENTERPOINT_SERVER_VERSION`: Server version',
      '- `CENTERPOINT_BASE_URL`: API base URL',
      '- `CENTERPOINT_USER_AGENT`: Custom user agent string',
      '',
      '## General',
      '- `NODE_ENV`: Environment (development/staging/production)',
    ];

    return docs.join('\n');
  }
}

// Global instance
export const config = new ConfigManager();