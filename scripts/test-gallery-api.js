const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

const API_BASE_URL = 'http://localhost:3000';

async function testGalleryAPI() {
  console.log('\n=== TESTING GALLERY API ENDPOINTS ===\n');

  try {
    // 1. First, authenticate using dev auth
    console.log('🔑 Authenticating with dev auth...');
    const authResponse = await axios.post(`${API_BASE_URL}/api/auth/dev`, {
      email: 'test-gallery@example.com',
      name: 'Gallery Test User'
    });

    const { token, user } = authResponse.data;
    console.log('✅ Authenticated successfully');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Credits: ${user.credits}`);

    // 2. Test fetching generations
    console.log('\n📊 Fetching user generations...');
    const generationsResponse = await axios.get(`${API_BASE_URL}/api/user/generations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 10,
        offset: 0
      }
    });

    const { generations, total } = generationsResponse.data;
    console.log(`✅ Fetched ${generations.length} generations (total: ${total})`);

    if (generations.length > 0) {
      console.log('\nGeneration details:');
      generations.forEach((gen, index) => {
        console.log(`\n${index + 1}. Generation ${gen.id.substring(0, 8)}...`);
        console.log(`   Status: ${gen.status}`);
        console.log(`   Type: ${gen.generation_type || 'unknown'}`);
        console.log(`   Prompt: ${gen.prompt?.substring(0, 50)}...`);
        console.log(`   Image URL: ${gen.output_image_url ? '✅ Present' : '❌ Missing'}`);
        if (gen.output_image_url) {
          console.log(`     URL preview: ${gen.output_image_url.substring(0, 80)}...`);
        }
        console.log(`   Created: ${gen.created_at}`);
      });
    } else {
      console.log('No generations found for this user.');
    }

    // 3. Test filtering by status
    console.log('\n📊 Testing status filter (completed only)...');
    const completedResponse = await axios.get(`${API_BASE_URL}/api/user/generations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 10,
        offset: 0,
        status: 'completed'
      }
    });

    const completedGens = completedResponse.data.generations;
    console.log(`✅ Found ${completedGens.length} completed generations`);

    // 4. Test generating a new image
    console.log('\n🎨 Testing image generation...');
    try {
      const generateResponse = await axios.post(
        `${API_BASE_URL}/api/generate/image`,
        {
          prompt: 'A cute cartoon cat playing with a ball of yarn',
          generation_type: 'text-to-image',
          language: 'en'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const generationResult = generateResponse.data;
      console.log('✅ Image generated successfully');
      console.log(`   Generation ID: ${generationResult.generation_id}`);
      console.log(`   Image URL: ${generationResult.image_url ? 'Present' : 'Missing'}`);
      console.log(`   Credits used: ${generationResult.credits_used}`);
      console.log(`   Remaining credits: ${generationResult.remaining_credits}`);

      if (generationResult.image_url) {
        console.log(`   URL: ${generationResult.image_url.substring(0, 100)}...`);
      }

      // 5. Verify the new generation appears in the gallery
      if (generationResult.generation_id) {
        console.log('\n🔍 Verifying new generation in gallery...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

        const verifyResponse = await axios.get(`${API_BASE_URL}/api/user/generations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            limit: 1,
            offset: 0
          }
        });

        const latestGen = verifyResponse.data.generations[0];
        if (latestGen && latestGen.id === generationResult.generation_id) {
          console.log('✅ New generation found in gallery!');
          console.log(`   Has image URL: ${latestGen.output_image_url ? 'Yes' : 'No'}`);
        } else {
          console.log('⚠️  New generation not found at top of gallery');
        }
      }
    } catch (genError) {
      console.log('❌ Image generation failed:', genError.response?.data?.error || genError.message);
    }

    // 6. Test pagination
    console.log('\n📄 Testing pagination...');
    const page2Response = await axios.get(`${API_BASE_URL}/api/user/generations`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 5,
        offset: 5
      }
    });

    console.log(`✅ Page 2: ${page2Response.data.generations.length} generations`);

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the test
testGalleryAPI().then(() => {
  console.log('\n=== API TEST COMPLETED ===\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});