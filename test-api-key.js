const axios = require('axios');

// Test APICore API
async function testAPICore() {
  console.log('Testing APICore API...');
  try {
    const response = await axios.post(
      'https://api.apicore.ai/v1/chat/completions',
      {
        model: 'gemini-2.5-flash',
        messages: [{ role: 'user', content: 'test' }]
      },
      {
        headers: {
          'Authorization': 'Bearer sk-uZ37YcpL8Cil4MBqJErYNpzgrIbM0W77r33I3mFyce1kjGZI',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('APICore Success:', response.status);
  } catch (error) {
    console.log('APICore Error:', error.response?.data || error.message);
  }
}

// Test Google Gemini API directly
async function testGeminiDirect() {
  console.log('\nTesting Google Gemini API directly...');
  try {
    const response = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE',
      {
        contents: [{
          parts: [{
            text: 'Generate a creative image of: a cute cat'
          }]
        }]
      }
    );
    console.log('Gemini Direct Success:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2).substring(0, 500));
  } catch (error) {
    console.log('Gemini Direct Error:', error.response?.data || error.message);
  }
}

async function main() {
  await testAPICore();
  await testGeminiDirect();
}

main();