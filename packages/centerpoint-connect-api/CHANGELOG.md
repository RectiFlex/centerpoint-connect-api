# Changelog

All notable changes to the CenterPoint Connect API MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-19

### Added

#### Centralized Authentication System
- **Environment Variable Support**: Added `CENTERPOINT_API_TOKEN` environment variable for global API token configuration
- **Per-Call Authorization**: Added optional `Authorization` parameter to all 124 API tool schemas  
- **Automatic Token Normalization**: Automatic addition of `Bearer` prefix to raw tokens
- **Flexible Token Priority**: Environment variable takes priority, with per-call override capability
- **Comprehensive Error Handling**: Clear, actionable error messages when authentication fails

#### New Authentication Helper (`src/auth.ts`)
- `getTokenFromEnv()`: Reads token from `CENTERPOINT_API_TOKEN` environment variable
- `normalizeToken(token)`: Adds `Bearer` prefix if missing, handles mixed case
- `resolveAuth(argToken?)`: Token resolution with environment variable priority
- `requireAuth(argToken?)`: Token validation with descriptive error messages
- `createAuthenticatedHeaders(argToken?, additionalHeaders?)`: Header creation with authentication

#### Testing and Quality Assurance
- **Comprehensive Test Suite**: 29 unit tests covering all authentication scenarios
- **100% Code Coverage**: Complete coverage of authentication helper functions
- **Integration Tests**: End-to-end authentication flow testing
- **Jest Configuration**: Full TypeScript testing setup with coverage reporting

#### Documentation
- **Comprehensive README**: Detailed authentication setup guide and API documentation
- **Usage Examples**: Environment variable and per-call authentication examples  
- **Troubleshooting Guide**: Common issues and error message explanations
- **Developer Documentation**: Architecture overview and helper function documentation

### Changed

#### All API Tools (124 tools)
- Added optional `Authorization` field to every tool's input schema
- Integrated centralized authentication logic into all tool execution handlers
- Consistent error handling across all API endpoints

#### Build System
- Added test scripts: `npm test`, `npm run test:watch`, `npm run test:coverage`
- Enhanced TypeScript configuration for testing
- Improved build validation and error checking

### Technical Details

#### Authentication Priority Order
1. **Environment Variable**: `CENTERPOINT_API_TOKEN` (recommended for global configuration)
2. **Per-Call Parameter**: `Authorization` field in tool arguments (for overrides)

#### Token Format Support
- Raw tokens: `abc123def456` → `Bearer abc123def456`
- Bearer tokens: `Bearer abc123def456` → unchanged  
- Mixed case: `bearer abc123def456` → `Bearer abc123def456`

#### Error Handling Improvements
- Authentication failures now provide specific guidance
- Environment variable setup instructions included in error messages
- Parameter usage examples provided for troubleshooting

### Migration Guide

#### For Existing Users
No breaking changes - all existing functionality preserved. To take advantage of new features:

1. **Set up global authentication**:
   ```bash
   export CENTERPOINT_API_TOKEN="your_api_token_here"
   echo 'export CENTERPOINT_API_TOKEN="your_api_token_here"' >> ~/.zshrc
   ```

2. **Per-call authentication** (optional):
   ```json
   {
     "Authorization": "your_token_here",
     "other_parameters": "values"
   }
   ```

#### For Developers
- New `src/auth.ts` module available for authentication utilities
- Test framework available: `npm test` for development
- Enhanced documentation in `README.md`

## [1.0.0] - 2025-09-19

### Added
- Initial release of CenterPoint Connect API MCP Server
- 124 API tools covering complete CenterPoint Connect API
- Generated from OpenAPI specification
- TypeScript implementation with Zod validation
- Basic error handling and request processing