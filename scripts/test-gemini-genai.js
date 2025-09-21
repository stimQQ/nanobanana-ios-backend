#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Check if API key is set
if (!process.env.GEMINI_API_KEY) {
  console.error('ERROR: GEMINI_API_KEY is not set in environment variables');
  console.log('Please add GEMINI_API_KEY to your .env.local file');
  process.exit(1);
}

console.log('Testing Google Generative AI SDK with gemini-2.5-flash-image-preview model...\n');

// Initialize the SDK
const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testTextToImage() {
  console.log('1. Testing Text-to-Image Generation:');
  console.log('   Prompt: "A serene Japanese garden with cherry blossoms and a red bridge"');

  try {
    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });
    const result = await model.generateContent('Generate an image: A serene Japanese garden with cherry blossoms and a red bridge');

    const response = await result.response;
    console.log('   Response received:', response ? 'Success' : 'Failed');

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];
      console.log('   Candidate parts:', candidate.content?.parts?.length || 0);

      // Check for image data
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            console.log('   ✓ Image generated successfully (base64 data received)');
            console.log('   MIME type:', part.inlineData.mimeType);
            console.log('   Data size:', part.inlineData.data?.length || 0, 'characters');
            return true;
          }
          if (part.text) {
            console.log('   Text response:', part.text.substring(0, 100));
          }
        }
      }
    }

    console.log('   ✗ No image data found in response');
    console.log('   Full response structure:', JSON.stringify(response, null, 2));
  } catch (error) {
    console.error('   ✗ Error:', error.message);
    if (error.response) {
      console.error('   Response data:', error.response);
    }
  }

  return false;
}

async function testImageToImage() {
  console.log('\n2. Testing Image-to-Image Generation:');
  console.log('   Creating a small test image...');

  try {
    // Create a simple 1x1 red pixel as base64
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    // Build the content with image and text
    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImageBase64
        }
      },
      { text: 'Transform this into a beautiful sunset landscape' }
    ];

    console.log('   Sending image + prompt to model...');
    const result = await model.generateContent(contents);

    const response = await result.response;
    console.log('   Response received:', response ? 'Success' : 'Failed');

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      // Check for image data
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            console.log('   ✓ Image transformation successful (base64 data received)');
            console.log('   MIME type:', part.inlineData.mimeType);
            console.log('   Data size:', part.inlineData.data?.length || 0, 'characters');
            return true;
          }
          if (part.text) {
            console.log('   Text response:', part.text.substring(0, 100));
          }
        }
      }
    }

    console.log('   ✗ No transformed image found in response');
  } catch (error) {
    console.error('   ✗ Error:', error.message);
  }

  return false;
}

async function testMultiImageEdit() {
  console.log('\n3. Testing Multi-Image Editing:');
  console.log('   Creating multiple test images...');

  try {
    // Create two simple test images
    const testImage1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg=='; // Red pixel
    const testImage2 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // Blue pixel

    const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    // Build the content with multiple images and text
    const contents = [
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImage1
        }
      },
      {
        inlineData: {
          mimeType: 'image/png',
          data: testImage2
        }
      },
      { text: 'Combine these images into a creative artwork' }
    ];

    console.log('   Sending 2 images + prompt to model...');
    const result = await model.generateContent(contents);

    const response = await result.response;
    console.log('   Response received:', response ? 'Success' : 'Failed');

    if (response.candidates && response.candidates[0]) {
      const candidate = response.candidates[0];

      // Check for image data
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.inlineData) {
            console.log('   ✓ Multi-image editing successful (base64 data received)');
            console.log('   MIME type:', part.inlineData.mimeType);
            console.log('   Data size:', part.inlineData.data?.length || 0, 'characters');
            return true;
          }
          if (part.text) {
            console.log('   Text response:', part.text.substring(0, 100));
          }
        }
      }
    }

    console.log('   ✗ No combined image found in response');
  } catch (error) {
    console.error('   ✗ Error:', error.message);
  }

  return false;
}

async function main() {
  console.log('Starting tests with Google Generative AI SDK...\n');
  console.log('API Key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...\n');

  const results = {
    textToImage: await testTextToImage(),
    imageToImage: await testImageToImage(),
    multiImage: await testMultiImageEdit()
  };

  console.log('\n' + '='.repeat(50));
  console.log('TEST RESULTS:');
  console.log('='.repeat(50));
  console.log(`Text-to-Image: ${results.textToImage ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Image-to-Image: ${results.imageToImage ? '✓ PASSED' : '✗ FAILED'}`);
  console.log(`Multi-Image Edit: ${results.multiImage ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('='.repeat(50));

  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n✅ All tests passed! The Google Generative AI SDK is working correctly.');
    console.log('\nNOTE: The gemini-2.5-flash-image-preview model may not always return');
    console.log('image data directly. You might need to adjust the response parsing');
    console.log('based on the actual API behavior.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
    console.log('\nPossible issues:');
    console.log('1. The model name might be incorrect');
    console.log('2. The API key might not have access to this model');
    console.log('3. The response format might be different than expected');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);