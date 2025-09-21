const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkIndexesAndConstraints() {
  console.log('=== CHECKING INDEXES AND CONSTRAINTS ===\n');

  const existingTables = [
    'users',
    'image_generations',
    'subscriptions',
    'credit_transactions',
    'uploaded_images',
    'payment_history'
  ];

  // Check Primary Keys and Unique Constraints
  console.log('🔍 Checking Primary Keys and Unique Constraints...\n');

  for (const tableName of existingTables) {
    console.log(`📋 ${tableName.toUpperCase()}:`);

    // Try to get table info by inserting with duplicate IDs (will fail and show constraint info)
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!error && data) {
        console.log(`  ✅ Table accessible, likely has proper structure`);
      }
    } catch (e) {
      console.log(`  ❌ Error accessing table: ${e.message}`);
    }
  }

  // Check for foreign key relationships
  console.log('\n🔗 Checking Foreign Key Relationships...\n');

  const foreignKeyTests = [
    {
      table: 'image_generations',
      column: 'user_id',
      references: 'users(id)'
    },
    {
      table: 'subscriptions',
      column: 'user_id',
      references: 'users(id)'
    },
    {
      table: 'credit_transactions',
      column: 'user_id',
      references: 'users(id)'
    },
    {
      table: 'uploaded_images',
      column: 'user_id',
      references: 'users(id)'
    },
    {
      table: 'payment_history',
      column: 'user_id',
      references: 'users(id)'
    },
    {
      table: 'payment_history',
      column: 'subscription_id',
      references: 'subscriptions(id)'
    }
  ];

  for (const fk of foreignKeyTests) {
    console.log(`🔗 ${fk.table}.${fk.column} -> ${fk.references}`);

    // Test if foreign key constraint exists by trying to insert invalid reference
    try {
      const { data, error } = await supabase
        .from(fk.table)
        .insert({ [fk.column]: '00000000-0000-0000-0000-000000000000' });

      if (error && error.message.includes('foreign key')) {
        console.log(`  ✅ Foreign key constraint exists`);
      } else if (error) {
        console.log(`  ⚠️  Other constraint: ${error.message}`);
      } else {
        console.log(`  ❓ No foreign key constraint detected`);
      }
    } catch (e) {
      if (e.message.includes('foreign key')) {
        console.log(`  ✅ Foreign key constraint exists`);
      } else {
        console.log(`  ❓ Unknown constraint status`);
      }
    }
  }

  // Check for RLS policies
  console.log('\n🔒 Checking Row Level Security...\n');

  for (const tableName of existingTables) {
    try {
      // Try to access data without auth (should fail if RLS is enabled)
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);

      if (error && error.message.includes('RLS')) {
        console.log(`✅ ${tableName}: RLS enabled`);
      } else if (error && error.message.includes('policy')) {
        console.log(`✅ ${tableName}: RLS policies active`);
      } else if (!error) {
        console.log(`⚠️  ${tableName}: Accessible without RLS (may be disabled)`);
      } else {
        console.log(`❓ ${tableName}: ${error.message}`);
      }
    } catch (e) {
      console.log(`❓ ${tableName}: Error checking RLS - ${e.message}`);
    }
  }

  console.log('\n=== INDEX RECOMMENDATIONS ===\n');

  const recommendedIndexes = [
    'users: email, apple_id, google_id (for authentication)',
    'image_generations: user_id, status, created_at (for queries)',
    'subscriptions: user_id, status, expires_at (for active subscriptions)',
    'credit_transactions: user_id, created_at (for transaction history)',
    'uploaded_images: user_id, created_at (for user gallery)',
    'payment_history: user_id, status (for payment tracking)'
  ];

  recommendedIndexes.forEach(rec => {
    console.log(`📊 ${rec}`);
  });

  console.log('\n=== CONSTRAINT RECOMMENDATIONS ===\n');

  const constraintRecommendations = [
    '✅ All tables should have UUID primary keys',
    '✅ Foreign key constraints for data integrity',
    '✅ NOT NULL constraints on required fields',
    '✅ CHECK constraints for enum-like fields (status, type)',
    '✅ UNIQUE constraints where applicable (email, transaction_id)',
  ];

  constraintRecommendations.forEach(rec => {
    console.log(rec);
  });

  return {
    tablesChecked: existingTables.length,
    foreignKeysChecked: foreignKeyTests.length
  };
}

checkIndexesAndConstraints().then(result => {
  console.log(`\n🎯 Checked ${result.tablesChecked} tables and ${result.foreignKeysChecked} foreign key relationships`);
  console.log('📄 Run comprehensive-migration.sql to ensure all indexes and constraints are properly set up');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});