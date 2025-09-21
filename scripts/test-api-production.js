#!/usr/bin/env node

/**
 * Test script for the NanoBanana Image Generation API
 * Tests the production endpoint at https://nanobanana-ios-backend.vercel.app
 */

const https = require('https');

const API_URL = 'https://nanobanana-ios-backend.vercel.app';

// Test configurations
const tests = [
  {
    name: 'Test Image Generation API',
    endpoint: '/api/generate/image',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // You may need to adjust this based on your auth requirements
    },
    body: {
      prompt: 'A beautiful sunset over mountains with golden clouds',
      model: 'gemini-1.5-flash', // or whatever model you're using
      parameters: {
        width: 1024,
        height: 1024,
        num_images: 1
      }
    }
  },
  {
    name: 'Test Status Endpoint',
    endpoint: '/api/status',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }
];

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

function makeRequest(test) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + test.endpoint);

    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: test.method,
      headers: test.headers || {},
      timeout: 30000 // 30 second timeout
    };

    log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
    log(`Testing: ${test.name}`, 'cyan');
    log(`Endpoint: ${test.method} ${test.endpoint}`, 'blue');

    const startTime = Date.now();

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;

        log(`\nResponse Status: ${res.statusCode}`, res.statusCode >= 200 && res.statusCode < 300 ? 'green' : 'red');
        log(`Response Time: ${duration}ms`, 'yellow');

        // Log headers
        log('\nResponse Headers:', 'blue');
        Object.entries(res.headers).forEach(([key, value]) => {
          if (key.toLowerCase().includes('cors') ||
              key.toLowerCase().includes('origin') ||
              key.toLowerCase().includes('content-type')) {
            console.log(`  ${key}: ${value}`);
          }
        });

        // Try to parse JSON response
        try {
          const jsonData = JSON.parse(data);
          log('\nResponse Body:', 'blue');
          console.log(JSON.stringify(jsonData, null, 2));

          // Check for expected fields in image generation response
          if (test.endpoint === '/api/generate/image') {
            if (jsonData.error) {
              log(`\n❌ Error: ${jsonData.error}`, 'red');
            } else if (jsonData.images && jsonData.images.length > 0) {
              log(`\n✅ Success! Generated ${jsonData.images.length} image(s)`, 'green');
              if (jsonData.images[0].url) {
                log(`Image URL: ${jsonData.images[0].url}`, 'green');
              }
            } else {
              log(`\n⚠️ Unexpected response format`, 'yellow');
            }
          }

          resolve({ success: res.statusCode >= 200 && res.statusCode < 300, data: jsonData });
        } catch (e) {
          log('\nResponse Body (raw):', 'yellow');
          console.log(data.substring(0, 500)); // Limit output for readability

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: data });
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        }
      });
    });

    req.on('error', (error) => {
      log(`\n❌ Request failed: ${error.message}`, 'red');
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    // Send request body if present
    if (test.body) {
      const bodyData = JSON.stringify(test.body);
      log('\nRequest Body:', 'blue');
      console.log(JSON.stringify(test.body, null, 2));
      req.write(bodyData);
    }

    req.end();
  });
}

async function runTests() {
  log('🚀 Starting NanoBanana API Tests', 'cyan');
  log(`Testing API at: ${API_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}`, 'blue');

  const results = [];

  for (const test of tests) {
    try {
      const result = await makeRequest(test);
      results.push({ test: test.name, ...result });
    } catch (error) {
      results.push({ test: test.name, success: false, error: error.message });
      log(`\n❌ Test failed: ${error.message}`, 'red');
    }
  }

  // Summary
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log('📊 Test Summary', 'cyan');
  log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    log(`${status} - ${result.test}`, color);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  });

  log(`\nTotal: ${passed} passed, ${failed} failed`, passed === results.length ? 'green' : 'yellow');

  // Check API recommendations
  log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`, 'cyan');
  log('📝 Recommendations:', 'cyan');

  if (failed > 0) {
    log('• Fix failing endpoints before deployment', 'yellow');
  }

  log('• Ensure proper authentication is configured', 'blue');
  log('• Monitor API response times in production', 'blue');
  log('• Set up proper error logging and monitoring', 'blue');
  log('• Configure rate limiting for production', 'blue');

  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log(`\n Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});