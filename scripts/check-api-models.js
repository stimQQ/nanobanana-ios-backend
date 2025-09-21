#!/usr/bin/env node

const axios = require('axios');

const APICORE_API_KEY = 'sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI';

async function checkModels() {
  console.log('Checking available models on API Core...\n');

  try {
    // Try to list models
    const response = await axios.get('https://api.apicore.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${APICORE_API_KEY}`
      }
    });

    console.log('Available models:');
    if (response.data.data) {
      response.data.data.forEach((model) => {
        console.log(`  - ${model.id} (${model.object})`);
      });
    } else {
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error checking models:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Check image generation with different models
async function testImageGeneration() {
  const models = [
    'dall-e-3',
    'dall-e-2',
    'stable-diffusion-xl',
    'midjourney',
    'flux-1-schnell',
    'flux-1-dev',
    'sdxl-turbo'
  ];

  console.log('\nTesting image generation with different models...\n');

  for (const model of models) {
    console.log(`Testing ${model}...`);
    try {
      const response = await axios.post(
        'https://api.apicore.ai/v1/images/generations',
        {
          model: model,
          prompt: 'A simple test image',
          n: 1,
          size: '1024x1024'
        },
        {
          headers: {
            'Authorization': `Bearer ${APICORE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log(`  ✓ ${model} works!`);
      if (response.data?.data?.[0]?.url) {
        console.log(`    URL: ${response.data.data[0].url.substring(0, 50)}...`);
      }
    } catch (error) {
      if (error.response?.data?.error?.message) {
        console.log(`  ✗ ${model}: ${error.response.data.error.message}`);
      } else {
        console.log(`  ✗ ${model}: ${error.message}`);
      }
    }
  }
}

// Run checks
async function main() {
  await checkModels();
  await testImageGeneration();
}

main();