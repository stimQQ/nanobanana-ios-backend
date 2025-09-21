#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

// Test the Google GenAI SDK implementation
async function testGoogleGenAI() {
  const { GoogleGenAI } = require('@google/genai');

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDvjN4w54QMfvUF3TzMmpP6_H3pR-ngxhE';
  const GEMINI_MODEL = 'gemini-2.5-flash-image-preview';

  console.log('Testing Google GenAI SDK implementation...');
  console.log('API Key:', GEMINI_API_KEY ? 'Set' : 'Not set');
  console.log('Model:', GEMINI_MODEL);

  try {
    // Initialize the client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    console.log('✅ Client initialized successfully');

    // Test text-to-image
    console.log('\n1. Testing text-to-image generation...');
    const textToImageResult = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: "A beautiful sunset over mountains"
    });

    if (textToImageResult.candidates && textToImageResult.candidates[0]) {
      const parts = textToImageResult.candidates[0].content.parts;
      let imageFound = false;

      if (parts && Array.isArray(parts)) {
        for (const part of parts) {
          if (part && (part.inlineData || part.image)) {
            console.log('✅ Image generated successfully!');
            imageFound = true;
            break;
          }
        }
      }

      if (!imageFound) {
        console.log('⚠️ No image in response, but call succeeded');
      }
    }

    // Test image-to-image (with mock base64 image)
    console.log('\n2. Testing image-to-image generation (mock)...');

    // Create a simple 1x1 pixel red image as base64
    const mockBase64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const imageToImageResult = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          image: mockBase64Image,
          mimeType: "image/png"
        },
        "Transform this into a colorful abstract art"
      ]
    });

    if (imageToImageResult.candidates && imageToImageResult.candidates[0]) {
      const parts = imageToImageResult.candidates[0].content.parts;
      let imageFound = false;

      if (parts && Array.isArray(parts)) {
        for (const part of parts) {
          if (part && (part.inlineData || part.image)) {
            console.log('✅ Image transformation successful!');
            imageFound = true;
            break;
          }
        }
      }

      if (!imageFound) {
        console.log('⚠️ No image in response, but call succeeded');
      }
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Error during testing:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testGoogleGenAI().catch(console.error);