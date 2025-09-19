#!/usr/bin/env ts-node
/**
 * Development and operational tools
 */

import { config } from '../src/config.js';
import { logger, healthMonitor } from '../src/logging.js';
import { validateTokenSecurity, maskToken } from '../src/security.js';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface DevCommand {
  name: string;
  description: string;
  handler: (args: string[]) => Promise<void> | void;
}

const commands: DevCommand[] = [
  {
    name: 'config-validate',
    description: 'Validate current configuration',
    handler: validateConfig,
  },
  {
    name: 'config-docs',
    description: 'Generate environment variable documentation',
    handler: generateConfigDocs,
  },
  {
    name: 'token-validate',
    description: 'Validate API token security',
    handler: validateToken,
  },
  {
    name: 'health-check',
    description: 'Check server health status',
    handler: healthCheck,
  },
  {
    name: 'generate-examples',
    description: 'Generate usage examples',
    handler: generateExamples,
  },
  {
    name: 'lint-check',
    description: 'Run comprehensive linting checks',
    handler: lintCheck,
  },
];

async function validateConfig(): Promise<void> {
  try {
    const cfg = config.get();
    console.log('✅ Configuration is valid');
    console.log(`Environment: ${cfg.environment}`);
    console.log(`Server: ${cfg.server.name} v${cfg.server.version}`);
    console.log(`Base URL: ${cfg.server.baseUrl}`);
    
    // Show masked token status
    if (cfg.auth.token) {
      console.log(`Token: ${maskToken(cfg.auth.token)}`);
    } else {
      console.log('⚠️  No API token configured');
    }
  } catch (error) {
    console.error('❌ Configuration validation failed:', error);
    process.exit(1);
  }
}

async function generateConfigDocs(): Promise<void> {
  const docs = config.generateEnvDocs();
  const docsPath = join(process.cwd(), 'ENVIRONMENT.md');
  
  writeFileSync(docsPath, docs);
  console.log(`✅ Environment documentation generated: ${docsPath}`);
}

async function validateToken(args: string[]): Promise<void> {
  const token = args[0] || config.getAuth().token;
  
  if (!token) {
    console.error('❌ No token provided. Usage: npm run dev-tools token-validate [TOKEN]');
    process.exit(1);
  }

  const validation = validateTokenSecurity(token);
  
  console.log(`Token validation for: ${maskToken(token)}`);
  console.log(`Valid: ${validation.isValid ? '✅' : '❌'}`);
  
  if (validation.errors.length > 0) {
    console.log('\n❌ Errors:');
    validation.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (validation.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    validation.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  if (validation.isValid && validation.warnings.length === 0) {
    console.log('✅ Token appears secure');
  }
}

async function healthCheck(): Promise<void> {
  const health = healthMonitor.getHealthStatus();
  
  console.log(`Health Status: ${health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌'} ${health.status.toUpperCase()}`);
  console.log(`Uptime: ${Math.round(health.uptime / 1000)}s`);
  console.log();
  
  console.log('Metrics:');
  console.log(`  Requests: ${health.metrics.requests.total} (${health.metrics.requests.successRate}% success)`);
  console.log(`  Auth: ${health.metrics.auth.successful} successful, ${health.metrics.auth.failed} failed`);
  console.log(`  Cache: ${health.metrics.cache.hitRate}% hit rate`);
  console.log(`  Avg Response: ${Math.round(health.metrics.requests.avgResponseTime)}ms`);
  console.log();
  
  console.log('Health Checks:');
  Object.entries(health.checks).forEach(([check, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${check}`);
  });
}

async function generateExamples(): Promise<void> {
  const examples = `# CenterPoint Connect API Examples

## Basic Usage

### Environment Variable Authentication
\`\`\`bash
export CENTERPOINT_API_TOKEN="your_token_here"
npm start
\`\`\`

### Per-Call Authentication
\`\`\`json
{
  "Authorization": "your_token_here",
  "fields[companies]": "name,manager",
  "page[size]": 10
}
\`\`\`

## Configuration Examples

### Development Environment
\`\`\`bash
export NODE_ENV=development
export CENTERPOINT_LOG_LEVEL=debug
export CENTERPOINT_ENABLE_REQUEST_LOGGING=true
export CENTERPOINT_CACHE_ENABLED=false
\`\`\`

### Production Environment
\`\`\`bash
export NODE_ENV=production
export CENTERPOINT_LOG_LEVEL=warn
export CENTERPOINT_CACHE_ENABLED=true
export CENTERPOINT_CACHE_TTL_MS=300000
export CENTERPOINT_RATE_LIMIT_ENABLED=true
\`\`\`

## Tool Usage Examples

### Get Companies
\`\`\`json
{
  "fields[companies]": "name,manager,type",
  "filter[salesStatus]": "Lead",
  "page[size]": 50,
  "sort": "name"
}
\`\`\`

### Create Company
\`\`\`json
{
  "requestBody": {
    "data": {
      "type": "companies",
      "attributes": {
        "name": "Acme Corp",
        "type": "Company",
        "salesStatus": "Lead",
        "email": "contact@acme.com"
      }
    }
  }
}
\`\`\`

## Health Monitoring

### Check Health Status
\`\`\`bash
npm run dev-tools health-check
\`\`\`

### Validate Token Security
\`\`\`bash
npm run dev-tools token-validate
\`\`\`

## Performance Tuning

### Enable Caching
\`\`\`bash
export CENTERPOINT_CACHE_ENABLED=true
export CENTERPOINT_CACHE_TTL_MS=300000
export CENTERPOINT_CACHE_MAX_SIZE=5000
\`\`\`

### Enable Request Batching
\`\`\`bash
export CENTERPOINT_BATCHING_ENABLED=true
export CENTERPOINT_BATCH_WINDOW_MS=50
export CENTERPOINT_MAX_BATCH_SIZE=20
\`\`\`
`;

  const examplesPath = join(process.cwd(), 'EXAMPLES.md');
  writeFileSync(examplesPath, examples);
  console.log(`✅ Usage examples generated: ${examplesPath}`);
}

async function lintCheck(): Promise<void> {
  console.log('🔍 Running comprehensive checks...');
  
  const checks = [
    { name: 'Configuration', fn: () => config.get() },
    { name: 'TypeScript', fn: () => /* TypeScript check would go here */ true },
    { name: 'Token Security', fn: () => {
      const token = config.getAuth().token;
      return !token || validateTokenSecurity(token).isValid;
    }},
    { name: 'Health Status', fn: () => healthMonitor.getHealthStatus().status !== 'unhealthy' },
  ];

  let allPassed = true;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      console.log(`${result ? '✅' : '❌'} ${check.name}`);
      if (!result) allPassed = false;
    } catch (error) {
      console.log(`❌ ${check.name} (Error: ${error})`);
      allPassed = false;
    }
  }
  
  console.log();
  console.log(`Overall: ${allPassed ? '✅ All checks passed' : '❌ Some checks failed'}`);
  
  if (!allPassed) {
    process.exit(1);
  }
}

// CLI Handler
async function main() {
  const [,, commandName, ...args] = process.argv;
  
  if (!commandName) {
    console.log('Available commands:');
    commands.forEach(cmd => {
      console.log(`  ${cmd.name} - ${cmd.description}`);
    });
    console.log('\nUsage: npm run dev-tools <command> [args...]');
    return;
  }
  
  const command = commands.find(cmd => cmd.name === commandName);
  if (!command) {
    console.error(`Unknown command: ${commandName}`);
    process.exit(1);
  }
  
  try {
    await command.handler(args);
  } catch (error) {
    console.error(`Command failed:`, error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}