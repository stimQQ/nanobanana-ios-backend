const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    console.log(`\nTesting model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Say hello');
    const response = await result.response;
    console.log(`✅ ${modelName} works!`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName} failed: ${error.message}`);
    return false;
  }
}

async function main() {
  const models = [
    'gemini-2.5-flash-image-preview',
    'gemini-2.0-flash-exp',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-pro-vision'
  ];

  console.log('Testing available Gemini models...');

  for (const modelName of models) {
    await testModel(modelName);
  }
}

main();