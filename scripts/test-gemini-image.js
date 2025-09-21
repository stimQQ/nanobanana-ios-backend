#!/usr/bin/env node

const axios = require('axios');

const APICORE_API_KEY = 'sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI';

async function testGeminiImageGeneration() {
  console.log('Testing Gemini image generation models...\n');

  // Test with chat completions endpoint using gemini image models
  const models = [
    'gemini-2.5-flash-image',
    'gemini-2.5-flash-image-hd',
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-exp-image-generation',
    'gpt-4o-image',
    'flux-kontext-max',
    'flux-kontext-pro'
  ];

  for (const model of models) {
    console.log(`\nTesting ${model}...`);

    try {
      // Try chat completions endpoint with image generation prompt
      const response = await axios.post(
        'https://api.apicore.ai/v1/chat/completions',
        {
          model: model,
          messages: [
            {
              role: 'user',
              content: 'Generate an image of: A beautiful sunset over mountains with golden clouds'
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
          timeout: 30000
        }
      );

      console.log(`  ✓ ${model} responded!`);

      if (response.data?.choices?.[0]?.message?.content) {
        const content = response.data.choices[0].message.content;

        // Check if content contains an image URL or base64 data
        if (content.includes('http') || content.includes('data:image')) {
          console.log('  Contains image data!');
          console.log('  Response preview:', content.substring(0, 200) + '...');
        } else {
          console.log('  Response:', content.substring(0, 200) + '...');
        }
      }

      // Also check if there's a different structure for image data
      if (response.data?.data?.[0]) {
        console.log('  Has data array:', JSON.stringify(response.data.data[0], null, 2).substring(0, 200));
      }

    } catch (error) {
      if (error.response?.status === 400 || error.response?.status === 503) {
        console.log(`  ✗ ${model}: ${error.response.data?.error?.message || error.response.statusText}`);
      } else if (error.code === 'ECONNABORTED') {
        console.log(`  ✗ ${model}: Timeout`);
      } else {
        console.log(`  ✗ ${model}: ${error.message}`);
      }
    }
  }
}

// Run test
testGeminiImageGeneration();