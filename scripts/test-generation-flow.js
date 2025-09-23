const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testGenerationFlow() {
  console.log('\n=== TESTING IMAGE GENERATION PERSISTENCE FLOW ===\n');

  try {
    // 1. Get a real user for testing
    console.log('📋 Finding a test user...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, email, display_name, credits')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.error('❌ Could not find any users:', userError);
      return;
    }

    const testUser = users[0];
    console.log(`✅ Using user: ${testUser.email || testUser.display_name || testUser.id}`);
    console.log(`   Credits: ${testUser.credits}`);

    // 2. Check recent generations for this user
    console.log('\n📊 Checking recent generations for user...');
    const { data: userGenerations, error: genError } = await supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', testUser.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (genError) {
      console.error('❌ Error fetching user generations:', genError);
    } else {
      console.log(`✅ Found ${userGenerations?.length || 0} recent generations for this user`);
      if (userGenerations && userGenerations.length > 0) {
        userGenerations.forEach(gen => {
          console.log(`   - ${gen.id.substring(0, 8)}... | ${gen.status} | ${gen.generation_type || 'unknown'} | ${gen.output_image_url ? '✅ Has Image' : '❌ No Image'}`);
        });
      }
    }

    // 3. Test creating a new generation record
    console.log('\n🧪 Testing generation record creation...');
    const testGeneration = {
      user_id: testUser.id,
      prompt: `Test generation created at ${new Date().toISOString()}`,
      generation_type: 'text-to-image',
      output_image_url: `https://example.com/test-${Date.now()}.jpg`,
      status: 'completed',
      credits_used: 1,
      metadata: {
        test: true,
        timestamp: Date.now(),
        language: 'en'
      }
    };

    console.log('Creating test generation record...');
    const { data: newGen, error: insertError } = await supabase
      .from('image_generations')
      .insert(testGeneration)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Failed to create generation:', insertError);
    } else {
      console.log('✅ Generation created successfully:', {
        id: newGen.id,
        status: newGen.status,
        has_image_url: !!newGen.output_image_url
      });

      // 4. Verify it persists
      console.log('\n🔍 Verifying persistence...');
      const { data: verifyGen, error: verifyError } = await supabase
        .from('image_generations')
        .select('*')
        .eq('id', newGen.id)
        .single();

      if (verifyError) {
        console.error('❌ Could not verify generation:', verifyError);
      } else if (verifyGen) {
        console.log('✅ Generation persisted successfully');
        console.log('   Record details:', {
          id: verifyGen.id,
          user_id: verifyGen.user_id,
          prompt: verifyGen.prompt.substring(0, 50),
          generation_type: verifyGen.generation_type,
          output_image_url: verifyGen.output_image_url,
          status: verifyGen.status,
          created_at: verifyGen.created_at
        });
      } else {
        console.log('❌ Generation not found after creation!');
      }

      // 5. Test fetching all user generations (like the API does)
      console.log('\n📋 Testing API-style fetch...');
      const { data: allGenerations, error: fetchError, count } = await supabase
        .from('image_generations')
        .select('*', { count: 'exact' })
        .eq('user_id', testUser.id)
        .order('created_at', { ascending: false })
        .range(0, 19);

      if (fetchError) {
        console.error('❌ Error fetching generations:', fetchError);
      } else {
        console.log(`✅ API fetch successful: ${allGenerations?.length} generations (total: ${count})`);
        const testGenInList = allGenerations?.find(g => g.id === newGen.id);
        if (testGenInList) {
          console.log('✅ Test generation found in list');
        } else {
          console.log('❌ Test generation NOT found in list!');
        }
      }

      // 6. Clean up test record
      console.log('\n🧹 Cleaning up test record...');
      const { error: deleteError } = await supabase
        .from('image_generations')
        .delete()
        .eq('id', newGen.id);

      if (deleteError) {
        console.error('❌ Failed to delete test record:', deleteError);
      } else {
        console.log('✅ Test record deleted');
      }
    }

    // 7. Check for any generations with missing image URLs
    console.log('\n🔍 Checking for generations with missing images...');
    const { data: incompleteGens, error: incompleteError } = await supabase
      .from('image_generations')
      .select('id, user_id, status, output_image_url, created_at')
      .is('output_image_url', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!incompleteError && incompleteGens) {
      console.log(`Found ${incompleteGens.length} generations with missing images`);
      if (incompleteGens.length > 0) {
        console.log('Recent generations missing images:');
        incompleteGens.forEach(gen => {
          console.log(`   - ${gen.id.substring(0, 8)}... | Status: ${gen.status} | Created: ${gen.created_at}`);
        });
      }
    }

    // 8. Check storage bucket
    console.log('\n📦 Checking storage bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (!bucketError && buckets) {
      const imagesBucket = buckets.find(b => b.name === 'images');
      if (imagesBucket) {
        console.log('✅ Images bucket exists:', {
          name: imagesBucket.name,
          public: imagesBucket.public,
          created_at: imagesBucket.created_at
        });

        // List some files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('images')
          .list('generated', { limit: 5 });

        if (!filesError && files) {
          console.log(`📁 Found ${files.length} files in generated/ folder`);
          files.forEach(file => {
            console.log(`   - ${file.name} (${file.metadata?.size || 0} bytes)`);
          });
        }
      } else {
        console.log('❌ Images bucket not found!');
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testGenerationFlow().then(() => {
  console.log('\n=== TEST COMPLETED ===\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});