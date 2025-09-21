#!/usr/bin/env node

// Test script for image generation API with authentication
require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BACKEND_URL = 'http://localhost:3003'; // Using port 3003 as detected

async function getDevToken() {
  console.log('Getting dev authentication token...');
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/dev`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    if (response.data.success && response.data.token) {
      console.log('✅ Got auth token');
      return response.data.token;
    }
  } catch (error) {
    console.error('❌ Failed to get dev token:', error.response?.data || error.message);
    return null;
  }
}

async function testImageGeneration(token) {
  console.log('\nTesting Image Generation API...');
  console.log('Backend URL:', BACKEND_URL);
  console.log('API Key configured:', !!process.env.GEMINI_API_KEY);

  try {
    console.log('\n1. Testing text-to-image generation...');
    const response = await axios.post(
      `${BACKEND_URL}/api/generate/image`,
      {
        prompt: 'A beautiful sunset over mountains with golden colors',
        generation_type: 'text-to-image'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      }
    );

    console.log('\n✅ Image generation successful!');
    console.log('Response status:', response.status);
    console.log('Response data:', {
      success: response.data.success,
      generation_id: response.data.generation_id,
      credits_used: response.data.credits_used,
      remaining_credits: response.data.remaining_credits,
      image_url_preview: response.data.image_url?.substring(0, 100) + '...'
    });

    return true;

  } catch (error) {
    console.error('\n❌ Image generation failed:');

    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', error.response.data);

      if (error.response.status === 500) {
        console.log('\n⚠️  Server Error Details:');
        console.log('Error message:', error.response.data.error);
        console.log('\nPossible causes:');
        console.log('1. GEMINI_API_KEY not properly configured');
        console.log('2. Invalid API key format');
        console.log('3. API quota exceeded');
        console.log('4. Model not available in your region');
        console.log('\nCheck server logs for more details');
      }

      if (error.response.status === 402) {
        console.log('\n⚠️  Insufficient credits');
        console.log('User needs more credits to generate images');
      }
    } else {
      console.error('Network error:', error.message);
    }

    return false;
  }
}

async function checkServerLogs() {
  console.log('\n📋 To view detailed server logs:');
  console.log('1. Check the terminal where "npm run dev" is running');
  console.log('2. Look for detailed error messages with stack traces');
  console.log('3. The improved logging should show:');
  console.log('   - API key validation status');
  console.log('   - Detailed Gemini API errors');
  console.log('   - Network issues');
  console.log('   - Model availability problems');
}

async function runTest() {
  console.log('=================================');
  console.log('Image Generation API Test');
  console.log('=================================\n');

  // Check environment
  console.log('Environment Check:');
  console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');

  // Get auth token
  const token = await getDevToken();

  if (!token) {
    console.error('\n❌ Cannot proceed without authentication token');
    return;
  }

  // Test image generation
  const success = await testImageGeneration(token);

  if (!success) {
    checkServerLogs();
  }

  console.log('\n=================================');
  console.log('Test Complete');
  console.log('=================================');
}

// Run the test
runTest().catch(console.error);