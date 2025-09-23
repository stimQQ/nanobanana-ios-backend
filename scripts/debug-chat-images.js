#!/usr/bin/env node

/**
 * Debug script to find why images are not showing in chat history
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

async function debugChatImages() {
  console.log('\n🔍 Debugging Chat Image Issues\n');
  console.log('='.repeat(60));

  try {
    // 1. Check recent chat messages
    console.log('\n📋 Recent Chat Messages:');
    const { data: chatMessages, error: chatError } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (chatError) {
      console.error('❌ Error fetching chat messages:', chatError);
    } else {
      console.log(`Found ${chatMessages.length} recent messages\n`);

      chatMessages.forEach(msg => {
        console.log(`  Message ID: ${msg.id.substring(0, 8)}...`);
        console.log(`  Type: ${msg.message_type}`);
        console.log(`  Has image_url: ${msg.image_url ? '✅ YES' : '❌ NO'}`);
        if (msg.image_url) {
          console.log(`  Image URL: ${msg.image_url.substring(0, 50)}...`);
        }
        console.log(`  Generation ID: ${msg.generation_id || 'none'}`);
        console.log(`  Created: ${new Date(msg.created_at).toLocaleString()}`);
        console.log('  ' + '-'.repeat(40));
      });
    }

    // 2. Check recent image generations
    console.log('\n🖼️ Recent Image Generations:');
    const { data: generations, error: genError } = await supabase
      .from('image_generations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (genError) {
      console.error('❌ Error fetching generations:', genError);
    } else {
      console.log(`Found ${generations.length} recent generations\n`);

      generations.forEach(gen => {
        console.log(`  Generation ID: ${gen.id.substring(0, 8)}...`);
        console.log(`  Has output_image_url: ${gen.output_image_url ? '✅ YES' : '❌ NO'}`);
        if (gen.output_image_url) {
          console.log(`  Image URL: ${gen.output_image_url.substring(0, 50)}...`);
        }
        console.log(`  Status: ${gen.status}`);
        console.log(`  Created: ${new Date(gen.created_at).toLocaleString()}`);
        console.log('  ' + '-'.repeat(40));
      });
    }

    // 3. Check for messages with generation_id but no image_url
    console.log('\n⚠️  Messages with generation_id but no image_url:');
    const { data: brokenMessages } = await supabase
      .from('chat_messages')
      .select('*')
      .not('generation_id', 'is', null)
      .is('image_url', null);

    if (brokenMessages && brokenMessages.length > 0) {
      console.log(`Found ${brokenMessages.length} messages with generation_id but no image_url!`);
      brokenMessages.forEach(msg => {
        console.log(`  Message ID: ${msg.id.substring(0, 8)}...`);
        console.log(`  Generation ID: ${msg.generation_id}`);
        console.log(`  Created: ${new Date(msg.created_at).toLocaleString()}`);
      });
    } else {
      console.log('  None found (good!)');
    }

    // 4. Try to match generations with messages
    console.log('\n🔗 Matching Generations with Messages:');
    const { data: messagesWithGenId } = await supabase
      .from('chat_messages')
      .select('id, generation_id, image_url')
      .not('generation_id', 'is', null)
      .limit(5);

    if (messagesWithGenId) {
      for (const msg of messagesWithGenId) {
        console.log(`\n  Message ${msg.id.substring(0, 8)}...`);
        console.log(`  Generation ID: ${msg.generation_id}`);
        console.log(`  Has image_url in message: ${msg.image_url ? '✅' : '❌'}`);

        // Find the corresponding generation
        const { data: gen } = await supabase
          .from('image_generations')
          .select('id, output_image_url, status')
          .eq('id', msg.generation_id)
          .single();

        if (gen) {
          console.log(`  Found generation: ✅`);
          console.log(`  Has output_image_url in generation: ${gen.output_image_url ? '✅' : '❌'}`);
          if (msg.image_url !== gen.output_image_url) {
            console.log(`  ⚠️  URLs don't match!`);
            console.log(`    Message URL: ${msg.image_url?.substring(0, 30)}...`);
            console.log(`    Generation URL: ${gen.output_image_url?.substring(0, 30)}...`);
          }
        } else {
          console.log(`  Found generation: ❌`);
        }
      }
    }

    // 5. Test saving a message with an image
    console.log('\n\n🧪 Testing Save Operation:');
    const testImageUrl = 'https://test.example.com/test-image.png';
    const testMessage = {
      user_id: '00000000-0000-0000-0000-000000000000',
      session_id: 'test-session',
      message_type: 'assistant',
      content: 'Test message with image',
      image_url: testImageUrl,
      generation_id: 'test-gen-id',
    };

    const { data: savedMsg, error: saveError } = await supabase
      .from('chat_messages')
      .insert(testMessage)
      .select()
      .single();

    if (saveError) {
      console.error('❌ Error saving test message:', saveError);
    } else {
      console.log('✅ Test message saved successfully');
      console.log(`  Saved image_url: ${savedMsg.image_url ? '✅' : '❌'}`);

      // Clean up test message
      await supabase
        .from('chat_messages')
        .delete()
        .eq('id', savedMsg.id);
      console.log('  Test message cleaned up');
    }

    // 6. Summary
    console.log('\n\n📊 Summary:');
    const { count: totalMessages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true });

    const { count: messagesWithImages } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .not('image_url', 'is', null);

    const { count: totalGenerations } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact', head: true });

    const { count: generationsWithImages } = await supabase
      .from('image_generations')
      .select('*', { count: 'exact', head: true })
      .not('output_image_url', 'is', null);

    console.log(`  Total chat messages: ${totalMessages}`);
    console.log(`  Messages with images: ${messagesWithImages}`);
    console.log(`  Total generations: ${totalGenerations}`);
    console.log(`  Generations with images: ${generationsWithImages}`);

    if (messagesWithImages < generationsWithImages) {
      console.log(`\n  ⚠️  WARNING: More generations have images than messages!`);
      console.log(`  This suggests images are not being saved to chat_messages.`);
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }

  console.log('\n' + '='.repeat(60));
}

debugChatImages().catch(console.error);