# CenterPoint Connect API

**Version:** 1.1.0
**Description:** MCP Server generated from OpenAPI spec for CenterPoint Connect API

This is a Model Context Protocol (MCP) server that provides access to the CenterPoint Connect API through a standardized interface.

## Features

- **124 API Tools**: Complete coverage of the CenterPoint Connect API endpoints
- **Centralized Authentication**: Flexible API token management with environment variable and per-call support
- **Automatic Request Validation**: Runtime validation using Zod schemas generated from OpenAPI specifications
- **Error Handling**: Comprehensive error handling with descriptive messages
- **TypeScript Support**: Full TypeScript implementation with type safety

## Installation

### Local Development

```bash
npm install
npm run build
npm start
```

### Docker Deployment

```bash
# Quick start with Docker
docker build -t centerpoint-connect-api:1.1.0 .
docker run -e CENTERPOINT_API_TOKEN="your_token_here" centerpoint-connect-api:1.1.0

# Using Docker Compose
cp .env.example .env  # Edit with your configuration
docker-compose up -d
```

### Smithery Deployment

1. **Set up your repository**: Make sure your code is pushed to GitHub
2. **Connect to Smithery**: Go to [Smithery.dev](https://smithery.dev) and connect your GitHub repository
3. **Configure deployment**: Smithery will automatically detect the `Dockerfile` and `smithery.yaml`
4. **Set environment variables**: Configure your `CENTERPOINT_API_TOKEN` in the Smithery dashboard
5. **Deploy**: Smithery will build and deploy your MCP server automatically

The `smithery.yaml` file contains all deployment configuration including environment variables, scaling, and health checks.

## Usage

### Development Mode

```bash
npm run dev          # Development with debug logging
npm run typecheck    # Type checking only
npm run test         # Run test suite
npm run health-check # Check server health
```

### Production Deployment

```bash
npm run prod         # Production build and start
npm run docker:prod  # Docker production deployment
npm run k8s:deploy   # Kubernetes deployment
```

## Authentication

The CenterPoint Connect API requires authentication via API tokens. This MCP server provides flexible authentication with two configuration methods:

### Priority Order

1. **Environment Variable** (Recommended) - `CENTERPOINT_API_TOKEN`
2. **Per-Call Parameter** - `"Authorization"` field in tool arguments

### Configuration Methods

#### Method 1: Environment Variable (Recommended)

Set your API token as an environment variable:

```bash
# macOS/Linux
export CENTERPOINT_API_TOKEN="your_api_token_here"

# Add to ~/.bashrc, ~/.zshrc, or ~/.profile for persistence
echo 'export CENTERPOINT_API_TOKEN="your_api_token_here"' >> ~/.zshrc
```

#### Method 2: Per-Call Authorization

Pass the token directly in each API call:

```json
{
  "Authorization": "your_api_token_here",
  "other_parameters": "value"
}
```

### Token Format Support

The server automatically normalizes tokens to include the `Bearer` prefix:

- **Raw Token**: `"abc123def456"` → `"Bearer abc123def456"`
- **Bearer Token**: `"Bearer abc123def456"` → `"Bearer abc123def456"` (unchanged)
- **Mixed Case**: `"bearer abc123def456"` → `"Bearer abc123def456"`

### Authentication Examples

#### Using Environment Variable Only
```bash
export CENTERPOINT_API_TOKEN="abc123def456"
# All API calls will automatically use this token
```

#### Using Per-Call Authorization
```json
{
  "Authorization": "abc123def456",
  "fields[companies]": "name,manager",
  "page[size]": 10
}
```

#### Override Environment Variable
```bash
export CENTERPOINT_API_TOKEN="default_token"
# This call uses "override_token" instead of "default_token"
```
```json
{
  "Authorization": "override_token",
  "fields[companies]": "name,manager"
}
```

### Error Messages and Troubleshooting

#### No Token Provided
```
Error: No API token found. Please either:
1. Set the CENTERPOINT_API_TOKEN environment variable, or
2. Provide the "Authorization" parameter in your API call

Example usage:
- Environment: export CENTERPOINT_API_TOKEN="your_token_here"  
- Parameter: { "Authorization": "your_token_here" }
```

#### Invalid Token (401/403 Response)
The server will return the API's authentication error message directly, typically indicating:
- Token is expired
- Token is invalid
- Token lacks required permissions

#### Common Issues

1. **Token not persisted**: Make sure to add the export statement to your shell profile
2. **Wrong token format**: The server accepts both raw tokens and Bearer-prefixed tokens
3. **Environment variable not loaded**: Restart your terminal or reload your profile

## Available Tools

The server provides access to 124 CenterPoint Connect API endpoints, including:

- **Companies**: CRUD operations for company management
- **Cost Codes**: Management of cost codes and budget types
- **Employees**: Employee management and relationships
- **Projects**: Project tracking and management
- **Invoices**: Invoice generation and management
- **Time Entries**: Time tracking and reporting
- **And many more...**

### Tool Usage Pattern

All tools follow a consistent pattern:

```typescript
// Tool execution with authentication
{
  "Authorization": "optional_token_override",
  "field_parameters": "values",
  "filter_parameters": "values",
  "pagination": "parameters"
}
```

### Common Parameters

Most tools support these common parameters:

- **`Authorization`**: Optional API token (string)
- **`fields[*]`**: Field selection for responses
- **`filter[*]`**: Filtering parameters
- **`page[size]`** and **`page[number]`**: Pagination controls
- **`include`**: Related data inclusion
- **`sort`**: Result sorting

## Development

### Project Structure

```
src/
├── auth.ts      # Centralized authentication helper
└── index.ts     # Main MCP server with 124 API tools
```

### Authentication Helper Functions

The `auth.ts` module provides:

- `getTokenFromEnv()`: Reads token from environment
- `normalizeToken(token)`: Adds Bearer prefix if missing  
- `resolveAuth(argToken?)`: Token resolution with priority
- `requireAuth(argToken?)`: Validation with error throwing
- `createAuthenticatedHeaders(argToken?, additionalHeaders?)`: Header creation

### Adding New Tools

When the OpenAPI spec is updated, regenerate the server:

1. Update the OpenAPI specification file
2. Regenerate the MCP server code
3. The authentication system will automatically be applied to all tools

## Error Handling

The server provides comprehensive error handling:

- **Validation Errors**: Schema validation failures with detailed field information
- **Authentication Errors**: Clear messages for token issues
- **API Errors**: Pass-through of CenterPoint Connect API error responses
- **Network Errors**: Connection and timeout handling

## TypeScript Support

The server is fully TypeScript-enabled with:

- **Type-safe API calls**: All parameters and responses are typed
- **Runtime validation**: Zod schemas ensure runtime type safety
- **IDE support**: Full autocomplete and error checking

## License

This project is generated from the CenterPoint Connect API OpenAPI specification.

## Support

For API-related questions, refer to the CenterPoint Connect API documentation.  
For MCP server issues, check the error messages which provide specific guidance for resolution.