#!/usr/bin/env node

const axios = require('axios');

const API_URL = 'http://localhost:3009';

async function testImageGeneration() {
  console.log('Testing Image Generation API...\n');

  try {
    // Step 1: Login as dev user
    console.log('1. Logging in as dev user...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/dev`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log(`✓ Logged in successfully as ${user.email}`);
    console.log(`  Credits: ${user.credits}`);
    console.log(`  Free attempts: ${user.free_attempts}\n`);

    // Step 2: Test image generation
    console.log('2. Testing text-to-image generation...');
    try {
      const generateResponse = await axios.post(
        `${API_URL}/api/generate/image`,
        {
          prompt: 'A beautiful sunset over mountains',
          generation_type: 'text-to-image'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✓ Image generation successful!');
      console.log('  Response:', JSON.stringify(generateResponse.data, null, 2));
    } catch (genError) {
      console.error('✗ Image generation failed:');
      console.error('  Status:', genError.response?.status);
      console.error('  Error:', genError.response?.data || genError.message);

      if (genError.response?.data?.details) {
        console.error('  API Details:', JSON.stringify(genError.response.data.details, null, 2));
      }
    }

  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testImageGeneration();