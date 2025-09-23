#!/usr/bin/env node

/**
 * Test script to verify image generation and persistence
 * This script will:
 * 1. Authenticate a test user
 * 2. Generate an image
 * 3. Verify it's saved in the database
 * 4. Fetch the gallery to confirm it persists
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-persistence@example.com';
const TEST_NAME = 'Image Persistence Test';

let authToken = null;
let userId = null;
let generationId = null;

async function authenticate() {
  console.log('\n1. Authenticating test user...');
  try {
    const response = await axios.post(`${API_URL}/api/auth/dev`, {
      email: TEST_EMAIL,
      name: TEST_NAME
    });

    authToken = response.data.token;
    userId = response.data.user.id;

    console.log('✅ Authentication successful');
    console.log('   User ID:', userId);
    console.log('   Token:', authToken.substring(0, 20) + '...');

    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return false;
  }
}

async function generateImage() {
  console.log('\n2. Generating test image...');
  try {
    const response = await axios.post(
      `${API_URL}/api/generate/image`,
      {
        prompt: 'A beautiful sunset over mountains with golden clouds',
        generation_type: 'text-to-image',
        language: 'en'
      },
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = response.data;

    if (data.success && data.image_url) {
      console.log('✅ Image generated successfully');
      console.log('   Generation ID:', data.generation_id);
      console.log('   Image URL:', data.image_url.substring(0, 50) + '...');
      console.log('   Credits used:', data.credits_used);

      generationId = data.generation_id;

      // Check if it's a data URL or a proper storage URL
      if (data.image_url.startsWith('data:')) {
        console.log('⚠️  WARNING: Image is stored as data URL, not in storage bucket');
        console.log('   This means storage upload might be failing');
      } else if (data.image_url.includes('supabase')) {
        console.log('✅ Image properly stored in Supabase storage');
      }

      return data.image_url;
    } else {
      console.error('❌ Image generation failed:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Image generation error:', error.response?.data || error.message);
    return null;
  }
}

async function fetchGallery() {
  console.log('\n3. Fetching gallery to verify persistence...');
  try {
    const response = await axios.get(
      `${API_URL}/api/user/generations`,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          limit: 5,
          offset: 0
        }
      }
    );

    const data = response.data;

    if (data.success && data.generations) {
      console.log('✅ Gallery fetched successfully');
      console.log('   Total generations:', data.total);
      console.log('   Fetched:', data.generations.length);

      // Look for our recent generation
      const recentGeneration = data.generations.find(g =>
        g.prompt.includes('sunset over mountains')
      );

      if (recentGeneration) {
        console.log('\n✅ Recent generation found in gallery:');
        console.log('   ID:', recentGeneration.id);
        console.log('   Status:', recentGeneration.status);
        console.log('   Image URL:', recentGeneration.output_image_url ?
          recentGeneration.output_image_url.substring(0, 50) + '...' :
          'NO URL - THIS IS THE PROBLEM!'
        );
        console.log('   Created:', new Date(recentGeneration.created_at).toLocaleString());

        if (!recentGeneration.output_image_url) {
          console.error('\n❌ CRITICAL ISSUE: Image URL not saved in database!');
          console.log('   The image was generated but not persisted.');
          console.log('   This confirms the data persistence issue.');
        } else if (recentGeneration.output_image_url.startsWith('data:')) {
          console.warn('\n⚠️  WARNING: Image stored as data URL in database');
          console.log('   This means Supabase storage upload is failing.');
        } else {
          console.log('\n✅ SUCCESS: Image properly persisted in database and storage!');
        }

        return recentGeneration;
      } else {
        console.warn('⚠️  Generation not found in recent gallery items');
        console.log('   Available generations:');
        data.generations.forEach((g, i) => {
          console.log(`   ${i + 1}. ${g.prompt.substring(0, 30)}... (${g.status})`);
        });
        return null;
      }
    } else {
      console.error('❌ Failed to fetch gallery:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Gallery fetch error:', error.response?.data || error.message);
    return null;
  }
}

async function checkDirectDatabase() {
  console.log('\n4. Checking database directly (if generation ID available)...');

  if (!generationId) {
    console.log('   Skipping: No generation ID available');
    return;
  }

  // This would require direct database access
  // For now, we rely on the API endpoint
  console.log('   Generation ID to check:', generationId);
  console.log('   (Direct database check would require Supabase admin access)');
}

async function runTest() {
  console.log('========================================');
  console.log('Image Generation & Persistence Test');
  console.log('========================================');
  console.log('API URL:', API_URL);
  console.log('Starting test at:', new Date().toLocaleString());

  // Step 1: Authenticate
  const authSuccess = await authenticate();
  if (!authSuccess) {
    console.error('\n❌ Test failed: Could not authenticate');
    process.exit(1);
  }

  // Step 2: Generate image
  const imageUrl = await generateImage();
  if (!imageUrl) {
    console.error('\n❌ Test failed: Could not generate image');
    process.exit(1);
  }

  // Step 3: Wait a moment for database to update
  console.log('\n   Waiting 2 seconds for database update...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 4: Fetch gallery
  const galleryItem = await fetchGallery();

  // Step 5: Check database directly
  await checkDirectDatabase();

  // Summary
  console.log('\n========================================');
  console.log('Test Summary');
  console.log('========================================');

  if (galleryItem && galleryItem.output_image_url && !galleryItem.output_image_url.startsWith('data:')) {
    console.log('✅ SUCCESS: Images are properly persisting!');
    console.log('   - Image generated successfully');
    console.log('   - Image saved to Supabase storage');
    console.log('   - Image URL saved to database');
    console.log('   - Image appears in gallery after refresh');
  } else if (galleryItem && galleryItem.output_image_url && galleryItem.output_image_url.startsWith('data:')) {
    console.log('⚠️  PARTIAL SUCCESS: Images persist but storage upload failing');
    console.log('   - Image generated successfully');
    console.log('   - Storage upload failed (using data URL fallback)');
    console.log('   - Image URL saved to database (as data URL)');
    console.log('   - Image appears in gallery but may be slow to load');
  } else {
    console.log('❌ FAILURE: Images not persisting properly');
    console.log('   - Check the error logs above for details');
    console.log('   - Most likely the database insert is failing');
  }

  console.log('\nTest completed at:', new Date().toLocaleString());
  console.log('========================================\n');
}

// Run the test
runTest().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});