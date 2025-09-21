#!/usr/bin/env node

// Test script for Gemini 2.5 Flash Image Preview model
// This tests the actual image generation capability

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config({ path: '.env.local' });

async function testTextToImage() {
  console.log('\n--- Testing Text-to-Image Generation ---\n');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const prompt = "Create a picture of a nano banana dish in a fancy restaurant with a Gemini theme";

  try {
    console.log('Prompt:', prompt);
    console.log('Generating image...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
    });

    let imageFound = false;

    if (response.candidates && response.candidates[0]) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log('Text response:', part.text);
        } else if (part.inlineData) {
          console.log('✅ Image generated successfully!');
          console.log('Image data length:', part.inlineData.data.length);
          console.log('First 100 chars of base64:', part.inlineData.data.substring(0, 100) + '...');
          imageFound = true;

          // Save image to file for verification
          const fs = require('fs');
          const path = require('path');
          const outputPath = path.join(__dirname, 'test-output.png');
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(outputPath, buffer);
          console.log('Image saved to:', outputPath);
        }
      }
    }

    if (!imageFound) {
      console.log('❌ No image was generated in the response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testImageToImage() {
  console.log('\n--- Testing Image-to-Image Generation ---\n');

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const fs = require('fs');
  const path = require('path');

  // Create a simple test image if it doesn't exist
  const testImagePath = path.join(__dirname, '..', 'test.png');
  if (!fs.existsSync(testImagePath)) {
    console.log('Test image not found, skipping image-to-image test');
    return;
  }

  const imageBuffer = fs.readFileSync(testImagePath);
  const base64Image = imageBuffer.toString('base64');

  const prompt = [
    { text: "Transform this image into a futuristic sci-fi version with neon colors and cyberpunk aesthetic" },
    {
      inlineData: {
        mimeType: "image/png",
        data: base64Image,
      },
    },
  ];

  try {
    console.log('Input image loaded, generating transformed image...');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      contents: prompt,
    });

    let imageFound = false;

    if (response.candidates && response.candidates[0]) {
      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          console.log('Text response:', part.text);
        } else if (part.inlineData) {
          console.log('✅ Image transformation successful!');
          console.log('Image data length:', part.inlineData.data.length);
          imageFound = true;

          // Save transformed image
          const outputPath = path.join(__dirname, 'test-transformed.png');
          const buffer = Buffer.from(part.inlineData.data, 'base64');
          fs.writeFileSync(outputPath, buffer);
          console.log('Transformed image saved to:', outputPath);
        }
      }
    }

    if (!imageFound) {
      console.log('❌ No image was generated in the response');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function main() {
  console.log('===========================================');
  console.log('Gemini 2.5 Flash Image Preview Test');
  console.log('===========================================');

  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in environment variables');
    process.exit(1);
  }

  await testTextToImage();
  await testImageToImage();

  console.log('\n===========================================');
  console.log('Test complete!');
  console.log('===========================================');
}

main().catch(console.error);