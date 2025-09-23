#!/usr/bin/env node

/**
 * Debug script to identify gallery refresh issues
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const BASE_URL = 'http://localhost:3000';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors
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

async function debugGalleryIssue() {
  log('\n=================================================', 'cyan');
  log('🔍 DEBUGGING GALLERY REFRESH ISSUE', 'cyan');
  log('=================================================\n', 'cyan');

  let authToken = null;
  let userId = null;

  try {
    // Step 1: Authenticate
    log('STEP 1: Authenticating...', 'yellow');
    const authResponse = await axios.post(`${BASE_URL}/api/auth/dev`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    authToken = authResponse.data.token;
    userId = authResponse.data.user.id;
    log(`✅ Authenticated as user: ${userId}`, 'green');

    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Check what's in the database directly
    log('\nSTEP 2: Direct database query...', 'yellow');
    const { data: dbGenerations, error: dbError } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (dbError) {
      log(`❌ Database error: ${dbError.message}`, 'red');
    } else {
      log(`✅ Found ${dbGenerations.length} generations in database for user`, 'green');
      dbGenerations.forEach((gen, idx) => {
        log(`  ${idx + 1}. ID: ${gen.id}`, 'blue');
        log(`     Status: ${gen.status}`, 'blue');
        log(`     Has URL: ${!!gen.output_image_url}`, 'blue');
        log(`     Created: ${gen.created_at}`, 'blue');
      });
    }

    // Step 3: Check what the API returns
    log('\nSTEP 3: API endpoint test...', 'yellow');
    const apiResponse = await api.get('/api/user/generations');

    log(`✅ API returned ${apiResponse.data.generations?.length || 0} generations`, 'green');
    log(`   Total count: ${apiResponse.data.total}`, 'green');

    // Step 4: Compare database vs API
    log('\nSTEP 4: Comparing database vs API...', 'yellow');

    const dbIds = new Set(dbGenerations.map(g => g.id));
    const apiIds = new Set(apiResponse.data.generations?.map(g => g.id) || []);

    const inDbNotApi = [...dbIds].filter(id => !apiIds.has(id));
    const inApiNotDb = [...apiIds].filter(id => !dbIds.has(id));

    if (inDbNotApi.length > 0) {
      log(`⚠️  Found ${inDbNotApi.length} generations in DB but not in API:`, 'red');
      inDbNotApi.forEach(id => log(`   - ${id}`, 'red'));
    }

    if (inApiNotDb.length > 0) {
      log(`⚠️  Found ${inApiNotDb.length} generations in API but not in DB query:`, 'red');
      inApiNotDb.forEach(id => log(`   - ${id}`, 'red'));
    }

    if (inDbNotApi.length === 0 && inApiNotDb.length === 0) {
      log('✅ Database and API are in sync', 'green');
    }

    // Step 5: Generate a new image
    log('\nSTEP 5: Generating new image...', 'yellow');
    const generateResponse = await api.post('/api/generate/image', {
      prompt: `Debug test at ${new Date().toISOString()} - Rainbow colored butterflies`,
      language: 'en',
      generation_type: 'text-to-image'
    });

    const generationId = generateResponse.data.generation_id;
    log(`✅ Generated image with ID: ${generationId}`, 'green');

    // Step 6: Check if it's in the database immediately
    log('\nSTEP 6: Checking database immediately...', 'yellow');
    await new Promise(r => setTimeout(r, 1000)); // Wait 1 second

    const { data: newGen, error: newGenError } = await supabase
      .from('image_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (newGenError) {
      log(`❌ Could not find new generation in database: ${newGenError.message}`, 'red');
    } else {
      log('✅ New generation found in database:', 'green');
      log(`   Status: ${newGen.status}`, 'green');
      log(`   Has URL: ${!!newGen.output_image_url}`, 'green');
      log(`   URL type: ${newGen.output_image_url?.startsWith('data:') ? 'Data URL' : 'HTTP URL'}`, 'green');
    }

    // Step 7: Check if API returns it
    log('\nSTEP 7: Checking API response...', 'yellow');
    const apiResponse2 = await api.get('/api/user/generations');

    const foundInApi = apiResponse2.data.generations?.find(g => g.id === generationId);
    if (foundInApi) {
      log('✅ New generation found in API response', 'green');
      log(`   Position: ${apiResponse2.data.generations.findIndex(g => g.id === generationId) + 1}`, 'green');
    } else {
      log('❌ New generation NOT found in API response', 'red');
      log(`   API returned ${apiResponse2.data.generations?.length || 0} items`, 'red');
      log('   First few IDs:', 'red');
      apiResponse2.data.generations?.slice(0, 3).forEach((g, idx) => {
        log(`     ${idx + 1}. ${g.id}`, 'red');
      });
    }

    // Step 8: Test with different user
    log('\nSTEP 8: Testing with different user...', 'yellow');
    const auth2Response = await axios.post(`${BASE_URL}/api/auth/dev`, {
      email: 'test2@example.com',
      name: 'Test User 2'
    });

    const api2 = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${auth2Response.data.token}`,
        'Content-Type': 'application/json'
      }
    });

    const api2Response = await api2.get('/api/user/generations');
    log(`✅ User 2 has ${api2Response.data.total || 0} generations (should be different)`, 'green');

    // Step 9: Check for caching issues
    log('\nSTEP 9: Testing for caching issues...', 'yellow');

    // Make 3 rapid requests
    const rapidRequests = await Promise.all([
      api.get('/api/user/generations'),
      api.get('/api/user/generations'),
      api.get('/api/user/generations')
    ]);

    const counts = rapidRequests.map(r => r.data.generations?.length || 0);
    if (counts.every(c => c === counts[0])) {
      log(`✅ All 3 requests returned same count: ${counts[0]}`, 'green');
    } else {
      log(`⚠️  Inconsistent results: ${counts.join(', ')}`, 'red');
    }

    // Final summary
    log('\n=================================================', 'cyan');
    log('📊 DIAGNOSIS SUMMARY', 'cyan');
    log('=================================================', 'cyan');

    const issues = [];

    if (dbGenerations.length !== apiResponse.data.generations?.length) {
      issues.push('Database and API return different counts');
    }

    if (!foundInApi) {
      issues.push('Newly generated images not appearing in API');
    }

    if (apiResponse2.data.generations?.some(g => !g.output_image_url)) {
      issues.push('Some generations missing URLs');
    }

    if (issues.length === 0) {
      log('✅ No issues detected - system working correctly', 'green');
    } else {
      log('⚠️  Issues detected:', 'red');
      issues.forEach(issue => log(`   - ${issue}`, 'red'));
    }

  } catch (error) {
    log('\n❌ Error during debug:', 'red');
    log(`   ${error.message}`, 'red');
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }

  log('\n=================================================', 'cyan');
  log('🏁 DEBUG COMPLETE', 'cyan');
  log('=================================================\n', 'cyan');
}

// Run debug
debugGalleryIssue().catch(console.error);