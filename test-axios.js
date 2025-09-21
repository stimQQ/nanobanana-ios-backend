const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';

async function testGeminiDirect() {
  console.log('Testing Gemini API directly with axios...');

  const models = [
    'gemini-2.5-flash-image-preview',
    'gemini-1.5-flash',
    'gemini-pro'
  ];

  for (const modelName of models) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: 'Generate an image of a cute cat'
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      console.log(`✅ ${modelName} works!`);
      console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 300));

    } catch (error) {
      console.log(`❌ ${modelName} failed:`);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data);
      } else {
        console.log('Error:', error.message);
      }
    }
  }
}

testGeminiDirect();