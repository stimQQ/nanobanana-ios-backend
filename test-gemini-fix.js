const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGeminiAPI() {
  try {
    console.log('Testing Gemini API with correct model...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = 'Create a detailed description for an image of a cute cat playing with a ball of yarn';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Success! Gemini API is working.');
    console.log('Response:', text.substring(0, 200) + '...');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testGeminiAPI();