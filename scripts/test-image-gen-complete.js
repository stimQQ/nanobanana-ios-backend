#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GEMINI_API_KEY;

async function testWithSDK() {
  console.log('Testing Google GenerativeAI SDK with gemini-1.5-flash...');

  try {
    const genai = new GoogleGenerativeAI(API_KEY);
    const model = genai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Test text generation
    console.log('\n1. Testing text generation...');
    const result = await model.generateContent('Describe a beautiful sunset in 20 words or less');
    const response = await result.response;
    const text = response.text();
    console.log('✅ Text generation works!');
    console.log('Response:', text);

    // Test with image description prompt (simulating image generation)
    console.log('\n2. Testing image description prompt...');
    const imagePrompt = 'Create a detailed description of: A futuristic city with flying cars and neon lights at night';
    const imageResult = await model.generateContent(imagePrompt);
    const imageResponse = await imageResult.response;
    const imageText = imageResponse.text();
    console.log('✅ Image description works!');
    console.log('Response:', imageText.substring(0, 200) + '...');

    return true;
  } catch (error) {
    console.error('❌ SDK Error:', error.message);
    console.error('Full error:', error);
    return false;
  }
}

async function testWithAxiosDirectly() {
  console.log('\n\nTesting direct API call with axios for comparison...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  const body = {
    contents: [{
      parts: [{
        text: "Describe a beautiful sunset in 20 words or less"
      }]
    }],
    generationConfig: {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    }
  };

  try {
    const response = await axios.post(url, body, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Direct API call works!');

    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log('Response:', response.data.candidates[0].content.parts[0].text);
    }

    return true;
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data?.error?.message || error.response.statusText);
    } else {
      console.error('❌ Network Error:', error.message);
    }
    return false;
  }
}

async function checkModelCapabilities() {
  console.log('\n\nChecking model capabilities...');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash?key=${API_KEY}`;

  try {
    const response = await axios.get(url, {
      timeout: 10000
    });

    if (response.data) {
      console.log('Model info:');
      console.log('  Name:', response.data.name);
      console.log('  Display name:', response.data.displayName);
      console.log('  Description:', response.data.description);
      console.log('  Supported methods:', response.data.supportedGenerationMethods);
      console.log('  Input token limit:', response.data.inputTokenLimit);
      console.log('  Output token limit:', response.data.outputTokenLimit);
    }
  } catch (error) {
    console.error('Could not get model info:', error.message);
  }
}

async function main() {
  console.log('API Key:', API_KEY ? `${API_KEY.substring(0, 10)}...` : 'NOT FOUND');

  if (!API_KEY) {
    console.error('API Key not found in environment variables');
    return;
  }

  const sdkWorks = await testWithSDK();
  const axiosWorks = await testWithAxiosDirectly();
  await checkModelCapabilities();

  console.log('\n\n=== SUMMARY ===');
  console.log('SDK works:', sdkWorks ? '✅' : '❌');
  console.log('Direct API works:', axiosWorks ? '✅' : '❌');

  if (!sdkWorks && axiosWorks) {
    console.log('\n⚠️  The SDK has issues but the API works directly.');
    console.log('Consider using axios directly in your route instead of the SDK.');
  }

  console.log('\n📝 IMPORTANT NOTES:');
  console.log('1. Gemini 1.5 Flash does NOT generate images - it only processes text and analyzes images');
  console.log('2. For actual image generation, you need a different service like:');
  console.log('   - Stability AI (Stable Diffusion)');
  console.log('   - DALL-E (OpenAI)');
  console.log('   - Midjourney API');
  console.log('   - Replicate (various models)');
  console.log('3. Gemini can be used to enhance prompts or analyze uploaded images');
}

main().catch(console.error);