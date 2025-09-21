const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:3000';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testChatAPI() {
  if (!AUTH_TOKEN) {
    logWarning('No AUTH_TOKEN provided. Please run test-auth.js first to get a token.');
    logInfo('Example: AUTH_TOKEN=your_token_here npm run test:chat');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  log('\n🧪 Testing Chat Messages API', colors.bright + colors.blue);
  log('=' .repeat(50), colors.blue);

  try {
    // Test 1: GET chat messages (should create session if needed)
    logInfo('\n1. Testing GET /api/chat/messages...');
    const getResponse = await axios.get(`${API_BASE}/api/chat/messages`, { headers });

    if (getResponse.data.success) {
      logSuccess('GET request successful');
      log(`   Session ID: ${getResponse.data.session_id}`);
      log(`   Messages count: ${getResponse.data.total}`);

      const sessionId = getResponse.data.session_id;

      // Test 2: POST a user message
      logInfo('\n2. Testing POST /api/chat/messages (user message)...');
      const userMessage = {
        message_type: 'user',
        prompt: 'Test prompt for image generation',
        generation_type: 'text-to-image',
        session_id: sessionId,
      };

      const postUserResponse = await axios.post(
        `${API_BASE}/api/chat/messages`,
        userMessage,
        { headers }
      );

      if (postUserResponse.data.success) {
        logSuccess('User message saved successfully');
        log(`   Message ID: ${postUserResponse.data.message.id}`);
        log(`   Session ID: ${postUserResponse.data.session_id}`);
      }

      // Test 3: POST an assistant message
      logInfo('\n3. Testing POST /api/chat/messages (assistant message)...');
      const assistantMessage = {
        message_type: 'assistant',
        content: 'Here is your generated image',
        image_url: 'https://example.com/test-image.png',
        credits_used: 4,
        session_id: sessionId,
      };

      const postAssistantResponse = await axios.post(
        `${API_BASE}/api/chat/messages`,
        assistantMessage,
        { headers }
      );

      if (postAssistantResponse.data.success) {
        logSuccess('Assistant message saved successfully');
        log(`   Message ID: ${postAssistantResponse.data.message.id}`);
      }

      // Test 4: GET messages again to verify they were saved
      logInfo('\n4. Verifying messages were saved...');
      const verifyResponse = await axios.get(
        `${API_BASE}/api/chat/messages?session_id=${sessionId}`,
        { headers }
      );

      if (verifyResponse.data.success) {
        const messageCount = verifyResponse.data.messages.length;
        logSuccess(`Messages retrieved successfully (${messageCount} messages)`);

        // Display the messages
        verifyResponse.data.messages.forEach((msg, index) => {
          log(`\n   Message ${index + 1}:`);
          log(`   - Type: ${msg.message_type}`);
          log(`   - Content: ${msg.content || msg.prompt || '(no content)'}`);
          if (msg.image_url) log(`   - Image: ${msg.image_url}`);
          if (msg.credits_used) log(`   - Credits: ${msg.credits_used}`);
        });
      }

      // Test 5: Test error handling with invalid message type
      logInfo('\n5. Testing error handling (invalid message type)...');
      try {
        await axios.post(
          `${API_BASE}/api/chat/messages`,
          { content: 'Test' }, // Missing message_type
          { headers }
        );
        logError('Should have failed with missing message_type');
      } catch (error) {
        if (error.response?.status === 400) {
          logSuccess('Correctly returned 400 for missing message_type');
        } else {
          logError(`Unexpected error: ${error.response?.status} - ${error.response?.data?.error}`);
        }
      }

      // Test 6: Test session creation for new conversation
      logInfo('\n6. Testing new session creation...');
      const newSessionResponse = await axios.post(
        `${API_BASE}/api/chat/sessions`,
        {},
        { headers }
      );

      if (newSessionResponse.data.session_id) {
        logSuccess('New session created successfully');
        log(`   New Session ID: ${newSessionResponse.data.session_id}`);
      }

    } else {
      logError('GET request failed');
      console.error(getResponse.data);
    }

  } catch (error) {
    logError(`API test failed: ${error.message}`);
    if (error.response) {
      log(`\nError details:`, colors.red);
      log(`Status: ${error.response.status}`, colors.red);
      log(`Data: ${JSON.stringify(error.response.data, null, 2)}`, colors.red);

      if (error.response.status === 500) {
        logWarning('\n⚠️  The API returned a 500 error. Possible causes:');
        log('1. The database function get_or_create_session may not exist');
        log('2. Run the SQL script: psql $DATABASE_URL < fix-database-function.sql');
        log('3. Or the fallback logic should handle this automatically');
      }
    } else {
      log(`\nFull error: ${error.stack}`, colors.red);
    }
  }

  log('\n' + '='.repeat(50), colors.blue);
  log('✨ Chat API tests completed', colors.bright + colors.blue);
}

// Run the test
testChatAPI().catch(console.error);