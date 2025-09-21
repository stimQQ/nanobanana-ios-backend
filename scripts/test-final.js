#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3000';

async function testComplete() {
  console.log('='.repeat(60));
  console.log('COMPLETE API TEST - Image Generation');
  console.log('='.repeat(60));
  console.log();

  try {
    // 1. Test Health
    console.log('1. Testing API Health...');
    const healthResponse = await axios.get(`${API_URL}/api/health`);
    console.log('✓ API is healthy');
    console.log(`  Database: ${healthResponse.data.checks.database}`);
    console.log();

    // 2. Login as dev user
    console.log('2. Logging in as test user...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/dev`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✓ Logged in successfully`);
    console.log(`  User: ${user.email}`);
    console.log(`  Credits: ${user.credits}`);
    console.log();

    // 3. Test text-to-image generation
    console.log('3. Testing text-to-image generation...');
    try {
      const generateResponse = await axios.post(
        `${API_URL}/api/generate/image`,
        {
          prompt: 'A futuristic city with flying cars at sunset',
          generation_type: 'text-to-image'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('✓ Image generated successfully!');
      console.log(`  Generation ID: ${generateResponse.data.generation_id}`);
      console.log(`  Image URL: ${generateResponse.data.image_url}`);
      console.log(`  Credits used: ${generateResponse.data.credits_used}`);
      console.log(`  Remaining credits: ${generateResponse.data.remaining_credits}`);
    } catch (genError) {
      console.error('✗ Image generation failed:');
      console.error(`  Status: ${genError.response?.status}`);
      console.error(`  Error: ${genError.response?.data?.error || genError.message}`);
    }

    console.log();

    // 4. Check user generations
    console.log('4. Checking user generations...');
    const generationsResponse = await axios.get(
      `${API_URL}/api/user/generations`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log(`✓ Retrieved ${generationsResponse.data.generations.length} generations`);
    if (generationsResponse.data.generations.length > 0) {
      const latest = generationsResponse.data.generations[0];
      console.log(`  Latest: ${latest.prompt.substring(0, 50)}...`);
      console.log(`  Status: ${latest.status}`);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testComplete();