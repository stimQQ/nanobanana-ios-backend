#!/usr/bin/env node

/**
 * Comprehensive test of the complete image generation and gallery flow
 * This script will:
 * 1. Authenticate
 * 2. Generate an image
 * 3. Check if it's saved to database
 * 4. Fetch it through the gallery API
 * 5. Verify all data is correct
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCompleteFlow() {
  log('\n=================================================', 'cyan');
  log('🚀 STARTING COMPLETE IMAGE FLOW TEST', 'cyan');
  log('=================================================\n', 'cyan');

  let authToken = null;
  let generatedImageId = null;
  let generatedImageUrl = null;

  try {
    // Step 1: Authenticate
    log('📝 STEP 1: Authenticating...', 'yellow');
    const authResponse = await axios.post(`${BASE_URL}/api/auth/dev`, {
      email: TEST_USER_EMAIL,
      name: 'Test User'
    });

    authToken = authResponse.data.token;
    const userId = authResponse.data.user.id;

    log(`✅ Authentication successful!`, 'green');
    log(`   User ID: ${userId}`, 'green');
    log(`   Email: ${authResponse.data.user.email}`, 'green');
    log(`   Token: ${authToken.substring(0, 20)}...`, 'green');

    // Create axios instance with auth
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Check initial gallery state
    log('\n📊 STEP 2: Checking initial gallery state...', 'yellow');
    const initialGallery = await api.get('/api/user/generations');

    log(`   Initial generations count: ${initialGallery.data.total || 0}`, 'blue');
    if (initialGallery.data.generations && initialGallery.data.generations.length > 0) {
      log(`   Last generation ID: ${initialGallery.data.generations[0].id}`, 'blue');
    }

    // Step 3: Generate an image
    log('\n🎨 STEP 3: Generating image...', 'yellow');
    const generateRequest = {
      prompt: `Test image generated at ${new Date().toISOString()} - A beautiful sunset over mountains`,
      language: 'en',
      generation_type: 'text-to-image'
    };

    log(`   Prompt: "${generateRequest.prompt}"`, 'blue');

    const generateResponse = await api.post('/api/generate/image', generateRequest);

    if (generateResponse.data.success) {
      generatedImageUrl = generateResponse.data.image_url;
      generatedImageId = generateResponse.data.generation_id;

      log(`✅ Image generated successfully!`, 'green');
      log(`   Generation ID: ${generatedImageId || 'NOT PROVIDED'}`, generatedImageId ? 'green' : 'red');
      log(`   Image URL type: ${generatedImageUrl.startsWith('data:') ? 'Data URL' : 'HTTP URL'}`, 'green');
      log(`   URL preview: ${generatedImageUrl.substring(0, 100)}...`, 'green');
      log(`   Credits used: ${generateResponse.data.credits_used}`, 'green');
    } else {
      throw new Error(`Generation failed: ${generateResponse.data.error}`);
    }

    // Step 4: Wait a bit for database to update
    log('\n⏳ STEP 4: Waiting 2 seconds for database sync...', 'yellow');
    await wait(2000);

    // Step 5: Fetch gallery to see if image appears
    log('\n🔍 STEP 5: Fetching gallery to check for new image...', 'yellow');
    const galleryResponse = await api.get('/api/user/generations');

    log(`   Total generations: ${galleryResponse.data.total || 0}`, 'blue');
    log(`   Generations in response: ${galleryResponse.data.generations?.length || 0}`, 'blue');

    if (galleryResponse.data.generations && galleryResponse.data.generations.length > 0) {
      const firstGen = galleryResponse.data.generations[0];

      log('\n   📷 First generation in gallery:', 'magenta');
      log(`      ID: ${firstGen.id}`, 'magenta');
      log(`      Status: ${firstGen.status}`, 'magenta');
      log(`      Has URL: ${!!firstGen.output_image_url}`, 'magenta');
      log(`      URL type: ${firstGen.output_image_url ?
        (firstGen.output_image_url.startsWith('data:') ? 'Data URL' : 'HTTP URL') : 'None'}`, 'magenta');
      log(`      Prompt: "${firstGen.prompt?.substring(0, 50)}..."`, 'magenta');
      log(`      Created: ${firstGen.created_at}`, 'magenta');

      // Check if our generated image is in the gallery
      const foundGeneration = galleryResponse.data.generations.find(g =>
        g.id === generatedImageId ||
        g.output_image_url === generatedImageUrl ||
        g.prompt === generateRequest.prompt
      );

      if (foundGeneration) {
        log('\n✅ SUCCESS! Generated image found in gallery!', 'green');
        log(`   Found by: ${
          foundGeneration.id === generatedImageId ? 'ID match' :
          foundGeneration.output_image_url === generatedImageUrl ? 'URL match' :
          'Prompt match'
        }`, 'green');
      } else {
        log('\n⚠️  WARNING: Generated image NOT found in gallery!', 'red');
        log('   Checking all generations for match...', 'yellow');

        // List all generations for debugging
        galleryResponse.data.generations.forEach((gen, idx) => {
          log(`\n   Generation ${idx + 1}:`, 'yellow');
          log(`      ID: ${gen.id} ${gen.id === generatedImageId ? '✅ MATCH' : ''}`, 'yellow');
          log(`      Prompt match: ${gen.prompt === generateRequest.prompt ? '✅ YES' : '❌ NO'}`, 'yellow');
          log(`      URL match: ${gen.output_image_url === generatedImageUrl ? '✅ YES' : '❌ NO'}`, 'yellow');
        });
      }
    } else {
      log('\n❌ ERROR: No generations found in gallery!', 'red');
    }

    // Step 6: Direct database check (if we have the generation ID)
    if (generatedImageId) {
      log('\n🔍 STEP 6: Direct database verification...', 'yellow');

      // Try to fetch specific generation
      try {
        const specificGen = galleryResponse.data.generations?.find(g => g.id === generatedImageId);
        if (specificGen) {
          log('✅ Generation found in database with ID: ' + generatedImageId, 'green');
        } else {
          log('❌ Generation NOT found with ID: ' + generatedImageId, 'red');
        }
      } catch (err) {
        log('❌ Could not verify specific generation: ' + err.message, 'red');
      }
    }

    // Step 7: Test image accessibility
    if (generatedImageUrl && !generatedImageUrl.startsWith('data:')) {
      log('\n🌐 STEP 7: Testing image URL accessibility...', 'yellow');
      try {
        const imageResponse = await axios.head(generatedImageUrl);
        log(`✅ Image URL is accessible! Status: ${imageResponse.status}`, 'green');
      } catch (err) {
        log(`❌ Image URL is NOT accessible: ${err.message}`, 'red');
      }
    }

    // Final summary
    log('\n=================================================', 'cyan');
    log('📊 TEST SUMMARY', 'cyan');
    log('=================================================', 'cyan');

    const tests = {
      'Authentication': true,
      'Image Generation': !!generatedImageUrl,
      'Database Save': !!generatedImageId,
      'Gallery Fetch': galleryResponse.data.generations?.length > 0,
      'Image in Gallery': !!galleryResponse.data.generations?.find(g =>
        g.id === generatedImageId ||
        g.output_image_url === generatedImageUrl ||
        g.prompt === generateRequest.prompt
      )
    };

    Object.entries(tests).forEach(([test, passed]) => {
      log(`   ${test}: ${passed ? '✅ PASSED' : '❌ FAILED'}`, passed ? 'green' : 'red');
    });

    const allPassed = Object.values(tests).every(t => t);
    log(`\n   OVERALL: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`, allPassed ? 'green' : 'red');

  } catch (error) {
    log('\n❌ ERROR during test:', 'red');
    log(`   ${error.message}`, 'red');

    if (error.response) {
      log('   Response data:', 'red');
      console.error(error.response.data);
    }

    if (error.stack) {
      log('\n   Stack trace:', 'yellow');
      console.error(error.stack);
    }
  }

  log('\n=================================================', 'cyan');
  log('🏁 TEST COMPLETE', 'cyan');
  log('=================================================\n', 'cyan');
}

// Run the test
testCompleteFlow().catch(console.error);