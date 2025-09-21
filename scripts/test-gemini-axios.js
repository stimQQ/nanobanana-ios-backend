#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

async function testWithAxios() {
  console.log('Testing Gemini API with axios...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

  if (!API_KEY) {
    console.error('API Key not found in environment variables');
    return;
  }

  // Test different model names
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-2.0-flash-exp'
  ];

  for (const modelName of models) {
    console.log(`\nTesting model: ${modelName}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`;

    const body = {
      contents: [{
        parts: [{
          text: "Hello"
        }]
      }]
    };

    try {
      const response = await axios.post(url, body, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`✅ ${modelName} works!`);

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.log(`Response: ${response.data.candidates[0].content.parts[0].text.substring(0, 100)}`);
      }

      return modelName; // Return the first working model
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${modelName} - API Error ${error.response.status}:`, error.response.data?.error?.message || error.response.statusText);
      } else if (error.request) {
        console.log(`❌ ${modelName} - No response received (timeout or network error)`);
      } else {
        console.log(`❌ ${modelName} - Error:`, error.message);
      }
    }
  }

  return null;
}

async function main() {
  const workingModel = await testWithAxios();

  if (workingModel) {
    console.log('\n\n✅ SUCCESS! Use this model:', workingModel);
    console.log('\nUpdate your route.ts file to use:');
    console.log(`const GEMINI_IMAGE_MODEL = '${workingModel}';`);
  } else {
    console.log('\n\n❌ No working models found.');
    console.log('\nPossible issues:');
    console.log('1. API key may be invalid or expired');
    console.log('2. Generative Language API might not be enabled in Google Cloud Console');
    console.log('3. Network/firewall issues');
    console.log('\nTo fix:');
    console.log('1. Go to https://aistudio.google.com/apikey');
    console.log('2. Create a new API key or verify your existing one');
    console.log('3. Make sure the API is enabled in Google Cloud Console');
  }
}

main().catch(console.error);