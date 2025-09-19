# Deployment Guide

This guide covers deploying the CenterPoint Connect API MCP Server using various methods including Docker, Kubernetes, and Smithery.

## 🚀 Quick Start

### Docker Deployment

```bash
# Build and run locally
docker build -t centerpoint-connect-api:1.1.0 .
docker run -e CENTERPOINT_API_TOKEN="your_token_here" centerpoint-connect-api:1.1.0

# Using Docker Compose
docker-compose up -d

# Development with hot reload
docker-compose --profile dev up
```

### Smithery Deployment

```bash
# Deploy via Smithery
smithery deploy centerpoint-connect-api

# With custom configuration
smithery deploy centerpoint-connect-api --config production

# Check deployment status
smithery status centerpoint-connect-api
```

## 📦 Container Registry

The official Docker images are available at:
- `ghcr.io/your-org/centerpoint-connect-api:1.1.0` (latest stable)
- `ghcr.io/your-org/centerpoint-connect-api:main` (latest main branch)
- `ghcr.io/your-org/centerpoint-connect-api:develop` (development branch)

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CENTERPOINT_API_TOKEN` | ✅ | - | API token for authentication |
| `NODE_ENV` | ❌ | `production` | Environment (development/staging/production) |
| `CENTERPOINT_LOG_LEVEL` | ❌ | `info` | Log level (error/warn/info/debug) |
| `CENTERPOINT_CACHE_ENABLED` | ❌ | `true` | Enable response caching |
| `CENTERPOINT_CACHE_TTL_MS` | ❌ | `300000` | Cache TTL in milliseconds |
| `CENTERPOINT_RATE_LIMIT_ENABLED` | ❌ | `true` | Enable rate limiting |
| `CENTERPOINT_REQUEST_TIMEOUT_MS` | ❌ | `30000` | Request timeout in milliseconds |
| `CENTERPOINT_RETRY_ATTEMPTS` | ❌ | `3` | Number of retry attempts |

### Example .env file

```bash
# Production Configuration
NODE_ENV=production
CENTERPOINT_API_TOKEN=your_production_token_here
CENTERPOINT_LOG_LEVEL=info
CENTERPOINT_CACHE_ENABLED=true
CENTERPOINT_CACHE_TTL_MS=300000
CENTERPOINT_RATE_LIMIT_ENABLED=true
CENTERPOINT_REQUEST_TIMEOUT_MS=30000
CENTERPOINT_RETRY_ATTEMPTS=3
```

## ☸️ Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (1.21+)
- kubectl configured
- Sufficient resources (256Mi memory, 100m CPU minimum)

### Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace centerpoint-mcp

# Apply manifests
kubectl apply -f k8s/ -n centerpoint-mcp

# Check deployment
kubectl get pods -n centerpoint-mcp
kubectl logs -f deployment/centerpoint-mcp-server -n centerpoint-mcp
```

### Configure Secrets

```bash
# Create API token secret
echo -n "your_api_token_here" | base64
# Copy the output and update k8s/deployment.yaml

# Or use kubectl
kubectl create secret generic centerpoint-secrets \
  --from-literal=api-token="your_api_token_here" \
  -n centerpoint-mcp
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment centerpoint-mcp-server --replicas=3 -n centerpoint-mcp

# Auto-scaling (HPA is included)
kubectl get hpa -n centerpoint-mcp
```

## 🏗️ Smithery Platform

### Smithery Configuration

The `smithery.json` file contains complete deployment configuration:

```json
{
  "name": "centerpoint-connect-api",
  "version": "1.1.0",
  "mcp": {
    "server": {
      "command": "node",
      "args": ["build/index.js"],
      "transport": "stdio"
    }
  },
  "deployment": {
    "docker": {
      "image": "centerpoint-connect-api",
      "registry": "ghcr.io/your-org"
    }
  }
}
```

### Deployment Commands

```bash
# Login to Smithery
smithery auth login

# Deploy to staging
smithery deploy --environment staging

# Deploy to production
smithery deploy --environment production

# Monitor deployment
smithery logs centerpoint-connect-api
smithery metrics centerpoint-connect-api
```

## 🔍 Health Checks

The server includes built-in health monitoring:

### Health Check Endpoints

- **Container Health**: Built into Docker image
- **Kubernetes Probes**: Liveness and readiness probes configured
- **Application Health**: Internal health monitoring with metrics

### Monitoring

