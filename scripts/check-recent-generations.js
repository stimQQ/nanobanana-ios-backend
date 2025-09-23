const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentGenerations() {
  console.log('\n=== CHECKING RECENT SUCCESSFUL GENERATIONS ===\n');

  try {
    // 1. Get all successful generations from the last 24 hours
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    console.log('📊 Fetching successful generations from the last 24 hours...');
    const { data: recentGenerations, error: recentError, count } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact' })
      .eq('status', 'completed')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    if (recentError) {
      console.error('❌ Error fetching recent generations:', recentError);
      return;
    }

    console.log(`✅ Found ${count} successful generations in the last 24 hours`);

    if (recentGenerations && recentGenerations.length > 0) {
      console.log('\n📋 Recent successful generations:');
      recentGenerations.forEach(gen => {
        console.log('\n' + '='.repeat(60));
        console.log('ID:', gen.id);
        console.log('User ID:', gen.user_id);
        console.log('Status:', gen.status);
        console.log('Type:', gen.generation_type || 'Not specified');
        console.log('Prompt:', gen.prompt?.substring(0, 100) + (gen.prompt?.length > 100 ? '...' : ''));
        console.log('Output Image URL:', gen.output_image_url ? '✅ Present' : '❌ Missing');
        if (gen.output_image_url) {
          console.log('  URL:', gen.output_image_url.substring(0, 100) + '...');
        }
        console.log('Input Images:', gen.input_images?.length > 0 ? `${gen.input_images.length} images` : 'None');
        console.log('Credits Used:', gen.credits_used || 'Not specified');
        console.log('Created At:', gen.created_at);
        console.log('Metadata:', JSON.stringify(gen.metadata));
      });
    }

    // 2. Group by user to see who's actively using the system
    console.log('\n📊 Active users (with successful generations):');
    const userGenerations = {};
    recentGenerations?.forEach(gen => {
      if (!userGenerations[gen.user_id]) {
        userGenerations[gen.user_id] = {
          count: 0,
          latest: gen.created_at,
          types: new Set()
        };
      }
      userGenerations[gen.user_id].count++;
      if (gen.generation_type) {
        userGenerations[gen.user_id].types.add(gen.generation_type);
      }
    });

    for (const [userId, stats] of Object.entries(userGenerations)) {
      // Get user info
      const { data: user } = await supabase
        .from('users')
        .select('email, display_name')
        .eq('id', userId)
        .single();

      console.log(`\nUser: ${user?.email || user?.display_name || userId}`);
      console.log(`  - Generations: ${stats.count}`);
      console.log(`  - Types: ${Array.from(stats.types).join(', ') || 'unknown'}`);
      console.log(`  - Latest: ${stats.latest}`);
    }

    // 3. Check for any patterns in failed generations
    console.log('\n📊 Failed generations analysis:');
    const { data: failedGenerations, count: failedCount } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact' })
      .eq('status', 'failed')
      .gte('created_at', twentyFourHoursAgo.toISOString())
      .order('created_at', { ascending: false });

    console.log(`❌ ${failedCount} failed generations in the last 24 hours`);

    if (failedGenerations && failedGenerations.length > 0) {
      console.log('\nSample of failed generations:');
      failedGenerations.slice(0, 3).forEach(gen => {
        console.log(`  - ${gen.id.substring(0, 8)}...`);
        console.log(`    Error: ${gen.error_message || 'No error message'}`);
        console.log(`    Type: ${gen.generation_type || 'unknown'}`);
        console.log(`    Created: ${gen.created_at}`);
      });
    }

    // 4. Check storage for recent files
    console.log('\n📦 Checking recent files in storage...');
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('images')
      .list('generated', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (!storageError && storageFiles) {
      console.log(`Found ${storageFiles.length} recent files in storage:`);
      storageFiles.forEach(file => {
        console.log(`  - ${file.name}`);
        console.log(`    Size: ${file.metadata?.size || 0} bytes`);
        console.log(`    Created: ${file.created_at}`);

        // Generate the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('images')
          .getPublicUrl(`generated/${file.name}`);
        console.log(`    Public URL: ${publicUrl}`);
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkRecentGenerations().then(() => {
  console.log('\n=== CHECK COMPLETED ===\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});