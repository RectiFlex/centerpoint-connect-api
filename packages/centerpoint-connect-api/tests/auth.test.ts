import { 
  getTokenFromEnv, 
  normalizeToken, 
  resolveAuth, 
  requireAuth, 
  createAuthenticatedHeaders 
} from '../src/auth';

describe('Authentication Helper Functions', () => {
  
  // Store original environment
  const originalEnv = process.env.CENTERPOINT_API_TOKEN;

  afterEach(() => {
    // Reset environment after each test
    if (originalEnv !== undefined) {
      process.env.CENTERPOINT_API_TOKEN = originalEnv;
    } else {
      delete process.env.CENTERPOINT_API_TOKEN;
    }
  });

  describe('getTokenFromEnv()', () => {
    it('should return token from environment variable', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token_123';
      expect(getTokenFromEnv()).toBe('env_token_123');
    });

    it('should return null when environment variable is not set', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      expect(getTokenFromEnv()).toBeNull();
    });

    it('should return null when environment variable is empty', () => {
      process.env.CENTERPOINT_API_TOKEN = '';
      expect(getTokenFromEnv()).toBeNull();
    });

    it('should trim whitespace from environment variable', () => {
      process.env.CENTERPOINT_API_TOKEN = '  token_with_spaces  ';
      expect(getTokenFromEnv()).toBe('token_with_spaces');
    });
  });

  describe('normalizeToken()', () => {
    it('should add Bearer prefix to raw token', () => {
      expect(normalizeToken('abc123def456')).toBe('Bearer abc123def456');
    });

    it('should preserve existing Bearer prefix', () => {
      expect(normalizeToken('Bearer abc123def456')).toBe('Bearer abc123def456');
    });

    it('should handle mixed case Bearer prefix', () => {
      expect(normalizeToken('bearer abc123def456')).toBe('Bearer abc123def456');
    });

    it('should handle Bearer with different casing', () => {
      expect(normalizeToken('BEARER abc123def456')).toBe('Bearer abc123def456');
    });

    it('should trim whitespace before normalization', () => {
      expect(normalizeToken('  abc123def456  ')).toBe('Bearer abc123def456');
    });

    it('should handle Bearer prefix with whitespace', () => {
      expect(normalizeToken('  Bearer abc123def456  ')).toBe('Bearer abc123def456');
    });
  });

  describe('resolveAuth()', () => {
    it('should prioritize environment variable over argument token', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const result = resolveAuth('arg_token');
      expect(result).toBe('Bearer env_token');
    });

    it('should use argument token when environment variable is not set', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const result = resolveAuth('arg_token');
      expect(result).toBe('Bearer arg_token');
    });

    it('should return null when neither token is provided', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const result = resolveAuth();
      expect(result).toBeNull();
    });

    it('should return null when both tokens are empty', () => {
      process.env.CENTERPOINT_API_TOKEN = '';
      const result = resolveAuth('');
      expect(result).toBeNull();
    });

    it('should handle whitespace-only tokens', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const result = resolveAuth('   ');
      expect(result).toBeNull();
    });

    it('should normalize tokens from both sources', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const result = resolveAuth('Bearer arg_token');
      expect(result).toBe('Bearer env_token'); // Environment takes priority
    });
  });

  describe('requireAuth()', () => {
    it('should return normalized token when available from environment', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const result = requireAuth();
      expect(result).toBe('Bearer env_token');
    });

    it('should return normalized token when provided as argument', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const result = requireAuth('arg_token');
      expect(result).toBe('Bearer arg_token');
    });

    it('should throw error when no token is available', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      expect(() => requireAuth()).toThrow('No API token found');
    });

    it('should include helpful error message', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      expect(() => requireAuth()).toThrow(/Set the CENTERPOINT_API_TOKEN environment variable/);
      expect(() => requireAuth()).toThrow(/Provide the "Authorization" parameter/);
    });

    it('should include usage examples in error message', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      expect(() => requireAuth()).toThrow(/export CENTERPOINT_API_TOKEN/);
      expect(() => requireAuth()).toThrow(/"Authorization": "your_token_here"/);
    });
  });

  describe('createAuthenticatedHeaders()', () => {
    it('should create headers with Authorization from environment token', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const headers = createAuthenticatedHeaders();
      expect(headers).toEqual({
        'Authorization': 'Bearer env_token'
      });
    });

    it('should create headers with Authorization from argument token', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const headers = createAuthenticatedHeaders('arg_token');
      expect(headers).toEqual({
        'Authorization': 'Bearer arg_token'
      });
    });

    it('should merge with additional headers', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const headers = createAuthenticatedHeaders(undefined, {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
      expect(headers).toEqual({
        'Authorization': 'Bearer env_token',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });
    });

    it('should allow argument token to override additional headers', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_token';
      const headers = createAuthenticatedHeaders('override_token', {
        'Content-Type': 'application/json'
      });
      expect(headers).toEqual({
        'Authorization': 'Bearer override_token', // Environment token is ignored when arg is provided
        'Content-Type': 'application/json'
      });
    });

    it('should throw error when no token is available', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      expect(() => createAuthenticatedHeaders()).toThrow('No API token found');
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete authentication flow with environment variable', () => {
      process.env.CENTERPOINT_API_TOKEN = 'integration_test_token';
      
      // Test the complete flow
      const envToken = getTokenFromEnv();
      expect(envToken).toBe('integration_test_token');
      
      const normalizedToken = normalizeToken(envToken!);
      expect(normalizedToken).toBe('Bearer integration_test_token');
      
      const resolvedToken = resolveAuth();
      expect(resolvedToken).toBe('Bearer integration_test_token');
      
      const requiredToken = requireAuth();
      expect(requiredToken).toBe('Bearer integration_test_token');
      
      const headers = createAuthenticatedHeaders();
      expect(headers.Authorization).toBe('Bearer integration_test_token');
    });

    it('should handle complete authentication flow with argument token', () => {
      delete process.env.CENTERPOINT_API_TOKEN;
      const testToken = 'Bearer integration_arg_token';
      
      // Test the complete flow
      const envToken = getTokenFromEnv();
      expect(envToken).toBeNull();
      
      const normalizedToken = normalizeToken(testToken);
      expect(normalizedToken).toBe('Bearer integration_arg_token');
      
      const resolvedToken = resolveAuth(testToken);
      expect(resolvedToken).toBe('Bearer integration_arg_token');
      
      const requiredToken = requireAuth(testToken);
      expect(requiredToken).toBe('Bearer integration_arg_token');
      
      const headers = createAuthenticatedHeaders(testToken);
      expect(headers.Authorization).toBe('Bearer integration_arg_token');
    });

    it('should handle priority override scenario', () => {
      process.env.CENTERPOINT_API_TOKEN = 'env_priority_token';
      const argToken = 'arg_override_token';
      
      // Environment should take priority in resolveAuth
      const resolvedWithBoth = resolveAuth(argToken);
      expect(resolvedWithBoth).toBe('Bearer env_priority_token');
      
      // But explicit argument should override in createAuthenticatedHeaders
      const headersWithOverride = createAuthenticatedHeaders(argToken);
      expect(headersWithOverride.Authorization).toBe('Bearer arg_override_token');
    });
  });
});