#!/usr/bin/env node

/**
 * Fix missing chat messages for existing generations
 * This script links orphaned generations to chat messages
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

async function fixMissingChatMessages() {
  console.log('\n🔧 Fixing Missing Chat Messages\n');
  console.log('='.repeat(60));

  try {
    // 1. Find generations without corresponding chat messages
    console.log('📋 Finding orphaned generations...\n');

    // Get all completed generations with images
    const { data: generations, error: genError } = await supabase
      .from('image_generations')
      .select('*')
      .eq('status', 'completed')
      .not('output_image_url', 'is', null)
      .order('created_at', { ascending: false });

    if (genError) {
      console.error('Error fetching generations:', genError);
      return;
    }

    console.log(`Found ${generations.length} completed generations with images\n`);

    // Check each generation for a corresponding chat message
    const orphanedGenerations = [];

    for (const gen of generations) {
      const { data: message } = await supabase
        .from('chat_messages')
        .select('id')
        .eq('generation_id', gen.id)
        .single();

      if (!message) {
        orphanedGenerations.push(gen);
      }
    }

    console.log(`Found ${orphanedGenerations.length} orphaned generations\n`);

    if (orphanedGenerations.length === 0) {
      console.log('✅ All generations have corresponding chat messages!');
      return;
    }

    // 2. Create chat messages for orphaned generations
    console.log('📝 Creating missing chat messages...\n');

    for (const gen of orphanedGenerations) {
      console.log(`Processing generation ${gen.id.substring(0, 8)}...`);
      console.log(`  Created: ${new Date(gen.created_at).toLocaleString()}`);
      console.log(`  Prompt: ${gen.prompt?.substring(0, 50)}...`);

      // Get or create session for this user
      const { data: existingMessage } = await supabase
        .from('chat_messages')
        .select('session_id')
        .eq('user_id', gen.user_id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      const sessionId = existingMessage?.session_id || crypto.randomUUID();

      // Create the assistant message with the generated image
      const messageData = {
        user_id: gen.user_id,
        session_id: sessionId,
        message_type: 'assistant',
        content: '✨ Here\'s your generated image!',
        prompt: gen.prompt,
        image_url: gen.output_image_url,
        input_images: gen.input_images,
        generation_type: gen.generation_type,
        generation_id: gen.id,
        credits_used: gen.credits_used,
        created_at: gen.created_at // Keep the same timestamp
      };

      const { data: newMessage, error: msgError } = await supabase
        .from('chat_messages')
        .insert(messageData)
        .select()
        .single();

      if (msgError) {
        console.error(`  ❌ Failed to create message:`, msgError.message);
      } else {
        console.log(`  ✅ Created chat message ${newMessage.id.substring(0, 8)}...`);
      }

      // Also create the user message if it doesn't exist
      const userMessageTime = new Date(gen.created_at);
      userMessageTime.setSeconds(userMessageTime.getSeconds() - 1); // 1 second before

      const userMessageData = {
        user_id: gen.user_id,
        session_id: sessionId,
        message_type: 'user',
        content: gen.prompt,
        generation_type: gen.generation_type,
        created_at: userMessageTime.toISOString()
      };

      const { error: userMsgError } = await supabase
        .from('chat_messages')
        .insert(userMessageData);

      if (!userMsgError) {
        console.log(`  ✅ Created user message for prompt`);
      }

      console.log('');
    }

    // 3. Final verification
    console.log('\n📊 Final Statistics:');

    const { count: totalMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    const { count: messagesWithImages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);

    const { count: totalGenerations } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .not('output_image_url', 'is', null);

    console.log(`  Total chat messages: ${totalMessages}`);
    console.log(`  Messages with images: ${messagesWithImages}`);
    console.log(`  Completed generations with images: ${totalGenerations}`);

    if (messagesWithImages === totalGenerations) {
      console.log('\n✅ All generations now have corresponding chat messages!');
    } else {
      console.log(`\n⚠️  Still have mismatch: ${totalGenerations - messagesWithImages} generations without messages`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  }

  console.log('\n' + '='.repeat(60));
}

// Add command line option to actually fix
const args = process.argv.slice(2);
if (args.includes('--fix')) {
  fixMissingChatMessages().catch(console.error);
} else {
  console.log('🔍 Running in preview mode. Add --fix to actually create missing messages.');
  console.log('Usage: node scripts/fix-missing-chat-messages.js --fix\n');
  fixMissingChatMessages().catch(console.error);
}