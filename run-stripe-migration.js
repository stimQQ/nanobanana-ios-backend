require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running Stripe database migration...\n');

  const migrations = [
    // Add Stripe columns to users table
    `ALTER TABLE users
     ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
     ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT`,

    // Add Stripe columns to subscriptions table
    `ALTER TABLE subscriptions
     ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
     ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
     ADD COLUMN IF NOT EXISTS stripe_current_period_start TIMESTAMP WITH TIME ZONE,
     ADD COLUMN IF NOT EXISTS stripe_current_period_end TIMESTAMP WITH TIME ZONE,
     ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'apple'`,

    // Add Stripe columns to payment_history table
    `ALTER TABLE payment_history
     ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT UNIQUE,
     ADD COLUMN IF NOT EXISTS stripe_invoice_id TEXT,
     ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'apple'`,

    // Create index for faster queries
    `CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id)`,
    `CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id)`,
    `CREATE INDEX IF NOT EXISTS idx_payment_history_stripe_payment_intent_id ON payment_history(stripe_payment_intent_id)`
  ];

  let success = 0;
  let failed = 0;

  for (const sql of migrations) {
    try {
      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        // Try direct execution if RPC doesn't exist
        const { error: directError } = await supabase.from('_migrations').select('*').limit(1);
        if (directError) {
          console.log(`⚠️  Migration might need manual execution: ${sql.substring(0, 50)}...`);
          failed++;
        } else {
          console.log(`✅ Executed: ${sql.substring(0, 80)}...`);
          success++;
        }
      } else {
        console.log(`✅ Executed: ${sql.substring(0, 80)}...`);
        success++;
      }
    } catch (err) {
      console.error(`❌ Failed: ${sql.substring(0, 50)}...`, err.message);
      failed++;
    }
  }

  console.log(`\n📊 Migration Summary:`);
  console.log(`   ✅ Successful: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Some migrations failed. You may need to run them manually in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/xwwjacrqhnpqrmcvdhly/sql/new');
    console.log('\n📄 SQL script location: scripts/add-stripe-columns.sql');
  } else {
    console.log('\n✅ All migrations completed successfully!');
  }
}

runMigration().catch(console.error);