```bash
# Check application health
npm run health-check

# View metrics (if enabled)
curl http://localhost:3000/metrics

# Docker health status
docker ps # Shows health status
```

## 📊 Performance Tuning

### Resource Allocation

| Environment | Memory Request | Memory Limit | CPU Request | CPU Limit |
|-------------|----------------|--------------|-------------|-----------|
| Development | 128Mi | 256Mi | 50m | 200m |
| Staging | 256Mi | 512Mi | 100m | 500m |
| Production | 256Mi | 1Gi | 100m | 1000m |

### Caching Configuration

```bash
# Enable caching for better performance
export CENTERPOINT_CACHE_ENABLED=true
export CENTERPOINT_CACHE_TTL_MS=300000  # 5 minutes
export CENTERPOINT_CACHE_MAX_SIZE=5000   # 5k entries

# Request batching (experimental)
export CENTERPOINT_BATCHING_ENABLED=true
export CENTERPOINT_BATCH_WINDOW_MS=50
export CENTERPOINT_MAX_BATCH_SIZE=20
```

## 🔐 Security

### Production Security Checklist

- ✅ Use secure API tokens (20+ characters)
- ✅ Enable rate limiting
- ✅ Run as non-root user (UID 1001)
- ✅ Read-only root filesystem
- ✅ No privileged containers
- ✅ Network policies (if available)
- ✅ Resource limits configured
- ✅ Security scanning enabled

### Token Management

```bash
# Generate secure token
openssl rand -base64 32

# Rotate tokens safely
kubectl create secret generic centerpoint-secrets-new \
  --from-literal=api-token="new_token" -n centerpoint-mcp

kubectl patch deployment centerpoint-mcp-server \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"mcp-server","env":[{"name":"CENTERPOINT_API_TOKEN","valueFrom":{"secretKeyRef":{"name":"centerpoint-secrets-new","key":"api-token"}}}]}]}}}}' \
  -n centerpoint-mcp
```

## 🚨 Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check token configuration
kubectl logs deployment/centerpoint-mcp-server -n centerpoint-mcp | grep -i auth

# Validate token format
npm run dev-tools token-validate
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n centerpoint-mcp

# Enable debug logging
kubectl set env deployment/centerpoint-mcp-server CENTERPOINT_LOG_LEVEL=debug -n centerpoint-mcp
```

#### Connectivity Issues
```bash
# Test API connectivity
kubectl exec -it deployment/centerpoint-mcp-server -n centerpoint-mcp -- \
  curl -v https://api.centerpointconnect.io/centerpoint
```

### Logs and Debugging

```bash
# Docker logs
docker logs centerpoint-mcp-server

# Kubernetes logs
kubectl logs -f deployment/centerpoint-mcp-server -n centerpoint-mcp

# Application debugging
kubectl exec -it deployment/centerpoint-mcp-server -n centerpoint-mcp -- \
  npm run dev-tools health-check
```

## 📈 Monitoring and Alerting

### Metrics Collection

The server exposes Prometheus-compatible metrics:

- Request count and success rate
- Authentication attempts and failures
- Cache hit/miss ratios
- Response time percentiles
- Memory and CPU usage

### Alerting Rules

Example Prometheus alerting rules:

```yaml
groups:
- name: centerpoint-mcp
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: High error rate detected

  - alert: AuthenticationFailures
    expr: rate(auth_failures_total[5m]) > 0.05
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: High authentication failure rate
```

## 🔄 Updates and Maintenance

### Rolling Updates

```bash
# Update to new version
kubectl set image deployment/centerpoint-mcp-server \
  mcp-server=ghcr.io/your-org/centerpoint-connect-api:1.2.0 \
  -n centerpoint-mcp

# Check rollout status
kubectl rollout status deployment/centerpoint-mcp-server -n centerpoint-mcp

# Rollback if needed
kubectl rollout undo deployment/centerpoint-mcp-server -n centerpoint-mcp
```

### Maintenance Mode

```bash
# Scale down for maintenance
kubectl scale deployment centerpoint-mcp-server --replicas=0 -n centerpoint-mcp

# Scale back up
kubectl scale deployment centerpoint-mcp-server --replicas=2 -n centerpoint-mcp
```

## 📚 Additional Resources

- [Smithery Documentation](https://smithery.dev/docs)
- [Docker Documentation](https://docs.docker.com)
- [Kubernetes Documentation](https://kubernetes.io/docs)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [CenterPoint Connect API Docs](https://api.centerpointconnect.io/docs)