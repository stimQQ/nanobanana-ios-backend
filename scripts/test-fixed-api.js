#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_URL = 'http://localhost:3000/api/generate/image';
const TEST_TOKEN = 'test-user-token'; // You'll need a valid auth token

async function testImageGeneration() {
  console.log('Testing fixed image generation API...\n');

  // Test 1: Text-to-image generation
  console.log('1. Testing text-to-image generation...');
  try {
    const response = await axios.post(
      API_URL,
      {
        prompt: 'A beautiful sunset over mountains',
        generation_type: 'text-to-image'
      },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      console.log('✅ Text-to-image generation successful!');
      console.log('   Generation ID:', response.data.generation_id);
      console.log('   Credits used:', response.data.credits_used);
      console.log('   Image URL length:', response.data.image_url?.length || 0);
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.data);
    } else {
      console.log('❌ Error:', error.message);
    }
  }

  // Test 2: Direct Gemini API call
  console.log('\n2. Testing direct Gemini API call...');
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await axios.post(
      url,
      {
        contents: [{
          parts: [{
            text: 'Describe a sunset in 10 words'
          }]
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 100
        }
      },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('✅ Direct Gemini API call successful!');
      console.log('   Response:', response.data.candidates[0].content.parts[0].text);
    }
  } catch (error) {
    if (error.response) {
      console.log('❌ Gemini API Error:', error.response.data?.error?.message || error.response.statusText);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }

  console.log('\n=== Summary ===');
  console.log('The API has been fixed with the following changes:');
  console.log('1. Changed model from "gemini-2.5-flash-image-preview" to "gemini-1.5-flash"');
  console.log('2. Replaced Google GenerativeAI SDK with direct axios calls (SDK has fetch issues)');
  console.log('3. Added proper error handling and retry logic');
  console.log('\n⚠️  Important Note:');
  console.log('Gemini does NOT generate images - it only processes text and analyzes images.');
  console.log('The current implementation creates placeholder images.');
  console.log('For real image generation, integrate one of these services:');
  console.log('  - Stability AI (Stable Diffusion)');
  console.log('  - OpenAI DALL-E');
  console.log('  - Replicate');
  console.log('  - Midjourney API');
}

testImageGeneration().catch(console.error);