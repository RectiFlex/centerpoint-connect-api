/**
 * Security utilities for enhanced authentication
 */

import * as crypto from 'crypto';

export interface TokenValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates token format and security characteristics
 */
export function validateTokenSecurity(token: string): TokenValidationResult {
  const result: TokenValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();

  // Check minimum length
  if (cleanToken.length < 20) {
    result.errors.push('Token appears too short to be secure');
    result.isValid = false;
  }

  // Check for common insecure patterns
  const insecurePatterns = [
    /^(test|demo|example|sample)/i,
    /^(admin|user|default)/i,
    /^(123|abc|password)/i
  ];

  for (const pattern of insecurePatterns) {
    if (pattern.test(cleanToken)) {
      result.warnings.push('Token appears to use a common test pattern');
      break;
    }
  }

  // Check entropy (basic)
  const uniqueChars = new Set(cleanToken.toLowerCase()).size;
  if (uniqueChars < 10) {
    result.warnings.push('Token has low character diversity');
  }

  return result;
}

/**
 * Securely masks token for logging
 */
export function maskToken(token: string): string {
  if (!token) return '[EMPTY]';
  
  const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
  if (cleanToken.length <= 8) {
    return '[REDACTED]';
  }
  
  const start = cleanToken.substring(0, 4);
  const end = cleanToken.substring(cleanToken.length - 4);
  return `${start}${'*'.repeat(Math.min(12, cleanToken.length - 8))}${end}`;
}

/**
 * Rate limiting for authentication attempts
 */
export class AuthRateLimiter {
  private attempts = new Map<string, { count: number; firstAttempt: number }>();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) { // 15 minutes
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return true;
    }

    // Reset if window expired
    if (now - record.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, { count: 1, firstAttempt: now });
      return true;
    }

    // Check if limit exceeded
    if (record.count >= this.maxAttempts) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingAttempts(identifier: string): number {
    const record = this.attempts.get(identifier);
    if (!record) return this.maxAttempts;

    const now = Date.now();
    if (now - record.firstAttempt > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - record.count);
  }
}

/**
 * Token cache with TTL for performance
 */
export class SecureTokenCache {
  private cache = new Map<string, { token: string; expires: number; hash: string }>();
  private readonly defaultTtl: number;

  constructor(defaultTtlMs = 5 * 60 * 1000) { // 5 minutes
    this.defaultTtl = defaultTtlMs;
  }

  private hash(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex').substring(0, 16);
  }

  set(key: string, token: string, ttlMs?: number): void {
    const expires = Date.now() + (ttlMs || this.defaultTtl);
    const hash = this.hash(token);
    this.cache.set(key, { token, expires, hash });
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.token;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}