/**
 * Centralized Authentication Helper for CenterPoint Connect API
 * 
 * This module provides centralized handling of API token authentication with:
 * - Environment variable support (CENTERPOINT_API_TOKEN)
 * - Optional per-call token arguments
 * - Automatic Bearer token normalization
 * - Clear error handling and validation
 */

/**
 * Reads the API token from environment variables
 * @returns The token from CENTERPOINT_API_TOKEN environment variable, or null if not set
 */
export function getTokenFromEnv(): string | null {
    const token = process.env.CENTERPOINT_API_TOKEN;
    return token && token.trim() ? token.trim() : null;
}

/**
 * Normalizes a token to include the Bearer prefix if missing
 * @param token The raw token string
 * @returns The token with "Bearer " prefix
 */
export function normalizeToken(token: string): string {
    const trimmed = token.trim();
    if (trimmed.toLowerCase().startsWith('bearer ')) {
        // Extract the token part and re-add with proper casing
        const tokenPart = trimmed.substring(7); // Remove 'Bearer ' (7 characters)
        return `Bearer ${tokenPart}`;
    }
    return `Bearer ${trimmed}`;
}

/**
 * Resolves authentication token with priority: environment variable first, then argument token
 * @param argToken Optional token provided as argument to API call
 * @returns Normalized Bearer token or null if no token available
 */
export function resolveAuth(argToken?: string): string | null {
    // Priority 1: Environment variable
    const envToken = getTokenFromEnv();
    if (envToken) {
        return normalizeToken(envToken);
    }
    
    // Priority 2: Argument token
    if (argToken && argToken.trim()) {
        return normalizeToken(argToken);
    }
    
    return null;
}

/**
 * Validates that a token is available and returns it, throwing an error if not
 * @param argToken Optional token provided as argument to API call
 * @returns Normalized Bearer token
 * @throws Error if no token is available with actionable message
 */
export function requireAuth(argToken?: string): string {
    const token = resolveAuth(argToken);
    
    if (!token) {
        throw new Error(
            'No API token found. Please either:\n' +
            '1. Set the CENTERPOINT_API_TOKEN environment variable, or\n' +
            '2. Provide the "Authorization" parameter in your API call\n\n' +
            'Example usage:\n' +
            '- Environment: export CENTERPOINT_API_TOKEN="your_token_here"\n' +
            '- Parameter: { "Authorization": "your_token_here" }'
        );
    }
    
    return token;
}

/**
 * Creates headers object with authentication and other required headers
 * @param argToken Optional token provided as argument to API call
 * @param additionalHeaders Additional headers to include
 * @returns Headers object with Authorization and other headers
 */
export function createAuthenticatedHeaders(
    argToken?: string, 
    additionalHeaders: Record<string, string> = {}
): Record<string, string> {
    // When argToken is explicitly provided, it should override environment variable
    let token: string;
    if (argToken && argToken.trim()) {
        token = normalizeToken(argToken);
    } else {
        token = requireAuth(); // Falls back to environment variable
    }
    
    return {
        'Authorization': token,
        ...additionalHeaders
    };
}
