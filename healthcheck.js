#!/usr/bin/env node

/**
 * Health Check Script for ElizaOS DEX Agent
 * Used by Docker containers to verify service health
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/health',
  method: 'GET',
  timeout: 3000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.log(`❌ Health check failed: HTTP ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (error) => {
  console.log(`❌ Health check failed: ${error.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check failed: Timeout');
  req.destroy();
  process.exit(1);
});

req.setTimeout(3000);
req.end(); 