#!/usr/bin/env node

/**
 * Quick test to verify session persistence locally
 * This simulates the key parts of the session logic
 */

// Mock database with some test data
const mockDatabase = {
  chatMessages: [],
  currentUserId: 'test-user-123',
};

// Simulate the new get_or_create_session logic
function getOrCreateSession(userId) {
  // Find the first session for this user
  const userMessages = mockDatabase.chatMessages.filter(m => m.user_id === userId);

  if (userMessages.length > 0) {
    // Return the first (oldest) session
    const sortedMessages = userMessages.sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return sortedMessages[0].session_id;
  }

  // No messages exist, create a new persistent session
  return generateUUID();
}

// Simple UUID generator for testing
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Test the persistent session logic
function runTest() {
  console.log('🧪 Testing Persistent Session Logic');
  console.log('=' .repeat(40));

  const userId = mockDatabase.currentUserId;

  // Test 1: First time user - should create new session
  console.log('\nTest 1: New user gets a session');
  const session1 = getOrCreateSession(userId);
  console.log(`  Session ID: ${session1}`);

  // Add a message with this session
  mockDatabase.chatMessages.push({
    id: 'msg-1',
    user_id: userId,
    session_id: session1,
    created_at: '2024-01-01T10:00:00Z',
    content: 'First message'
  });

  // Test 2: Same user, later request - should get SAME session
  console.log('\nTest 2: Existing user gets same session');
  const session2 = getOrCreateSession(userId);
  console.log(`  Session ID: ${session2}`);
  console.log(`  Same as before: ${session2 === session1 ? '✅ YES' : '❌ NO'}`);

  // Add more messages
  mockDatabase.chatMessages.push({
    id: 'msg-2',
    user_id: userId,
    session_id: session2,
    created_at: '2024-01-01T10:35:00Z', // 35 minutes later
    content: 'Second message after 35 minutes'
  });

  // Test 3: Even after "timeout period" - still same session
  console.log('\nTest 3: After 35 minutes (old timeout) - still same session');
  const session3 = getOrCreateSession(userId);
  console.log(`  Session ID: ${session3}`);
  console.log(`  Same as original: ${session3 === session1 ? '✅ YES' : '❌ NO'}`);

  // Add a message days later
  mockDatabase.chatMessages.push({
    id: 'msg-3',
    user_id: userId,
    session_id: session3,
    created_at: '2024-01-05T14:00:00Z', // 4 days later
    content: 'Message days later'
  });

  // Test 4: Days later - STILL same session
  console.log('\nTest 4: Days later - still same session');
  const session4 = getOrCreateSession(userId);
  console.log(`  Session ID: ${session4}`);
  console.log(`  Same as original: ${session4 === session1 ? '✅ YES' : '❌ NO'}`);

  // Summary
  console.log('\n' + '=' .repeat(40));
  console.log('Summary:');
  console.log(`  Total messages: ${mockDatabase.chatMessages.length}`);
  console.log(`  Unique sessions: ${new Set(mockDatabase.chatMessages.map(m => m.session_id)).size}`);
  console.log(`  Result: ${session1 === session2 && session2 === session3 && session3 === session4 ?
    '✅ All sessions are the same (persistent)!' :
    '❌ Sessions changed (not persistent)'}`);

  // Show message timeline
  console.log('\nMessage Timeline:');
  mockDatabase.chatMessages.forEach(msg => {
    const date = new Date(msg.created_at);
    console.log(`  ${date.toISOString()} - ${msg.content}`);
    console.log(`    Session: ${msg.session_id.substring(0, 8)}...`);
  });
}

// Run the test
console.log('\n🚀 Persistent Session Local Test\n');
runTest();
console.log('\n✅ Test completed!\n');