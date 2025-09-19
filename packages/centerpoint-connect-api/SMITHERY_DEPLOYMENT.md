# Smithery Deployment Guide

This guide covers deploying your CenterPoint Connect API MCP Server to the Smithery platform.

## 🚀 Quick Start

### Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **Smithery Account**: Sign up at [smithery.dev](https://smithery.dev)
3. **CenterPoint API Token**: You'll need a valid API token for CenterPoint Connect

### Required Files

Your repository contains the required files for Smithery deployment:

- ✅ `packages/centerpoint-connect-api/Dockerfile` - Containerization configuration
- ✅ `packages/centerpoint-connect-api/smithery.yaml` - Smithery deployment configuration

### Monorepo Structure

This project is organized as a monorepo with the package located in a subdirectory:

```
cpcapi/
├── packages/
│   └── centerpoint-connect-api/
│       ├── Dockerfile
│       ├── smithery.yaml
│       ├── package.json
│       ├── src/
│       └── ...
├── package.json (root)
└── README.md
```

**Important**: When setting up your server on Smithery, you'll need to specify the base directory as `packages/centerpoint-connect-api` in your server settings.

## 📋 Deployment Steps

### 1. Push Code to GitHub

Make sure all your code is committed and pushed to your GitHub repository:

```bash
git add .
git commit -m "Add Smithery deployment configuration"
git push origin main
```

### 2. Connect to Smithery

