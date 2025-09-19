/**
 * Performance optimization utilities
 */

import { AxiosRequestConfig, AxiosResponse } from 'axios';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  etag?: string;
  lastModified?: string;
  expires?: number;
}

/**
 * HTTP response cache with smart invalidation
 */
export class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTtl: number;
  private readonly maxSize: number;

  constructor(defaultTtlMs = 5 * 60 * 1000, maxSize = 1000) {
    this.defaultTtl = defaultTtlMs;
    this.maxSize = maxSize;
  }

  private createCacheKey(config: AxiosRequestConfig): string {
    const key = `${config.method?.toUpperCase() || 'GET'}:${config.url}`;
    if (config.params) {
      const searchParams = new URLSearchParams(config.params);
      return `${key}?${searchParams.toString()}`;
    }
    return key;
  }

  get(config: AxiosRequestConfig): CacheEntry | null {
    const key = this.createCacheKey(config);
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if expired
    const now = Date.now();
    const ttl = entry.expires || this.defaultTtl;
    if (now - entry.timestamp > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set(config: AxiosRequestConfig, response: AxiosResponse, ttlMs?: number): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const key = this.createCacheKey(config);
    const entry: CacheEntry = {
      data: response.data,
      timestamp: Date.now(),
      etag: response.headers.etag,
      lastModified: response.headers['last-modified'],
      expires: ttlMs
    };

    this.cache.set(key, entry);
  }

  shouldRefresh(config: AxiosRequestConfig): boolean {
    const entry = this.get(config);
    if (!entry) return true;

    // Always refresh if we have etag/last-modified headers to validate
    return !!(entry.etag || entry.lastModified);
  }

  addConditionalHeaders(config: AxiosRequestConfig): void {
    const entry = this.get(config);
    if (!entry) return;

    config.headers = config.headers || {};
    
    if (entry.etag) {
      config.headers['If-None-Match'] = entry.etag;
    }
    
    if (entry.lastModified) {
      config.headers['If-Modified-Since'] = entry.lastModified;
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Request batching for similar API calls
 */
export class RequestBatcher {
  private batches = new Map<string, {
    requests: Array<{
      config: AxiosRequestConfig;
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }>;
    timeout: NodeJS.Timeout;
  }>();

  private readonly batchWindow: number;
  private readonly maxBatchSize: number;

  constructor(batchWindowMs = 100, maxBatchSize = 10) {
    this.batchWindow = batchWindowMs;
    this.maxBatchSize = maxBatchSize;
  }

  private getBatchKey(config: AxiosRequestConfig): string {
    return `${config.method?.toUpperCase() || 'GET'}:${config.url?.split('?')[0]}`;
  }

  add<T>(
    config: AxiosRequestConfig,
    executor: (configs: AxiosRequestConfig[]) => Promise<T[]>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batchKey = this.getBatchKey(config);
      let batch = this.batches.get(batchKey);

      if (!batch) {
        batch = {
          requests: [],
          timeout: setTimeout(() => this.executeBatch(batchKey, executor), this.batchWindow)
        };
        this.batches.set(batchKey, batch);
      }

      batch.requests.push({ config, resolve, reject });

      // Execute immediately if batch is full
      if (batch.requests.length >= this.maxBatchSize) {
        clearTimeout(batch.timeout);
        this.executeBatch(batchKey, executor);
      }
    });
  }

  private async executeBatch<T>(
    batchKey: string,
    executor: (configs: AxiosRequestConfig[]) => Promise<T[]>
  ): Promise<void> {
    const batch = this.batches.get(batchKey);
    if (!batch) return;

    this.batches.delete(batchKey);
    
    try {
      const configs = batch.requests.map(req => req.config);
      const results = await executor(configs);
      
      batch.requests.forEach((req, index) => {
        req.resolve(results[index]);
      });
    } catch (error) {
      batch.requests.forEach(req => {
        req.reject(error);
      });
    }
  }
}

/**
 * Request metrics collection
 */
export class RequestMetrics {
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    averageResponseTime: 0,
    responseTimes: [] as number[]
  };

  recordRequest(success: boolean, responseTimeMs: number, cacheHit: boolean): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (cacheHit) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Track response times (keep last 1000)
    this.metrics.responseTimes.push(responseTimeMs);
    if (this.metrics.responseTimes.length > 1000) {
      this.metrics.responseTimes.shift();
    }

    // Update average
    this.metrics.averageResponseTime = 
      this.metrics.responseTimes.reduce((sum, time) => sum + time, 0) / 
      this.metrics.responseTimes.length;
  }

  getMetrics() {
    const cacheHitRate = this.metrics.totalRequests > 0 
      ? (this.metrics.cacheHits / this.metrics.totalRequests) * 100 
      : 0;

    const successRate = this.metrics.totalRequests > 0
      ? (this.metrics.successfulRequests / this.metrics.totalRequests) * 100
      : 0;

    return {
      ...this.metrics,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      successRate: Math.round(successRate * 100) / 100
    };
  }

  reset(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      cacheHits: 0,
      cacheMisses: 0,
      averageResponseTime: 0,
      responseTimes: []
    };
  }
}