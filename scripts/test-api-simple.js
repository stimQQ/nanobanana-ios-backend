#!/usr/bin/env node

/**
 * Simple test script for the NanoBanana API
 * Tests basic connectivity and endpoints
 */

const https = require('https');

const API_URL = 'https://nanobanana-ios-backend.vercel.app';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + endpoint);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 15000 // 15 second timeout
    };

    log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
    log(`Testing: ${method} ${endpoint}`, 'cyan');

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        log(`Response Status: ${res.statusCode}`, res.statusCode >= 200 && res.statusCode < 300 ? 'green' : 'red');
        log(`Response Time: ${duration}ms`, 'yellow');

        // Try to parse JSON response
        try {
          const jsonData = JSON.parse(data);
          log('Response:', 'blue');
          console.log(JSON.stringify(jsonData, null, 2));
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: jsonData });
        } catch (e) {
          // If not JSON, show raw response
          if (data.includes('<!DOCTYPE html>') || data.includes('<html')) {
            log('HTML Response (truncated):', 'yellow');
            console.log(data.substring(0, 200) + '...');
          } else {
            log('Response (raw):', 'yellow');
            console.log(data.substring(0, 500));
          }
          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => {
      log(`❌ Request failed: ${error.message}`, 'red');
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Send request body if present
    if (body) {
      const bodyData = JSON.stringify(body);
      req.write(bodyData);
    }

    req.end();
  });
}

async function runTests() {
  log('🚀 Starting NanoBanana API Connectivity Test', 'cyan');
  log(`Testing API at: ${API_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}`, 'blue');

  const tests = [
    { name: 'Main Page', endpoint: '/', method: 'GET' },
    { name: 'API Status', endpoint: '/api/status', method: 'GET' },
    { name: 'API Test', endpoint: '/api/test', method: 'GET' },
    {
      name: 'Image Generation (No Auth)',
      endpoint: '/api/generate/image',
      method: 'POST',
      body: { prompt: 'Test prompt' }
    }
  ];

  const results = [];

  for (const test of tests) {
    try {
      const result = await makeRequest(test.endpoint, test.method, test.body);
      results.push({ ...test, ...result });

      // Check specific endpoints
      if (test.endpoint === '/api/generate/image' && result.status === 401) {
        log('✅ Auth middleware is working (401 Unauthorized expected)', 'green');
      }
    } catch (error) {
      results.push({ ...test, success: false, error: error.message });
    }
  }

  // Summary
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log('📊 Test Summary', 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

  results.forEach(result => {
    const statusText = result.status ? `(${result.status})` : '';
    if (result.error) {
      log(`❌ ${result.name} - ${result.error}`, 'red');
    } else {
      const icon = result.success || (result.status === 401 && result.endpoint === '/api/generate/image') ? '✅' : '⚠️';
      const color = result.success ? 'green' : 'yellow';
      log(`${icon} ${result.name} ${statusText}`, color);
    }
  });

  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log('📝 Analysis:', 'cyan');

  // Check if the app is deployed
  const mainPageResult = results.find(r => r.endpoint === '/');
  if (mainPageResult && mainPageResult.success) {
    log('✅ App is deployed and accessible', 'green');
  } else {
    log('❌ App is not accessible at the specified URL', 'red');
  }

  // Check API endpoints
  const apiResults = results.filter(r => r.endpoint.startsWith('/api'));
  const workingApis = apiResults.filter(r => r.status && r.status < 500);

  if (workingApis.length > 0) {
    log(`✅ ${workingApis.length}/${apiResults.length} API endpoints are responding`, 'green');
  }

  // Check auth middleware
  const authTest = results.find(r => r.endpoint === '/api/generate/image');
  if (authTest && authTest.status === 401) {
    log('✅ Authentication middleware is properly configured', 'green');
  }

  log('\nNext steps:', 'blue');
  log('1. To test authenticated endpoints, you need to provide a valid auth token', 'blue');
  log('2. Check the browser console for any CORS or auth errors', 'blue');
  log('3. Verify environment variables are properly configured on Vercel', 'blue');
}

// Run the tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});