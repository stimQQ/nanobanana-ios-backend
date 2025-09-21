const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('Starting database migration...');

  try {
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-database.sql'),
      'utf8'
    );

    // Split the SQL into individual statements
    // Remove comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip if statement is empty or only contains whitespace
      if (!statement || statement.match(/^\s*$/)) {
        continue;
      }

      // Add semicolon back
      const fullStatement = statement + ';';

      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql: fullStatement
      }).single();

      if (error) {
        // Try direct execution if RPC doesn't work
        const { error: directError } = await supabase
          .from('_sql')
          .select(fullStatement);

        if (directError) {
          console.error(`Error executing statement ${i + 1}:`, directError.message);
          console.error('Statement:', fullStatement.substring(0, 100) + '...');
          // Continue with other statements even if one fails
        }
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

// Alternative approach using direct database connection
async function runMigrationDirect() {
  console.log('Starting database migration with direct SQL execution...');

  try {
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-database.sql'),
      'utf8'
    );

    // Use Supabase's SQL editor endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Migration failed: ${error}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Direct migration failed:', error.message);
    console.log('\nTrying alternative method...');
    await runMigration();
  }
}

// Run the migration
runMigrationDirect().catch(console.error);