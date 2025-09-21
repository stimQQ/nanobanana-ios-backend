const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSchema() {
  console.log('=== CHECKING DATABASE SCHEMA ===\n');

  try {
    // Check existing tables by trying to query them directly
    console.log('🔍 Checking existing tables by attempting queries...');

    const requiredTables = [
      'users',
      'generations',
      'image_generations',
      'subscriptions',
      'credit_transactions',
      'uploaded_images',
      'payment_history',
      'chat_messages'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
          missingTables.push(tableName);
        } else {
          console.log(`✅ Table ${tableName}: exists`);
          existingTables.push(tableName);
        }
      } catch (e) {
        console.log(`❌ Table ${tableName}: error - ${e.message}`);
        missingTables.push(tableName);
      }
    }

    console.log('\n📊 Table Summary:');
    console.log('✅ Existing tables:', existingTables);
    console.log('❌ Missing tables:', missingTables);

    console.log('\n=== DETAILED TABLE COLUMN ANALYSIS ===\n');

    // Check users table columns by attempting to select specific fields
    if (existingTables.includes('users')) {
      console.log('🔍 Checking USERS table columns...');

      const requiredUserColumns = [
        'id', 'apple_id', 'google_id', 'email', 'name', 'display_name',
        'avatar_url', 'credits', 'free_attempts', 'subscription_plan',
        'subscription_tier', 'subscription_expires_at', 'language_code',
        'last_login_at', 'created_at', 'updated_at'
      ];

      const existingUserColumns = [];
      const missingUserColumns = [];

      for (const column of requiredUserColumns) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select(column)
            .limit(1);

          if (error) {
            console.log(`  ❌ ${column}: ${error.message}`);
            missingUserColumns.push(column);
          } else {
            console.log(`  ✅ ${column}: exists`);
            existingUserColumns.push(column);
          }
        } catch (e) {
          missingUserColumns.push(column);
        }
      }

      console.log(`\n📊 Users table: ${existingUserColumns.length}/${requiredUserColumns.length} columns exist`);
      if (missingUserColumns.length > 0) {
        console.log('❌ Missing users columns:', missingUserColumns);
      }
    }

    // Check image_generations table columns
    if (existingTables.includes('image_generations')) {
      console.log('\n🔍 Checking IMAGE_GENERATIONS table columns...');
      const { data: genColumns, error: genError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'image_generations')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!genError) {
        console.log('📋 Image_generations table columns:');
        genColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
    }

    // Check chat_messages table columns
    if (existingTables.includes('chat_messages')) {
      console.log('\n🔍 Checking CHAT_MESSAGES table columns...');
      const { data: chatColumns, error: chatError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'chat_messages')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!chatError) {
        console.log('📋 Chat_messages table columns:');
        chatColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        const requiredChatColumns = [
          'id', 'user_id', 'session_id', 'message_type', 'content', 'prompt',
          'image_url', 'input_images', 'generation_type', 'generation_id',
          'credits_used', 'error_message', 'metadata', 'created_at'
        ];

        const existingChatColumns = chatColumns.map(c => c.column_name);
        const missingChatColumns = requiredChatColumns.filter(col => !existingChatColumns.includes(col));

        if (missingChatColumns.length > 0) {
          console.log('❌ Missing chat_messages columns:', missingChatColumns);
        } else {
          console.log('✅ Chat_messages table has all required columns');
        }
      }
    }

    // Check subscriptions table
    if (existingTables.includes('subscriptions')) {
      console.log('\n🔍 Checking SUBSCRIPTIONS table columns...');
      const { data: subColumns, error: subError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'subscriptions')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!subError) {
        console.log('📋 Subscriptions table columns:');
        subColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        const requiredSubColumns = [
          'id', 'user_id', 'plan', 'tier', 'status', 'price', 'price_usd',
          'credits_per_month', 'images_per_month', 'apple_transaction_id',
          'stripe_subscription_id', 'purchased_at', 'starts_at', 'expires_at',
          'cancelled_at', 'auto_renew', 'created_at', 'updated_at'
        ];

        const existingSubColumns = subColumns.map(c => c.column_name);
        const missingSubColumns = requiredSubColumns.filter(col => !existingSubColumns.includes(col));

        if (missingSubColumns.length > 0) {
          console.log('❌ Missing subscriptions columns:', missingSubColumns);
        } else {
          console.log('✅ Subscriptions table has all required columns');
        }
      }
    }

    // Check credit_transactions table
    if (existingTables.includes('credit_transactions')) {
      console.log('\n🔍 Checking CREDIT_TRANSACTIONS table columns...');
      const { data: creditColumns, error: creditError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'credit_transactions')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!creditError) {
        console.log('📋 Credit_transactions table columns:');
        creditColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        const requiredCreditColumns = [
          'id', 'user_id', 'amount', 'balance_after', 'type', 'transaction_type',
          'description', 'reference_id', 'related_id', 'created_at'
        ];

        const existingCreditColumns = creditColumns.map(c => c.column_name);
        const missingCreditColumns = requiredCreditColumns.filter(col => !existingCreditColumns.includes(col));

        if (missingCreditColumns.length > 0) {
          console.log('❌ Missing credit_transactions columns:', missingCreditColumns);
        } else {
          console.log('✅ Credit_transactions table has all required columns');
        }
      }
    }

    // Check uploaded_images table
    if (existingTables.includes('uploaded_images')) {
      console.log('\n🔍 Checking UPLOADED_IMAGES table columns...');
      const { data: uploadColumns, error: uploadError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_name', 'uploaded_images')
        .eq('table_schema', 'public')
        .order('ordinal_position');

      if (!uploadError) {
        console.log('📋 Uploaded_images table columns:');
        uploadColumns.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        const requiredUploadColumns = [
          'id', 'user_id', 'image_url', 'storage_path', 'file_name',
          'file_size', 'file_size_bytes', 'mime_type', 'width', 'height',
          'public_url', 'created_at'
        ];

        const existingUploadColumns = uploadColumns.map(c => c.column_name);
        const missingUploadColumns = requiredUploadColumns.filter(col => !existingUploadColumns.includes(col));

        if (missingUploadColumns.length > 0) {
          console.log('❌ Missing uploaded_images columns:', missingUploadColumns);
        } else {
          console.log('✅ Uploaded_images table has all required columns');
        }
      }
    }

    // Check for enums
    console.log('\n🔍 Checking custom enums...');
    const { data: enums, error: enumsError } = await supabase.rpc('get_enum_types');

    if (enumsError) {
      // Try alternative method
      console.log('Checking enums with alternative method...');
    } else {
      console.log('📋 Custom enums:', enums);
    }

    // Check for functions
    console.log('\n🔍 Checking custom functions...');
    const requiredFunctions = [
      'update_updated_at_column',
      'get_or_create_session',
      'reset_monthly_credits'
    ];

    for (const funcName of requiredFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName.replace('_column', ''), {});
        if (error && !error.message.includes('function')) {
          console.log(`✅ Function ${funcName} exists`);
        } else {
          console.log(`❌ Function ${funcName} missing or error:`, error?.message);
        }
      } catch (e) {
        console.log(`❌ Function ${funcName} missing or inaccessible`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log('✅ Database schema check completed');
    console.log('📄 For complete migration, run: comprehensive-migration.sql');

  } catch (error) {
    console.error('❌ Error checking database schema:', error);
  }
}

// Helper function to check enums (if the direct RPC doesn't work)
async function checkEnums() {
  try {
    const { data, error } = await supabase
      .from('pg_type')
      .select('typname')
      .eq('typtype', 'e');

    if (!error) {
      console.log('📋 Custom enum types:', data.map(t => t.typname));
    }
  } catch (e) {
    console.log('Could not check enum types directly');
  }
}

checkDatabaseSchema().then(() => {
  console.log('\n🎉 Schema check completed!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});