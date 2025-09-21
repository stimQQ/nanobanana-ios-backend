const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const expectedSchema = {
  users: [
    'id', 'apple_id', 'google_id', 'email', 'name', 'display_name',
    'avatar_url', 'credits', 'free_attempts', 'subscription_plan',
    'subscription_tier', 'subscription_expires_at', 'language_code',
    'last_login_at', 'created_at', 'updated_at'
  ],
  image_generations: [
    'id', 'user_id', 'prompt', 'input_images', 'output_image_url',
    'generation_type', 'credits_used', 'status', 'error_message',
    'metadata', 'created_at'
  ],
  generations: [
    'id', 'user_id', 'prompt', 'negative_prompt', 'model', 'style',
    'image_url', 'image_id', 'thumbnail_url', 'width', 'height',
    'steps', 'guidance_scale', 'seed', 'status', 'error_message',
    'credits_used', 'processing_time_ms', 'created_at', 'completed_at'
  ],
  subscriptions: [
    'id', 'user_id', 'plan', 'tier', 'status', 'price', 'price_usd',
    'credits_per_month', 'images_per_month', 'apple_transaction_id',
    'stripe_subscription_id', 'purchased_at', 'starts_at', 'expires_at',
    'cancelled_at', 'auto_renew', 'created_at', 'updated_at'
  ],
  credit_transactions: [
    'id', 'user_id', 'amount', 'balance_after', 'type', 'transaction_type',
    'description', 'reference_id', 'related_id', 'created_at'
  ],
  uploaded_images: [
    'id', 'user_id', 'image_url', 'storage_path', 'file_name',
    'file_size', 'file_size_bytes', 'mime_type', 'width', 'height',
    'public_url', 'created_at'
  ],
  payment_history: [
    'id', 'user_id', 'subscription_id', 'apple_transaction_id',
    'amount', 'currency', 'status', 'receipt_data', 'created_at'
  ],
  chat_messages: [
    'id', 'user_id', 'session_id', 'message_type', 'content', 'prompt',
    'image_url', 'input_images', 'generation_type', 'generation_id',
    'credits_used', 'error_message', 'metadata', 'created_at'
  ]
};

async function checkCompleteSchema() {
  console.log('=== COMPLETE DATABASE SCHEMA ANALYSIS ===\n');

  const allTables = Object.keys(expectedSchema);
  const existingTables = [];
  const missingTables = [];

  // Check which tables exist
  console.log('🔍 Step 1: Checking table existence...');
  for (const tableName of allTables) {
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
      missingTables.push(tableName);
    }
  }

  console.log('\n📊 TABLE SUMMARY:');
  console.log(`✅ Existing: ${existingTables.length}/${allTables.length} tables`);
  console.log('✅ Present tables:', existingTables);
  console.log('❌ Missing tables:', missingTables);

  // Check columns for each existing table
  console.log('\n=== COLUMN ANALYSIS FOR EXISTING TABLES ===\n');

  const overallMissingColumns = [];

  for (const tableName of existingTables) {
    console.log(`🔍 Checking ${tableName.toUpperCase()} table columns...`);

    const requiredColumns = expectedSchema[tableName];
    const existingColumns = [];
    const missingColumns = [];

    for (const column of requiredColumns) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select(column)
          .limit(1);

        if (error) {
          console.log(`  ❌ ${column}: ${error.message}`);
          missingColumns.push(column);
          overallMissingColumns.push(`${tableName}.${column}`);
        } else {
          console.log(`  ✅ ${column}: exists`);
          existingColumns.push(column);
        }
      } catch (e) {
        console.log(`  ❌ ${column}: error`);
        missingColumns.push(column);
        overallMissingColumns.push(`${tableName}.${column}`);
      }
    }

    console.log(`📊 ${tableName}: ${existingColumns.length}/${requiredColumns.length} columns exist`);
    if (missingColumns.length > 0) {
      console.log(`❌ Missing in ${tableName}:`, missingColumns);
    }
    console.log(''); // blank line
  }

  // Final Summary
  console.log('=== FINAL MIGRATION REPORT ===\n');

  console.log('📋 MISSING TABLES:');
  if (missingTables.length === 0) {
    console.log('✅ All tables exist!');
  } else {
    missingTables.forEach(table => {
      console.log(`❌ ${table} - NEEDS CREATION`);
    });
  }

  console.log('\n📋 MISSING COLUMNS:');
  if (overallMissingColumns.length === 0) {
    console.log('✅ All columns exist in existing tables!');
  } else {
    overallMissingColumns.forEach(column => {
      console.log(`❌ ${column} - NEEDS MIGRATION`);
    });
  }

  console.log('\n📋 MISSING FUNCTIONS:');
  console.log('❌ update_updated_at_column - NEEDS CREATION');
  console.log('❌ get_or_create_session - NEEDS CREATION');
  console.log('❌ reset_monthly_credits - NEEDS CREATION');

  console.log('\n📋 MISSING ENUMS:');
  console.log('❌ subscription_tier - NEEDS CREATION');
  console.log('❌ payment_status - NEEDS CREATION');

  console.log('\n🚀 NEXT STEPS:');
  if (missingTables.length > 0 || overallMissingColumns.length > 0) {
    console.log('1. ⚠️  Run comprehensive-migration.sql to add missing components');
    console.log('2. 🔄 Verify all RLS policies are in place');
    console.log('3. 📊 Test all API endpoints after migration');
  } else {
    console.log('1. ✅ Core schema appears complete');
    console.log('2. 🔄 Still need to add functions and enums from comprehensive-migration.sql');
    console.log('3. 📊 Verify RLS policies and permissions');
  }

  // Create migration priority list
  console.log('\n📝 MIGRATION PRIORITY:');
  console.log('🔥 HIGH PRIORITY (Core functionality):');
  if (missingTables.includes('chat_messages')) {
    console.log('   - chat_messages table (for chat functionality)');
  }
  if (missingTables.includes('generations')) {
    console.log('   - generations table (alternative to image_generations)');
  }

  console.log('🟡 MEDIUM PRIORITY (Enhanced features):');
  console.log('   - Custom functions (update triggers, session management)');
  console.log('   - Enum types (subscription_tier, payment_status)');

  console.log('🟢 LOW PRIORITY (Nice to have):');
  console.log('   - Additional indexes for performance');
  console.log('   - Views for complex queries');

  return {
    existingTables,
    missingTables,
    missingColumns: overallMissingColumns,
    totalIssues: missingTables.length + overallMissingColumns.length
  };
}

checkCompleteSchema().then(result => {
  console.log(`\n🎯 MIGRATION STATUS: ${result.totalIssues === 0 ? 'COMPLETE' : 'INCOMPLETE'}`);
  console.log(`📊 Issues found: ${result.totalIssues}`);
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});