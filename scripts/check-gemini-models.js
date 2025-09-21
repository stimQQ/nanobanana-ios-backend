// Check available Gemini models
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env.local');
    return;
  }

  console.log('🔍 Checking available Gemini models...\n');

  try {
    // Try to list models using the API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    if (data.models) {
      console.log('📋 Available models:');
      data.models.forEach(model => {
        console.log(`\n✅ ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Supported Methods: ${model.supportedGenerationMethods?.join(', ') || 'N/A'}`);

        // Check if it supports image generation
        if (model.name.includes('image') || model.displayName?.toLowerCase().includes('image')) {
          console.log('   🖼️  This model might support image generation!');
        }
      });
    } else if (data.error) {
      console.error('❌ API Error:', data.error.message);
    }

    // Test specific models
    console.log('\n\n🧪 Testing specific models:');

    const modelsToTest = [
      'gemini-2.5-flash-image-preview',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-pro-vision'
    ];

    const genAI = new GoogleGenerativeAI(apiKey);

    for (const modelName of modelsToTest) {
      try {
        console.log(`\nTesting ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Test');
        console.log(`✅ ${modelName} is available!`);
      } catch (error) {
        console.log(`❌ ${modelName} is NOT available - ${error.message}`);
      }
    }

  } catch (error) {
    console.error('Error checking models:', error);
  }
}

checkModels();