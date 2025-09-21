const axios = require('axios');

// Test configuration
const API_URL = 'http://localhost:3000/api/generate/image';
const AUTH_TOKEN = 'test-token'; // You'll need a valid auth token

async function testImageGeneration() {
  console.log('Testing Image Generation API\n');
  console.log('=' .repeat(50));

  // Test 1: Text-to-Image
  console.log('\n📝 Test 1: Text-to-Image Generation');
  try {
    const response = await axios.post(
      API_URL,
      {
        prompt: 'A cute cat playing with a ball',
        generation_type: 'text-to-image',
        language: 'en'
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.success && response.data.image_url) {
      console.log('✅ Text-to-image generation successful');
      console.log('   Image URL:', response.data.image_url.substring(0, 50) + '...');
    } else {
      console.log('❌ Text-to-image failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Text-to-image error:', error.response?.data?.error || error.message);
  }

  // Test 2: Image-to-Image (single image)
  console.log('\n🖼️ Test 2: Image-to-Image Generation (Single Image)');
  try {
    // Use a small test image
    const testImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const response = await axios.post(
      API_URL,
      {
        prompt: 'Transform this into a colorful landscape',
        generation_type: 'image-to-image',
        input_images: [testImageUrl],
        language: 'en'
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.success && response.data.image_url) {
      console.log('✅ Image-to-image generation successful');
      console.log('   Image URL:', response.data.image_url.substring(0, 50) + '...');
    } else {
      console.log('❌ Image-to-image failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Image-to-image error:', error.response?.data?.error || error.message);
  }

  // Test 3: Multi-Image Generation
  console.log('\n🖼️🖼️ Test 3: Multi-Image Generation');
  try {
    // Use multiple test images
    const testImages = [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    ];

    const response = await axios.post(
      API_URL,
      {
        prompt: 'Combine these images into an artistic composition',
        generation_type: 'image-to-image',
        input_images: testImages,
        language: 'en'
      },
      {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    if (response.data.success && response.data.image_url) {
      console.log('✅ Multi-image generation successful');
      console.log('   Image URL:', response.data.image_url.substring(0, 50) + '...');
    } else {
      console.log('❌ Multi-image failed:', response.data.error);
    }
  } catch (error) {
    console.log('❌ Multi-image error:', error.response?.data?.error || error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Testing complete!\n');
}

// Run the tests
testImageGeneration().catch(console.error);

console.log(`
Note: To run this test properly, you need:
1. The Next.js server running on localhost:3000
2. A valid authentication token
3. Sufficient credits in the test account
`);