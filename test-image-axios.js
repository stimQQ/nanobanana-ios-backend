const axios = require('axios');

const GEMINI_API_KEY = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';

async function testImageToImage() {
  console.log('Testing image-to-image with axios...\n');

  // Small test image base64
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  // Test 1: Single image + prompt
  try {
    console.log('Test 1: Single image + prompt');
    const response1 = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: 'Based on this image, generate a colorful cat' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: testImageBase64
              }
            }
          ]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    console.log('✅ Single image test passed');
    const hasImage = response1.data.candidates?.[0]?.content?.parts?.some(
      part => part.inlineData?.data
    );
    console.log('   Response contains image:', hasImage);

  } catch (error) {
    console.log('❌ Single image test failed:', error.response?.data || error.message);
  }

  // Test 2: Multiple images + prompt
  try {
    console.log('\nTest 2: Multiple images + prompt');
    const response2 = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: 'Combine these images to create a new artistic image' },
            {
              inlineData: {
                mimeType: 'image/png',
                data: testImageBase64
              }
            },
            {
              inlineData: {
                mimeType: 'image/png',
                data: testImageBase64
              }
            }
          ]
        }]
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    console.log('✅ Multiple images test passed');
    const hasImage = response2.data.candidates?.[0]?.content?.parts?.some(
      part => part.inlineData?.data
    );
    console.log('   Response contains image:', hasImage);

  } catch (error) {
    console.log('❌ Multiple images test failed:', error.response?.data || error.message);
  }
}

testImageToImage();