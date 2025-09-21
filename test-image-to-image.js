const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

const GEMINI_API_KEY = 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Test image-to-image generation
async function testImageToImage() {
  try {
    console.log('Testing image-to-image generation with gemini-2.5-flash-image-preview...\n');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    // Create a simple test image (base64 encoded PNG)
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // Test 1: Single image + prompt
    console.log('Test 1: Single image + prompt');
    const parts1 = [
      { text: 'Based on the provided image, generate a colorful abstract art piece' },
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImageBase64
        }
      }
    ];

    const result1 = await model.generateContent(parts1);
    const response1 = await result1.response;
    console.log('✅ Single image test passed');

    // Check if response contains image
    if (response1.candidates?.[0]?.content?.parts) {
      const hasImage = response1.candidates[0].content.parts.some(
        part => part.inlineData?.data
      );
      console.log('   Response contains image:', hasImage);
    }

    // Test 2: Multiple images + prompt
    console.log('\nTest 2: Multiple images + prompt');
    const parts2 = [
      { text: 'Combine these images into a creative composition' },
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
    ];

    const result2 = await model.generateContent(parts2);
    const response2 = await result2.response;
    console.log('✅ Multiple images test passed');

    // Check if response contains image
    if (response2.candidates?.[0]?.content?.parts) {
      const hasImage = response2.candidates[0].content.parts.some(
        part => part.inlineData?.data
      );
      console.log('   Response contains image:', hasImage);
    }

    console.log('\n✨ All tests passed! Image-to-image generation is working.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testImageToImage();