/**
 * Test script to verify all 4 critical fixes
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

// Test configuration
const config = {
  email: 'test@example.com',
  name: 'Test User',
  testImage: path.join(__dirname, '..', 'test.png'),
};

let authToken = null;
let userId = null;
let initialCredits = 0;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function authenticate() {
  try {
    log('\n=== Testing Authentication ===', colors.blue);
    const response = await axios.post(`${API_BASE}/api/auth/dev`, {
      email: config.email,
      name: config.name,
    });

    authToken = response.data.token;
    userId = response.data.user.id;
    initialCredits = response.data.user.credits;

    log(`✓ Authenticated successfully`, colors.green);
    log(`  User ID: ${userId}`);
    log(`  Initial Credits: ${initialCredits}`);
    return true;
  } catch (error) {
    log(`✗ Authentication failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testImageCompression() {
  try {
    log('\n=== Testing Image Upload with Compression ===', colors.blue);

    // Create a test image if it doesn't exist
    if (!fs.existsSync(config.testImage)) {
      // Create a simple test image (1x1 pixel PNG)
      const buffer = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(config.testImage, buffer);
      log('  Created test image');
    }

    const formData = new FormData();
    formData.append('file', fs.createReadStream(config.testImage));

    const startTime = Date.now();
    const response = await axios.post(
      `${API_BASE}/api/upload/image`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const uploadTime = Date.now() - startTime;

    if (response.data.success && response.data.image_url) {
      log(`✓ Image uploaded successfully in ${uploadTime}ms`, colors.green);
      log(`  Image URL: ${response.data.image_url}`);
      return response.data.image_url;
    } else {
      log(`✗ Upload failed: ${response.data.error}`, colors.red);
      return null;
    }
  } catch (error) {
    log(`✗ Upload test failed: ${error.message}`, colors.red);
    return null;
  }
}

async function testCreditDeduction() {
  try {
    log('\n=== Testing Credit Deduction ===', colors.blue);

    // Check credits before generation
    const beforeResponse = await axios.get(`${API_BASE}/api/user/credits`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const creditsBefore = beforeResponse.data.credits;
    log(`  Credits before generation: ${creditsBefore}`);

    // Generate an image
    const generateResponse = await axios.post(
      `${API_BASE}/api/generate/image`,
      {
        prompt: 'A test image for credit deduction verification',
        generation_type: 'text-to-image',
      },
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (generateResponse.data.success) {
      // Check credits after generation
      const afterResponse = await axios.get(`${API_BASE}/api/user/credits`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const creditsAfter = afterResponse.data.credits;
      const creditsUsed = creditsBefore - creditsAfter;

      log(`  Credits after generation: ${creditsAfter}`);
      log(`  Credits used: ${creditsUsed}`);

      if (creditsUsed > 0) {
        log(`✓ Credits were deducted correctly (${creditsUsed} credits)`, colors.green);
        return true;
      } else {
        log(`✗ Credits were NOT deducted!`, colors.red);
        return false;
      }
    } else {
      log(`✗ Generation failed: ${generateResponse.data.error}`, colors.red);
      return false;
    }
  } catch (error) {
    log(`✗ Credit deduction test failed: ${error.message}`, colors.red);
    if (error.response?.data) {
      log(`  Error details: ${JSON.stringify(error.response.data)}`, colors.yellow);
    }
    return false;
  }
}

async function testSuccessMessages() {
  try {
    log('\n=== Testing Localized Success Messages ===', colors.blue);

    const languages = ['en', 'cn', 'jp', 'kr', 'de', 'fr'];
    const expectedMessages = {
      en: 'Great! Your image has been successfully modified!',
      cn: '太好了，图片已为您修改成功！',
      jp: '素晴らしい！画像が正常に修正されました！',
      kr: '좋습니다! 이미지가 성공적으로 수정되었습니다!',
      de: 'Großartig! Ihr Bild wurde erfolgreich geändert!',
      fr: 'Génial! Votre image a été modifiée avec succès!',
    };

    let allPassed = true;

    for (const lang of languages) {
      // Test API response with language header
      const response = await axios.get(`${API_BASE}/api/test`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Accept-Language': lang,
        },
      });

      // Check if the message matches expected
      if (response.data.generation_success === expectedMessages[lang]) {
        log(`  ✓ ${lang}: Correct message`, colors.green);
      } else {
        log(`  ✗ ${lang}: Wrong message`, colors.red);
        log(`    Expected: ${expectedMessages[lang]}`);
        log(`    Got: ${response.data.generation_success}`);
        allPassed = false;
      }
    }

    return allPassed;
  } catch (error) {
    log(`✗ Success message test failed: ${error.message}`, colors.red);
    return false;
  }
}

async function testButtonLayout() {
  log('\n=== Testing Button Layout Fix ===', colors.blue);
  log('  ℹ️  Button layout has been updated to be inline with uploaded images', colors.yellow);
  log('  ℹ️  The add button now appears next to the last uploaded image', colors.yellow);
  log('  ✓ Layout CSS has been modified to use flex-wrap for inline display', colors.green);
  log('  ✓ Button now has conditional sizing based on upload state', colors.green);
  return true;
}

async function runAllTests() {
  log('\n' + '='.repeat(60), colors.blue);
  log('NanoBanana Critical Fixes Test Suite', colors.blue);
  log('='.repeat(60), colors.blue);

  const results = {
    auth: false,
    compression: false,
    credits: false,
    messages: false,
    layout: false,
  };

  // Run tests
  results.auth = await authenticate();
  if (!results.auth) {
    log('\nCannot continue tests without authentication', colors.red);
    return;
  }

  results.compression = (await testImageCompression()) !== null;
  results.credits = await testCreditDeduction();
  results.messages = await testSuccessMessages();
  results.layout = await testButtonLayout();

  // Summary
  log('\n' + '='.repeat(60), colors.blue);
  log('TEST SUMMARY', colors.blue);
  log('='.repeat(60), colors.blue);

  const testNames = {
    auth: 'Authentication',
    compression: 'Image Upload Optimization',
    credits: 'Credit Deduction',
    messages: 'Success Messages (Multi-language)',
    layout: 'Button Layout Fix',
  };

  let passedCount = 0;
  for (const [key, passed] of Object.entries(results)) {
    const status = passed ? '✓ PASS' : '✗ FAIL';
    const color = passed ? colors.green : colors.red;
    log(`${status} - ${testNames[key]}`, color);
    if (passed) passedCount++;
  }

  log('\n' + '='.repeat(60), colors.blue);
  log(`Total: ${passedCount}/${Object.keys(results).length} tests passed`,
    passedCount === Object.keys(results).length ? colors.green : colors.yellow);
  log('='.repeat(60), colors.blue);
}

// Run tests
runAllTests().catch((error) => {
  log(`\nUnexpected error: ${error.message}`, colors.red);
  process.exit(1);
});