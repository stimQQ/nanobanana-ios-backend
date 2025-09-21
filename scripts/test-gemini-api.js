#!/usr/bin/env node

const axios = require('axios');

// Get API URL from command line or use localhost
const API_URL = process.argv[2] || 'http://localhost:3000';
const TEST_TOKEN = process.env.TEST_TOKEN || 'test-token-123';

async function testGeminiImageGeneration() {
  console.log(`Testing Gemini image generation API at ${API_URL}...\n`);

  try {
    console.log('1. Testing text-to-image generation...');
    const response = await axios.post(
      `${API_URL}/api/generate/image`,
      {
        prompt: 'A beautiful sunset over mountains with golden clouds',
        generation_type: 'text-to-image'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        },
        timeout: 120000 // 2 minutes timeout
      }
    );

    if (response.data.success) {
      console.log('✓ Text-to-image generation successful!');
      console.log('  Generation ID:', response.data.generation_id);
      console.log('  Image URL:', response.data.image_url);
      console.log('  Credits used:', response.data.credits_used);
      console.log('  Remaining credits:', response.data.remaining_credits);
    } else {
      console.log('✗ Generation failed:', response.data.error);
    }

  } catch (error) {
    if (error.response) {
      console.error('✗ API Error:', error.response.status, '-', error.response.data?.error || error.response.statusText);
      if (error.response.data?.details) {
        console.error('  Details:', JSON.stringify(error.response.data.details, null, 2));
      }
    } else if (error.code === 'ECONNREFUSED') {
      console.error('✗ Cannot connect to API. Make sure the server is running.');
    } else if (error.code === 'ECONNABORTED') {
      console.error('✗ Request timeout - Gemini might be taking too long to generate');
    } else {
      console.error('✗ Error:', error.message);
    }
  }

  console.log('\n2. Testing image-to-image generation...');
  try {
    const response = await axios.post(
      `${API_URL}/api/generate/image`,
      {
        prompt: 'Transform this image into a watercolor painting style',
        generation_type: 'image-to-image',
        input_images: ['https://example.com/sample-image.jpg'] // Replace with actual image URL
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept-Language': 'en'
        },
        timeout: 120000
      }
    );

    if (response.data.success) {
      console.log('✓ Image-to-image generation successful!');
      console.log('  Generation ID:', response.data.generation_id);
      console.log('  Image URL:', response.data.image_url);
    } else {
      console.log('✗ Generation failed:', response.data.error);
    }

  } catch (error) {
    if (error.response) {
      console.error('✗ API Error:', error.response.status, '-', error.response.data?.error || error.response.statusText);
    } else {
      console.error('✗ Error:', error.message);
    }
  }
}

// Run test
testGeminiImageGeneration();