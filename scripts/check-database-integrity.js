#!/usr/bin/env node

/**
 * Database Integrity Check Script
 * Checks for common issues with image generation records
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  if (!supabaseUrl) console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseServiceKey) console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkDatabaseIntegrity() {
  log('\n=================================================', 'cyan');
  log('🔍 DATABASE INTEGRITY CHECK', 'cyan');
  log('=================================================\n', 'cyan');

  try {
    // 1. Check total generations
    log('📊 Checking total image_generations records...', 'yellow');
    const { data: allGenerations, error: countError, count } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(100);

    if (countError) {
      throw countError;
    }

    log(`   Total records: ${count}`, 'blue');
    log(`   Retrieved: ${allGenerations?.length || 0}`, 'blue');

    // 2. Check for records with missing URLs
    log('\n🔍 Checking for records with missing output_image_url...', 'yellow');
    const noUrlRecords = allGenerations?.filter(g => !g.output_image_url) || [];

    if (noUrlRecords.length > 0) {
      log(`   ⚠️  Found ${noUrlRecords.length} records WITHOUT URLs:`, 'red');
      noUrlRecords.forEach((record, idx) => {
        log(`      ${idx + 1}. ID: ${record.id}`, 'red');
        log(`         Status: ${record.status}`, 'red');
        log(`         Created: ${record.created_at}`, 'red');
        log(`         User: ${record.user_id}`, 'red');
      });
    } else {
      log(`   ✅ All records have output_image_url`, 'green');
    }

    // 3. Check URL types
    log('\n📊 Analyzing URL types...', 'yellow');
    const urlTypes = {
      dataUrl: 0,
      httpUrl: 0,
      httpsUrl: 0,
      supabaseUrl: 0,
      other: 0
    };

    allGenerations?.forEach(gen => {
      if (!gen.output_image_url) return;

      if (gen.output_image_url.startsWith('data:')) {
        urlTypes.dataUrl++;
      } else if (gen.output_image_url.startsWith('https://')) {
        urlTypes.httpsUrl++;
        if (gen.output_image_url.includes('supabase')) {
          urlTypes.supabaseUrl++;
        }
      } else if (gen.output_image_url.startsWith('http://')) {
        urlTypes.httpUrl++;
      } else {
        urlTypes.other++;
      }
    });

    log(`   Data URLs: ${urlTypes.dataUrl}`, 'blue');
    log(`   HTTPS URLs: ${urlTypes.httpsUrl}`, 'blue');
    log(`   HTTP URLs: ${urlTypes.httpUrl}`, 'blue');
    log(`   Supabase Storage URLs: ${urlTypes.supabaseUrl}`, 'blue');
    log(`   Other: ${urlTypes.other}`, 'blue');

    // 4. Check status distribution
    log('\n📊 Checking status distribution...', 'yellow');
    const statusCounts = {};
    allGenerations?.forEach(gen => {
      statusCounts[gen.status] = (statusCounts[gen.status] || 0) + 1;
    });

    Object.entries(statusCounts).forEach(([status, count]) => {
      log(`   ${status}: ${count}`, status === 'completed' ? 'green' : status === 'failed' ? 'red' : 'yellow');
    });

    // 5. Check for duplicate records
    log('\n🔍 Checking for duplicate prompts (same user, same prompt)...', 'yellow');
    const promptMap = {};
    allGenerations?.forEach(gen => {
      const key = `${gen.user_id}:${gen.prompt}`;
      if (!promptMap[key]) {
        promptMap[key] = [];
      }
      promptMap[key].push(gen);
    });

    const duplicates = Object.entries(promptMap).filter(([_, gens]) => gens.length > 1);
    if (duplicates.length > 0) {
      log(`   ⚠️  Found ${duplicates.length} duplicate prompt groups`, 'yellow');
      duplicates.slice(0, 3).forEach(([key, gens]) => {
        const [userId, prompt] = key.split(':');
        log(`      User ${userId.substring(0, 8)}... has ${gens.length} generations with prompt: "${prompt.substring(0, 50)}..."`, 'yellow');
      });
    } else {
      log(`   ✅ No duplicate prompts found`, 'green');
    }

    // 6. Check recent records
    log('\n📅 Checking recent records (last 5)...', 'yellow');
    const recentRecords = allGenerations?.slice(0, 5) || [];

    recentRecords.forEach((record, idx) => {
      log(`\n   ${idx + 1}. Generation ${record.id}:`, 'magenta');
      log(`      Status: ${record.status}`, 'magenta');
      log(`      Has URL: ${!!record.output_image_url}`, 'magenta');
      log(`      URL Type: ${
        !record.output_image_url ? 'None' :
        record.output_image_url.startsWith('data:') ? 'Data URL' :
        record.output_image_url.startsWith('http') ? 'HTTP URL' : 'Other'
      }`, 'magenta');
      log(`      Credits: ${record.credits_used}`, 'magenta');
      log(`      Type: ${record.generation_type}`, 'magenta');
      log(`      Created: ${new Date(record.created_at).toLocaleString()}`, 'magenta');
      log(`      User: ${record.user_id.substring(0, 8)}...`, 'magenta');

      // Check URL accessibility for HTTP URLs
      if (record.output_image_url && record.output_image_url.startsWith('http')) {
        log(`      URL Preview: ${record.output_image_url.substring(0, 100)}...`, 'cyan');
      }
    });

    // 7. Check for orphaned records (no user)
    log('\n🔍 Checking for orphaned records...', 'yellow');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id');

    if (userError) {
      log('   ⚠️  Could not check for orphaned records: ' + userError.message, 'yellow');
    } else {
      const userIds = new Set(users.map(u => u.id));
      const orphaned = allGenerations?.filter(g => !userIds.has(g.user_id)) || [];

      if (orphaned.length > 0) {
        log(`   ⚠️  Found ${orphaned.length} orphaned records (user doesn't exist)`, 'red');
        orphaned.forEach(record => {
          log(`      ID: ${record.id}, User: ${record.user_id}`, 'red');
        });
      } else {
        log(`   ✅ No orphaned records found`, 'green');
      }
    }

    // 8. Check column names
    log('\n📊 Checking column structure...', 'yellow');
    if (allGenerations && allGenerations.length > 0) {
      const sampleRecord = allGenerations[0];
      const columns = Object.keys(sampleRecord);

      log('   Columns found:', 'blue');
      columns.forEach(col => {
        log(`      - ${col}`, 'blue');
      });

      // Check for critical columns
      const requiredColumns = ['id', 'user_id', 'prompt', 'output_image_url', 'status', 'created_at'];
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));

      if (missingColumns.length > 0) {
        log(`\n   ⚠️  Missing expected columns:`, 'red');
        missingColumns.forEach(col => {
          log(`      - ${col}`, 'red');
        });
      } else {
        log(`\n   ✅ All required columns present`, 'green');
      }
    }

    // Summary
    log('\n=================================================', 'cyan');
    log('📊 INTEGRITY CHECK SUMMARY', 'cyan');
    log('=================================================', 'cyan');

    const issues = [];
    if (noUrlRecords.length > 0) issues.push(`${noUrlRecords.length} records without URLs`);
    if (urlTypes.dataUrl > urlTypes.supabaseUrl) issues.push('More data URLs than storage URLs');
    if (statusCounts.failed > 0) issues.push(`${statusCounts.failed} failed generations`);
    if (statusCounts.processing > 0) issues.push(`${statusCounts.processing} stuck in processing`);

    if (issues.length === 0) {
      log('   ✅ No major issues found!', 'green');
    } else {
      log('   ⚠️  Issues found:', 'yellow');
      issues.forEach(issue => {
        log(`      - ${issue}`, 'yellow');
      });
    }

  } catch (error) {
    log('\n❌ ERROR during integrity check:', 'red');
    log(`   ${error.message}`, 'red');
    console.error(error);
  }

  log('\n=================================================', 'cyan');
  log('🏁 CHECK COMPLETE', 'cyan');
  log('=================================================\n', 'cyan');
}

// Run the check
checkDatabaseIntegrity().catch(console.error);