const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabasePersistence() {
  console.log('\n=== TESTING DATABASE PERSISTENCE FOR GENERATED IMAGES ===\n');

  try {
    // 1. First, let's check the actual schema of image_generations table
    console.log('📋 Checking image_generations table schema...');
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'image_generations')
      .eq('table_schema', 'public')
      .order('ordinal_position');

    if (schemaError) {
      console.error('❌ Error fetching schema:', schemaError);
    } else if (columns && columns.length > 0) {
      console.log('✅ image_generations table columns:');
      columns.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''}${col.column_default ? `, DEFAULT: ${col.column_default}` : ''})`);
      });
    } else {
      console.log('❌ No columns found or table does not exist');
    }

    // 2. Check if there are any existing records
    console.log('\n📊 Checking existing records in image_generations...');
    const { data: existingRecords, error: existingError } = await supabase
      .from('image_generations')
      .select('id, user_id, prompt, generation_type, output_image_url, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (existingError) {
      console.error('❌ Error fetching existing records:', existingError);
    } else {
      console.log(`✅ Found ${existingRecords?.length || 0} recent records`);
      if (existingRecords && existingRecords.length > 0) {
        console.log('Recent generations:');
        existingRecords.forEach(rec => {
          console.log(`   - ID: ${rec.id}`);
          console.log(`     User: ${rec.user_id}`);
          console.log(`     Type: ${rec.generation_type || 'not set'}`);
          console.log(`     Status: ${rec.status || 'not set'}`);
          console.log(`     Prompt: ${rec.prompt?.substring(0, 50)}...`);
          console.log(`     Image URL: ${rec.output_image_url ? 'Present' : 'Missing'}`);
          console.log(`     Created: ${rec.created_at}`);
          console.log('');
        });
      }
    }

    // 3. Test inserting a new record
    console.log('\n🧪 Testing database insert...');
    const testUserId = '00000000-0000-0000-0000-000000000001'; // Test user ID
    const testPrompt = `Test generation at ${new Date().toISOString()}`;
    const testImageUrl = 'https://example.com/test-image.jpg';

    console.log('Attempting to insert test record...');
    const { data: insertedRecord, error: insertError } = await supabase
      .from('image_generations')
      .insert({
        user_id: testUserId,
        prompt: testPrompt,
        generation_type: 'text-to-image',
        output_image_url: testImageUrl,
        status: 'completed',
        credits_used: 1,
        metadata: { test: true, timestamp: Date.now() }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert failed:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });

      // Check if it's a foreign key constraint issue
      if (insertError.code === '23503') {
        console.log('\n⚠️  Foreign key constraint violation - user does not exist');
        console.log('Creating test user...');

        const { data: testUser, error: userError } = await supabase
          .from('users')
          .insert({
            id: testUserId,
            apple_id: 'test-apple-id',
            email: 'test@example.com',
            display_name: 'Test User'
          })
          .select()
          .single();

        if (userError) {
          console.error('❌ Failed to create test user:', userError);
        } else {
          console.log('✅ Test user created:', testUser.id);

          // Retry the insert
          console.log('Retrying insert with valid user...');
          const { data: retryRecord, error: retryError } = await supabase
            .from('image_generations')
            .insert({
              user_id: testUserId,
              prompt: testPrompt,
              generation_type: 'text-to-image',
              output_image_url: testImageUrl,
              status: 'completed',
              credits_used: 1,
              metadata: { test: true, timestamp: Date.now() }
            })
            .select()
            .single();

          if (retryError) {
            console.error('❌ Retry failed:', retryError);
          } else {
            console.log('✅ Test record inserted successfully:', {
              id: retryRecord.id,
              user_id: retryRecord.user_id,
              status: retryRecord.status
            });
          }
        }
      }
    } else {
      console.log('✅ Test record inserted successfully:', {
        id: insertedRecord.id,
        user_id: insertedRecord.user_id,
        prompt: insertedRecord.prompt.substring(0, 50),
        status: insertedRecord.status
      });

      // Verify the record was actually saved
      console.log('\n🔍 Verifying the record was persisted...');
      const { data: verifyRecord, error: verifyError } = await supabase
        .from('image_generations')
        .select('*')
        .eq('id', insertedRecord.id)
        .single();

      if (verifyError) {
        console.error('❌ Could not verify record:', verifyError);
      } else if (verifyRecord) {
        console.log('✅ Record verified in database:', verifyRecord.id);
      } else {
        console.log('❌ Record not found after insert!');
      }

      // Clean up test record
      console.log('\n🧹 Cleaning up test record...');
      const { error: deleteError } = await supabase
        .from('image_generations')
        .delete()
        .eq('id', insertedRecord.id);

      if (deleteError) {
        console.error('❌ Failed to delete test record:', deleteError);
      } else {
        console.log('✅ Test record cleaned up');
      }
    }

    // 4. Check for any constraints or triggers
    console.log('\n🔍 Checking table constraints...');
    const { data: constraints, error: constraintError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'image_generations')
      .eq('table_schema', 'public');

    if (!constraintError && constraints) {
      console.log('Table constraints:');
      constraints.forEach(c => {
        console.log(`   - ${c.constraint_name}: ${c.constraint_type}`);
      });
    }

    // 5. Test with actual column names to see what works
    console.log('\n🧪 Testing individual column access...');
    const testColumns = [
      'id', 'user_id', 'prompt', 'image_url', 'output_image_url',
      'generation_type', 'status', 'credits_used', 'input_images',
      'metadata', 'created_at'
    ];

    for (const column of testColumns) {
      try {
        const { error } = await supabase
          .from('image_generations')
          .select(column)
          .limit(1);

        if (error) {
          console.log(`   ❌ ${column}: ${error.message}`);
        } else {
          console.log(`   ✅ ${column}: exists`);
        }
      } catch (e) {
        console.log(`   ❌ ${column}: error`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testDatabasePersistence().then(() => {
  console.log('\n=== TEST COMPLETED ===\n');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});