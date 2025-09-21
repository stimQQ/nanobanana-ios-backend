#!/usr/bin/env node

const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:3000/api/generate/image';
const TEST_TOKEN = 'test-jwt-token'; // You'll need to provide a valid token

async function testImageGeneration() {
  console.log('Testing fixed image generation API...\n');

  const testCases = [
    {
      name: 'Simple text-to-image',
      body: {
        prompt: 'A beautiful sunset over mountains',
        generation_type: 'text-to-image',
        language: 'en'
      }
    },
    {
      name: 'Detailed prompt',
      body: {
        prompt: 'A futuristic city with flying cars and neon lights at night',
        generation_type: 'text-to-image',
        language: 'en'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Prompt: "${testCase.body.prompt}"`);

    try {
      const startTime = Date.now();

      const response = await axios.post(API_URL, testCase.body, {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutes
      });

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (response.data.success) {
        console.log(`✓ Success in ${elapsed}s`);
        console.log(`  Image URL: ${response.data.image_url}`);
        console.log(`  Credits used: ${response.data.credits_used}`);
        console.log(`  Remaining credits: ${response.data.remaining_credits}`);
      } else {
        console.log(`✗ Failed: ${response.data.error}`);
      }
    } catch (error) {
      if (error.response) {
        console.log(`✗ API Error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`✗ Timeout after 120 seconds`);
      } else {
        console.log(`✗ Error: ${error.message}`);
      }
    }

    console.log('---\n');
  }
}

// Direct test without authentication
async function testDirectAPI() {
  console.log('Testing direct Gemini API (no auth)...\n');

  const APICORE_API_KEY = 'sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI';

  try {
    const response = await axios.post(
      'https://api.apicore.ai/v1/chat/completions',
      {
        model: 'gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: 'Generate an image of: A cute cartoon cat'
          }
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${APICORE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      const content = response.data.choices[0].message.content;
      console.log('✓ Direct API works!');
      console.log('Response preview:', content.substring(0, 200) + '...');
    }
  } catch (error) {
    console.log('✗ Direct API failed:', error.message);
  }
}

// Run tests
console.log('='.repeat(50));
console.log('Image Generation API Test');
console.log('='.repeat(50) + '\n');

// First test direct API
testDirectAPI().then(() => {
  console.log('\n' + '='.repeat(50) + '\n');

  // Then test the full API with authentication
  console.log('Note: To test the full API, you need to provide a valid JWT token.');
  console.log('You can get one by logging in through the web interface.\n');

  if (TEST_TOKEN === 'test-jwt-token') {
    console.log('Skipping authenticated test (no valid token provided)');
  } else {
    testImageGeneration();
  }
});