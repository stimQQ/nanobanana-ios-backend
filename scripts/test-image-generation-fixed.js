// Test script for image generation API
require('dotenv').config({ path: '.env.local' });

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function testImageGeneration() {
  console.log('Testing Image Generation API...\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('API Key configured:', !!process.env.GEMINI_API_KEY);

  // First, let's get a test token (you might need to adjust this based on your auth setup)
  const testToken = 'test-token'; // You'll need to get a real token from your auth system

  try {
    console.log('\n1. Testing text-to-image generation...');
    const response = await fetch(`${BACKEND_URL}/api/generate/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        prompt: 'A beautiful sunset over mountains',
        generation_type: 'text-to-image'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (response.status === 500) {
      console.log('\n⚠️  Server returned 500 error');
      console.log('Error details:', data.error);
      console.log('\nPossible causes:');
      console.log('1. GEMINI_API_KEY not set in .env.local');
      console.log('2. Invalid API key');
      console.log('3. Network issues');
      console.log('4. Model not available in your region');
    }

    if (response.status === 401) {
      console.log('\n⚠️  Authentication required');
      console.log('You need to provide a valid auth token');
    }

    if (response.ok && data.success) {
      console.log('\n✅ Image generation successful!');
      console.log('Generation ID:', data.generation_id);
      console.log('Image URL preview:', data.image_url?.substring(0, 100) + '...');
    }

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
  }
}

// Check environment variables
console.log('\n=== Environment Check ===');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Not set');
console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'Not set (using default)');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set');

// Run the test
testImageGeneration().catch(console.error);