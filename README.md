# CenterPoint Connect API Monorepo

This monorepo contains the CenterPoint Connect API MCP Server and related packages.

## 📁 Repository Structure

```
cpcapi/
├── packages/
│   └── centerpoint-connect-api/         # Main MCP Server package
│       ├── Dockerfile                   # Container configuration
│       ├── smithery.yaml               # Smithery deployment config
│       ├── package.json                # Package configuration
│       ├── src/                        # Source code
│       ├── tests/                      # Test files
│       ├── k8s/                        # Kubernetes manifests
│       ├── .github/                    # CI/CD workflows
│       ├── DEPLOYMENT.md               # Deployment guide
│       ├── SMITHERY_DEPLOYMENT.md      # Smithery-specific deployment
│       └── README.md                   # Package documentation
├── package.json                        # Root workspace configuration
└── README.md                          # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 8+
- Docker (optional, for containerization)

### Installation

```bash
# Install all dependencies
npm install
```

### Development

```bash
# Build the project
npm run build

# Run tests
npm run test

# Start in development mode
npm run dev
```

### Docker

```bash
# Build Docker image
npm run docker:build

# Run with Docker
npm run docker:run
```

## 📦 Packages

### CenterPoint Connect API

The main MCP Server providing access to 124 CenterPoint Connect API endpoints.

- **Location**: `packages/centerpoint-connect-api/`
- **Documentation**: [Package README](./packages/centerpoint-connect-api/README.md)
- **Deployment**: [Smithery Guide](./packages/centerpoint-connect-api/SMITHERY_DEPLOYMENT.md)

## 🚀 Deployment

### Smithery Deployment

For deployment on the Smithery platform, see the detailed guide:
[Smithery Deployment Guide](./packages/centerpoint-connect-api/SMITHERY_DEPLOYMENT.md)

**Important**: When setting up on Smithery, set the base directory to:
```
packages/centerpoint-connect-api
```

### Docker Deployment

```bash
# Build and run with Docker Compose
cd packages/centerpoint-connect-api
docker-compose up -d
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
npm run k8s:deploy
```

## 🛠️ Development

This monorepo uses npm workspaces for dependency management. All commands can be run from the root directory and will target the appropriate package.

### Available Scripts

- `npm run build` - Build all packages
- `npm run test` - Run tests for all packages  
- `npm run dev` - Start development server
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
- `npm run k8s:deploy` - Deploy to Kubernetes
- `npm run smithery:deploy` - Deploy to Smithery

## 📚 Documentation

- [Package Documentation](./packages/centerpoint-connect-api/README.md)
- [Deployment Guide](./packages/centerpoint-connect-api/DEPLOYMENT.md)
- [Smithery Deployment](./packages/centerpoint-connect-api/SMITHERY_DEPLOYMENT.md)
- [Changelog](./packages/centerpoint-connect-api/CHANGELOG.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes in the appropriate package directory
4. Run tests: `npm test`
5. Submit a pull request

## 📄 License

This project is private and proprietary.

## 🔗 Links

- [CenterPoint Connect API Documentation](https://api.centerpointconnect.io/docs)
- [Model Context Protocol](https://modelcontextprotocol.io)
- [Smithery Platform](https://smithery.dev)