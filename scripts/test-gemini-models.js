#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test different model names
const modelsToTest = [
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-pro',
  'gemini-pro-vision',
  'gemini-2.0-flash-exp'
];

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}`);
    const model = genai.getGenerativeModel({ model: modelName });

    // Test with a simple text prompt
    const result = await model.generateContent('Say hello in one word');
    const response = await result.response;
    const text = response.text();

    console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('Testing available Gemini models...');
  console.log('API Key:', process.env.GEMINI_API_KEY ? 'Found' : 'NOT FOUND');

  const results = [];
  for (const modelName of modelsToTest) {
    const success = await testModel(modelName);
    results.push({ model: modelName, success });
  }

  console.log('\n=== Summary ===');
  const workingModels = results.filter(r => r.success);
  if (workingModels.length > 0) {
    console.log('Working models:');
    workingModels.forEach(r => console.log(`  - ${r.model}`));

    // Recommend the best model for image generation
    console.log('\nRecommended for image generation:');
    if (workingModels.find(r => r.model.includes('gemini-1.5-flash'))) {
      console.log('  - gemini-1.5-flash (fast and efficient)');
    } else if (workingModels.find(r => r.model.includes('gemini-1.5-pro'))) {
      console.log('  - gemini-1.5-pro (more capable but slower)');
    }
  } else {
    console.log('No working models found. Please check your API key.');
  }
}

main().catch(console.error);