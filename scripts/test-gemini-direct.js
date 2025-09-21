#!/usr/bin/env node

// Direct test of Gemini image generation without authentication
const axios = require('axios');

const APICORE_API_KEY = process.env.APICORE_API_KEY || 'sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI';

async function testGeminiDirect() {
  console.log('Testing Gemini image generation directly...\n');

  const testCases = [
    {
      name: 'Simple prompt',
      prompt: 'A cute cartoon cat'
    },
    {
      name: 'Detailed prompt',
      prompt: 'A futuristic cityscape at night with neon lights and flying cars'
    },
    {
      name: 'Artistic prompt',
      prompt: 'An oil painting of a serene lake surrounded by mountains during autumn'
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`Prompt: "${testCase.prompt}"`);

    try {
      const startTime = Date.now();

      const response = await axios.post(
        'https://api.apicore.ai/v1/chat/completions',
        {
          model: 'gemini-2.5-flash-image',
          messages: [
            {
              role: 'user',
              content: `Generate an image of: ${testCase.prompt}`
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
          timeout: 120000 // 2 minutes
        }
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✓ Success in ${elapsed}s`);

      if (response.data?.choices?.[0]?.message?.content) {
        const content = response.data.choices[0].message.content;

        // Extract URL from markdown format
        const urlMatch = content.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
        const base64Match = content.match(/!\[.*?\]\((data:image\/[^)]+)\)/);

        if (urlMatch && urlMatch[1]) {
          console.log(`  Image URL: ${urlMatch[1]}`);
        } else if (base64Match) {
          console.log(`  Base64 image received (length: ${base64Match[1].length} chars)`);
        } else {
          console.log(`  Response format not recognized`);
          console.log(`  Raw content: ${content.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      if (error.code === 'ECONNABORTED') {
        console.log(`✗ Timeout after 120 seconds`);
      } else if (error.response) {
        console.log(`✗ API Error: ${error.response.status} - ${error.response.data?.error?.message || error.response.statusText}`);
      } else {
        console.log(`✗ Error: ${error.message}`);
      }
    }

    console.log('---\n');
  }
}

// Run test
testGeminiDirect();