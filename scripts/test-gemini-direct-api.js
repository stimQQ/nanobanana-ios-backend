#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

async function testDirectAPI() {
  console.log('Testing direct Gemini API call...');
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

  if (!API_KEY) {
    console.error('API Key not found in environment variables');
    return;
  }

  // Try a simple API call with curl equivalent
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: "Hello, say hi back"
      }]
    }]
  };

  try {
    console.log('\nMaking direct API call to:', url.replace(API_KEY, 'API_KEY_HIDDEN'));

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ API call successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('\n❌ API call failed!');
      console.log('Error response:', JSON.stringify(data, null, 2));

      if (data.error?.message?.includes('API key not valid')) {
        console.log('\n⚠️  The API key appears to be invalid or not properly activated.');
        console.log('Please check:');
        console.log('1. The API key is correct');
        console.log('2. The Generative Language API is enabled in Google Cloud Console');
        console.log('3. The API key has proper restrictions/permissions');
      }
    }
  } catch (error) {
    console.error('\n❌ Network error:', error.message);
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
  }
}

// Also test listing available models
async function listModels() {
  console.log('\n\nTrying to list available models...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      console.log('Available models:');
      if (data.models && data.models.length > 0) {
        data.models.forEach(model => {
          console.log(`  - ${model.name} (${model.displayName})`);
          if (model.supportedGenerationMethods) {
            console.log(`    Supports: ${model.supportedGenerationMethods.join(', ')}`);
          }
        });
      }
    } else {
      console.log('Failed to list models:', data);
    }
  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

async function main() {
  await testDirectAPI();
  await listModels();
}

main().catch(console.error);