1. Go to [smithery.dev](https://smithery.dev)
2. Sign in with your GitHub account
3. Click "New Server" or "Deploy Server"
4. Select your `centerpoint-connect-api` repository

### 3. Configure Deployment

**Set Base Directory**: In the Smithery dashboard, set the base directory to:
```
packages/centerpoint-connect-api
```

Smithery will automatically detect:
- Your `Dockerfile` for containerization (in the package directory)
- Your `smithery.yaml` for deployment configuration (in the package directory)

The configuration includes:
- **Runtime**: TypeScript-based deployment (no Docker required)
- **Build**: Automatic TypeScript compilation and bundling
- **Entry Point**: `src/index.ts` with exported `createServer` function
- **Environment Variables**: Configurable through Smithery UI

### 4. Set Environment Variables

In the Smithery dashboard, configure these environment variables:

#### Required Variables

- **`CENTERPOINT_API_TOKEN`**: Your CenterPoint Connect API token
  - Type: String (Secret)
  - Description: API token for authentication

#### Optional Variables (with defaults)

- **`NODE_ENV`**: Environment setting
  - Default: `production`
  - Options: `development`, `staging`, `production`

- **`CENTERPOINT_LOG_LEVEL`**: Logging level
  - Default: `info`
  - Options: `error`, `warn`, `info`, `debug`

- **`CENTERPOINT_CACHE_ENABLED`**: Enable response caching
  - Default: `true`
  - Type: Boolean

- **`CENTERPOINT_CACHE_TTL_MS`**: Cache duration
  - Default: `300000` (5 minutes)
  - Range: 1,000 - 3,600,000 ms

- **`CENTERPOINT_RATE_LIMIT_ENABLED`**: Enable rate limiting
  - Default: `true`
  - Type: Boolean

- **`CENTERPOINT_REQUEST_TIMEOUT_MS`**: Request timeout
  - Default: `30000` (30 seconds)
  - Range: 1,000 - 300,000 ms

- **`CENTERPOINT_RETRY_ATTEMPTS`**: Retry attempts
  - Default: `3`
  - Range: 0 - 10

### 5. Deploy

1. Review your configuration
2. Click "Deploy"
3. Smithery will:
   - Build your Docker image
   - Deploy the container
   - Configure networking and scaling
   - Set up health checks

## 📊 Monitoring

### Health Checks

Smithery automatically configures health checks using the built-in Node.js health check:

```bash
node -e "console.log('Health check passed')"
```

### Logs

Access logs through the Smithery dashboard:
- Structured JSON logging in production
- Configurable log levels
- Real-time log streaming

### Metrics

The server exposes metrics for monitoring:
- Request count and success rates
- Authentication metrics
- Cache hit/miss ratios
- Response time percentiles

## 🔧 Configuration Schema

The `smithery.yaml` file defines the complete configuration schema:

```yaml
runtime: "typescript"

configSchema:
  type: object
  properties:
    CENTERPOINT_API_TOKEN:
      type: string
      description: "API token for CenterPoint Connect authentication"
      secret: true
    # ... additional configuration options
  required:
    - CENTERPOINT_API_TOKEN
```

The TypeScript runtime automatically:
- Compiles and bundles your TypeScript code
- Handles dependencies and imports
- Optimizes for production deployment
- No Docker configuration required

## 🛡️ Security

### Runtime Security

- **Sandboxed execution**: TypeScript runtime provides isolated execution
- **Dependency validation**: Automatic security scanning of npm packages
- **Code compilation**: Source code is compiled and optimized before deployment
- **No container overhead**: Direct Node.js execution without Docker layers

### Secret Management

- API tokens are stored securely as secrets
- Environment variables are encrypted at rest
- Secrets are injected at runtime, not build time

### Network Security

- HTTPS/TLS encryption in transit
- Private container networking
- Configurable rate limiting

## 📈 Scaling

### Automatic Scaling

The deployment supports automatic scaling based on CPU utilization:

- **Minimum Instances**: 1
- **Maximum Instances**: 3 (can be configured)
- **Target CPU**: 70% utilization
- **Scale Up**: Aggressive scaling for responsiveness
- **Scale Down**: Conservative scaling for stability

### Resource Limits

- **Memory Request**: 256Mi
- **Memory Limit**: 512Mi
- **CPU Request**: 100m (0.1 CPU)
- **CPU Limit**: 500m (0.5 CPU)

## 🚨 Troubleshooting

### Common Issues

#### Build Failures

1. **TypeScript Build Error**:
   ```
   Error: TypeScript compilation failed
   ```
   - Ensure `src/index.ts` exports a default `createServer` function
   - Check that all TypeScript dependencies are in `package.json`
   - Test build locally: `cd packages/centerpoint-connect-api && npm run build`

2. **NPM Install Error**:
   ```
   Error: Cannot resolve dependencies
   ```
   - Check `package.json` and `package-lock.json`
   - Ensure all dependencies are specified

#### Runtime Issues

1. **Authentication Errors**:
   ```
   Error: No API token found
   ```
   - Verify `CENTERPOINT_API_TOKEN` is set in Smithery dashboard
   - Check token is marked as "secret"

2. **Connection Timeouts**:
   ```
   Error: Request timeout
   ```
   - Increase `CENTERPOINT_REQUEST_TIMEOUT_MS`
   - Check CenterPoint Connect API status

#### MCP Protocol Issues

1. **STDIO Transport Error**:
   ```
   Error: Cannot establish MCP connection
   ```
   - Ensure `startCommand.type` is set to `"stdio"`
   - Check container logs for startup errors

### Getting Help

1. **Smithery Dashboard**: Check deployment logs and metrics
2. **GitHub Issues**: Report bugs in the repository
3. **MCP Inspector**: Test your server locally before deploying

## 🔄 Updates

### Updating Your Server

1. **Code Changes**: Push changes to your GitHub repository
2. **Automatic Deployment**: Smithery will automatically redeploy
3. **Manual Deployment**: Trigger redeploy from Smithery dashboard

### Version Management

- Update version in `smithery.yaml`
- Tag releases in GitHub
- Use semantic versioning (e.g., `1.1.0`, `1.2.0`)

## 📚 Additional Resources

- [Smithery Documentation](https://smithery.dev/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [CenterPoint Connect API](https://api.centerpointconnect.io/docs)

## ✅ Deployment Checklist

Before deploying, ensure:

- [ ] Code is pushed to GitHub
- [ ] `packages/centerpoint-connect-api/src/index.ts` exports `createServer` function
- [ ] `packages/centerpoint-connect-api/smithery.yaml` configured with `runtime: "typescript"`
- [ ] `package.json` includes `module` field pointing to `src/index.ts`
- [ ] Base directory set to `packages/centerpoint-connect-api` in Smithery settings
- [ ] Environment variables are documented
- [ ] API token is available
- [ ] Local testing completed with `npm run dev`
- [ ] Documentation is up to date

Your CenterPoint Connect API MCP Server is now ready for production deployment on Smithery! 🚀