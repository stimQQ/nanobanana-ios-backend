const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function applyMigration() {
  try {
    console.log('Applying chat messages table migration...');

    // Read the SQL file
    const sqlFilePath = path.join(__dirname, '..', 'create-chat-messages-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sqlContent
    }).single();

    if (error) {
      // If exec_sql doesn't exist, try using the Supabase SQL editor API
      console.log('Direct SQL execution not available, please run the following SQL manually:');
      console.log('----------------------------------------');
      console.log(sqlContent);
      console.log('----------------------------------------');
      console.log('\nYou can run this SQL in the Supabase Dashboard SQL Editor:');
      console.log(`${supabaseUrl.replace('.supabase.co', '.supabase.com')}/project/_/sql`);
      return;
    }

    console.log('Migration applied successfully!');
    console.log('Chat messages table and related objects have been created.');
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();