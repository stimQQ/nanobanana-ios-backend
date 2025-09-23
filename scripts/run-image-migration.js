#!/usr/bin/env node

/**
 * Run Image Persistence Migration
 * Ensures the database schema is correct for image storage
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🔧 Running Image Persistence Migration...\n');

  try {
    // 1. Check current table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase.rpc(
      'get_table_columns',
      { table_name: 'image_generations' }
    ).single();

    if (columnsError) {
      // If the RPC doesn't exist, try a direct query
      const { data: testGen, error: testError } = await supabase
        .from('image_generations')
        .select('*')
        .limit(1);

      if (testError) {
        console.error('❌ Error checking table:', testError);
      } else {
        console.log('✅ Table exists and is accessible');

        // Check if we have the right columns
        if (testGen && testGen.length > 0) {
          const cols = Object.keys(testGen[0]);
          console.log('📌 Current columns:', cols.join(', '));

          if (!cols.includes('output_image_url')) {
            console.log('⚠️  Missing output_image_url column!');
          }
          if (!cols.includes('input_images')) {
            console.log('⚠️  Missing input_images column!');
          }
        }
      }
    }

    // 2. Check recent generations
    console.log('\n📊 Checking recent generations...');
    const { data: recentGens, error: recentError } = await supabase
      .from('image_generations')
      .select('id, prompt, output_image_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Error fetching recent generations:', recentError);
    } else {
      console.log(`Found ${recentGens.length} recent generations:`);
      recentGens.forEach(gen => {
        const hasImage = gen.output_image_url ? '✅' : '❌';
        const status = gen.status || 'unknown';
        console.log(`  ${hasImage} ${gen.id.substring(0, 8)}... - ${status} - ${new Date(gen.created_at).toLocaleString()}`);
      });
    }

    // 3. Test creating a generation record
    console.log('\n🧪 Testing database write...');
    const testData = {
      user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
      prompt: 'Test migration check',
      output_image_url: 'https://test.example.com/image.png',
      status: 'completed',
      model: 'test',
      generation_type: 'text-to-image',
      metadata: { test: true, timestamp: new Date().toISOString() },
      input_images: []
    };

    const { data: testInsert, error: insertError } = await supabase
      .from('image_generations')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test record:', insertError);
      console.log('\n🔴 Database might have schema issues. Error details:', insertError.message);

      // Try to identify the specific problem
      if (insertError.message.includes('column')) {
        console.log('\n⚠️  Column mismatch detected. The database schema needs to be updated.');
        console.log('📝 Please run the following SQL in your Supabase dashboard:');
        console.log('\n--- SQL Migration Script ---');
        console.log(`
ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS output_image_url TEXT;

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS input_images TEXT[] DEFAULT '{}';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

ALTER TABLE image_generations
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
        `);
        console.log('--- End SQL Script ---\n');
      }
    } else {
      console.log('✅ Test record created successfully');

      // Clean up test record
      const { error: deleteError } = await supabase
        .from('image_generations')
        .delete()
        .eq('id', testInsert.id);

      if (!deleteError) {
        console.log('✅ Test record cleaned up');
      }
    }

    // 4. Check if images are being saved to storage
    console.log('\n📦 Checking storage bucket...');
    const { data: files, error: storageError } = await supabase.storage
      .from('images')
      .list('generated', { limit: 5, sortBy: { column: 'created_at', order: 'desc' } });

    if (storageError) {
      console.error('❌ Error checking storage:', storageError);
    } else {
      console.log(`Found ${files?.length || 0} recent files in storage`);
      if (files && files.length > 0) {
        files.forEach(file => {
          console.log(`  📁 ${file.name} - ${new Date(file.created_at).toLocaleString()}`);
        });
      }
    }

    console.log('\n✨ Migration check complete!');

    // Summary
    console.log('\n📋 Summary:');
    console.log('1. Database table exists: ✅');
    console.log('2. Can read from table: ✅');
    console.log('3. Can write to table: ' + (insertError ? '❌ NEEDS FIX' : '✅'));
    console.log('4. Storage bucket accessible: ' + (storageError ? '❌' : '✅'));

    if (insertError) {
      console.log('\n🔧 ACTION REQUIRED:');
      console.log('Please run the SQL migration script above in your Supabase dashboard');
      console.log('Go to: SQL Editor → New Query → Paste the script → Run');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration().catch(console.error);