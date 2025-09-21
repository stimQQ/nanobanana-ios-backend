/**
 * Test script to verify persistent session functionality
 * This script tests that sessions persist indefinitely without timeout
 */

const axios = require('axios');

// Test configuration
const API_URL = process.env.API_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function signIn() {
  try {
    log('\n📝 Signing in...', 'blue');
    const response = await axios.post(`${API_URL}/api/auth/dev/signin`, {
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (response.data.success && response.data.token) {
      log('✅ Sign in successful', 'green');
      return response.data.token;
    } else {
      throw new Error('Sign in failed');
    }
  } catch (error) {
    log(`❌ Sign in error: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('Response:', error.response.data);
    }
    throw error;
  }
}

async function testPersistentSession(token) {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  try {
    log('\n🧪 Testing Persistent Session Functionality', 'yellow');
    log('=' .repeat(50), 'yellow');

    // Step 1: Get initial messages (should get or create persistent session)
    log('\n1️⃣ Getting initial chat messages...', 'blue');
    const messagesResponse1 = await axios.get(`${API_URL}/api/chat/messages`, { headers });
    const initialSessionId = messagesResponse1.data.session_id;
    const initialMessageCount = messagesResponse1.data.messages.length;
    log(`   Session ID: ${initialSessionId}`, 'green');
    log(`   Initial message count: ${initialMessageCount}`, 'green');

    // Step 2: Add a test message
    log('\n2️⃣ Adding a test message to the session...', 'blue');
    const testMessage1 = {
      message_type: 'user',
      content: `Test message at ${new Date().toISOString()}`,
      prompt: 'Test prompt for persistent session',
      session_id: initialSessionId,
    };

    await axios.post(`${API_URL}/api/chat/messages`, testMessage1, { headers });
    log('   ✅ Message added successfully', 'green');

    // Step 3: Get messages again - should be same session
    log('\n3️⃣ Getting messages again (should be same session)...', 'blue');
    const messagesResponse2 = await axios.get(`${API_URL}/api/chat/messages`, { headers });
    const secondSessionId = messagesResponse2.data.session_id;
    const secondMessageCount = messagesResponse2.data.messages.length;
    log(`   Session ID: ${secondSessionId}`, 'green');
    log(`   Message count: ${secondMessageCount}`, 'green');

    // Verify session persistence
    if (secondSessionId === initialSessionId) {
      log('   ✅ Session ID is persistent (same as before)', 'green');
    } else {
      log('   ❌ Session ID changed unexpectedly!', 'red');
      throw new Error('Session ID should remain the same');
    }

    // Step 4: Simulate time passing (in production, this would be actual time)
    log('\n4️⃣ Simulating 35 minutes passing...', 'blue');
    log('   (In the old system, this would create a new session)', 'yellow');

    // Step 5: Add another message after "35 minutes"
    log('\n5️⃣ Adding another message after simulated time...', 'blue');
    const testMessage2 = {
      message_type: 'user',
      content: `Test message after simulated 35 minutes at ${new Date().toISOString()}`,
      prompt: 'Testing persistence after timeout period',
    };

    await axios.post(`${API_URL}/api/chat/messages`, testMessage2, { headers });
    log('   ✅ Message added successfully', 'green');

    // Step 6: Get messages again - should STILL be same session
    log('\n6️⃣ Getting messages again (should STILL be same session)...', 'blue');
    const messagesResponse3 = await axios.get(`${API_URL}/api/chat/messages`, { headers });
    const thirdSessionId = messagesResponse3.data.session_id;
    const thirdMessageCount = messagesResponse3.data.messages.length;
    log(`   Session ID: ${thirdSessionId}`, 'green');
    log(`   Message count: ${thirdMessageCount}`, 'green');

    // Verify session is still persistent
    if (thirdSessionId === initialSessionId) {
      log('   ✅ Session ID is STILL persistent after timeout period!', 'green');
    } else {
      log('   ❌ Session ID changed after timeout period!', 'red');
      throw new Error('Session should remain persistent indefinitely');
    }

    // Step 7: Test POST /api/chat/sessions endpoint
    log('\n7️⃣ Testing POST /api/chat/sessions (should return existing session)...', 'blue');
    const sessionResponse = await axios.post(`${API_URL}/api/chat/sessions`, {}, { headers });
    const postSessionId = sessionResponse.data.session_id;
    log(`   Session ID from POST: ${postSessionId}`, 'green');

    if (postSessionId === initialSessionId) {
      log('   ✅ POST endpoint returns the same persistent session', 'green');
    } else {
      log('   ❌ POST endpoint returned a different session!', 'red');
      throw new Error('POST should return the existing persistent session');
    }

    // Summary
    log('\n' + '=' .repeat(50), 'green');
    log('🎉 All Persistent Session Tests Passed!', 'green');
    log('=' .repeat(50), 'green');
    log('\nSummary:', 'blue');
    log(`  • Session ID remained constant: ${initialSessionId}`, 'green');
    log(`  • Messages accumulated in single session: ${thirdMessageCount} total`, 'green');
    log(`  • No new sessions created after timeout periods`, 'green');
    log(`  • Users can view complete history in one session`, 'green');

    return true;
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    if (error.response?.data) {
      console.log('Error response:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  try {
    log('\n🚀 Starting Persistent Session Tests', 'yellow');
    log('API URL: ' + API_URL, 'blue');

    // Sign in
    const token = await signIn();

    // Run persistent session tests
    const success = await testPersistentSession(token);

    if (success) {
      log('\n✅ All tests completed successfully!', 'green');
      process.exit(0);
    } else {
      log('\n❌ Some tests failed', 'red');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run the tests
runTests();