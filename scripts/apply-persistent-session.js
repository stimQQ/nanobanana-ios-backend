#!/usr/bin/env node

/**
 * Script to apply persistent session changes to the database
 * This removes the 30-minute timeout and makes sessions permanent
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  if (!SUPABASE_URL) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function applyPersistentSessionChanges() {
  try {
    log('\n🔄 Applying Persistent Session Changes', 'yellow');
    log('=' .repeat(50), 'yellow');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'remove-session-timeout.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    log('\n📝 Executing SQL changes...', 'blue');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec', { sql_query: sql }).single();

    if (error) {
      // If exec doesn't exist, try running the SQL statements individually
      log('   Using alternative execution method...', 'yellow');

      // Split SQL into individual statements (simple split, may need refinement)
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            // For DDL statements, we need to use raw SQL which isn't directly supported
            // So we'll provide instructions instead
            log(`\n   Statement to execute manually:`, 'cyan');
            console.log(statement.substring(0, 100) + '...');
          } catch (stmtError) {
            log(`   ⚠️ Statement execution note: ${stmtError.message}`, 'yellow');
          }
        }
      }

      log('\n📋 Manual Execution Instructions:', 'yellow');
      log('   Since direct SQL execution is limited, please run the following:', 'yellow');
      log(`   1. Go to your Supabase Dashboard: ${SUPABASE_URL}`, 'blue');
      log('   2. Navigate to SQL Editor', 'blue');
      log(`   3. Copy and paste the contents of: ${sqlPath}`, 'blue');
      log('   4. Execute the SQL statements', 'blue');

      log('\n📄 SQL Preview:', 'cyan');
      console.log(sql.substring(0, 500) + '...\n');

      return false;
    }

    log('✅ Database changes applied successfully!', 'green');
    return true;

  } catch (error) {
    log(`\n❌ Error applying changes: ${error.message}`, 'red');
    return false;
  }
}

async function checkCurrentFunction() {
  try {
    log('\n🔍 Checking current get_or_create_session function...', 'blue');

    // Test the function with a dummy user ID
    const testUserId = '00000000-0000-0000-0000-000000000000';
    const { data, error } = await supabase.rpc('get_or_create_session', {
      p_user_id: testUserId
    });

    if (error) {
      if (error.message.includes('does not exist')) {
        log('   ⚠️ Function does not exist yet', 'yellow');
      } else if (error.message.includes('permission')) {
        log('   ℹ️ Function exists but requires authentication', 'cyan');
      } else {
        log(`   ⚠️ Function check error: ${error.message}`, 'yellow');
      }
    } else {
      log('   ✅ Function exists and is callable', 'green');
      if (data) {
        log(`   Returned session ID: ${data}`, 'cyan');
      }
    }
  } catch (error) {
    log(`   ⚠️ Could not check function: ${error.message}`, 'yellow');
  }
}

async function consolidateUserSessions() {
  try {
    log('\n🔧 Checking for users with multiple sessions...', 'blue');

    // Get all users with chat messages
    const { data: users, error: usersError } = await supabase
      .from('chat_messages')
      .select('user_id')
      .order('user_id');

    if (usersError) {
      log(`   ⚠️ Could not fetch users: ${usersError.message}`, 'yellow');
      return;
    }

    // Get unique user IDs
    const uniqueUsers = [...new Set(users.map(u => u.user_id))];
    log(`   Found ${uniqueUsers.length} users with messages`, 'cyan');

    let consolidatedCount = 0;
    for (const userId of uniqueUsers) {
      // Get all sessions for this user
      const { data: userSessions, error: sessionError } = await supabase
        .from('chat_messages')
        .select('session_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!sessionError && userSessions && userSessions.length > 0) {
        const uniqueSessions = [...new Set(userSessions.map(s => s.session_id))];

        if (uniqueSessions.length > 1) {
          log(`   User ${userId.substring(0, 8)}... has ${uniqueSessions.length} sessions`, 'yellow');
          consolidatedCount++;

          // The SQL migration will handle the actual consolidation
          // Here we just report it
        }
      }
    }

    if (consolidatedCount > 0) {
      log(`   📊 ${consolidatedCount} users have multiple sessions that will be consolidated`, 'yellow');
    } else {
      log('   ✅ All users already have single sessions', 'green');
    }

  } catch (error) {
    log(`   ⚠️ Session check error: ${error.message}`, 'yellow');
  }
}

async function main() {
  log('\n🚀 Persistent Session Migration Tool', 'cyan');
  log('=' .repeat(50), 'cyan');
  log('This tool removes the 30-minute session timeout', 'blue');
  log('and ensures all users have one persistent session.', 'blue');

  // Check current state
  await checkCurrentFunction();
  await consolidateUserSessions();

  // Apply changes
  const success = await applyPersistentSessionChanges();

  if (success) {
    log('\n✅ Migration completed successfully!', 'green');
    log('\nNext steps:', 'yellow');
    log('1. Test the changes with: node scripts/test-persistent-session.js', 'blue');
    log('2. Deploy the updated API routes', 'blue');
    log('3. Users will now have persistent sessions without timeouts', 'blue');
  } else {
    log('\n⚠️ Manual intervention required', 'yellow');
    log('Please follow the instructions above to complete the migration.', 'yellow');
  }

  log('\n' + '=' .repeat(50), 'cyan');
}

// Run the migration
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});