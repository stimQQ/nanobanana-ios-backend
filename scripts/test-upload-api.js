const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const axios = require('axios');
require('dotenv').config({ path: '.env.local' });

// First, we need to get an auth token
async function getAuthToken() {
  try {
    // For testing, we'll use the dev auth endpoint
    const response = await axios.post('http://localhost:3000/api/auth/dev', {
      userId: 'test-user-123'
    });

    return response.data.token;
  } catch (error) {
    console.error('Failed to get auth token:', error.message);
    // Use a mock token for testing
    return 'mock-test-token';
  }
}

async function testUploadAPI() {
  console.log('=== Testing Upload API ===\n');

  try {
    const token = await getAuthToken();
    console.log('Auth token obtained:', token ? 'Yes' : 'No');

    // Create a test image file
    const testImagePath = path.join(__dirname, '..', 'test-upload.png');

    // Create a simple 1x1 PNG if it doesn't exist
    if (!fs.existsSync(testImagePath)) {
      console.log('Creating test image...');
      const pngData = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      fs.writeFileSync(testImagePath, pngData);
    }

    // Prepare form data
    const form = new FormData();
    form.append('file', fs.createReadStream(testImagePath), {
      filename: 'test-upload.png',
      contentType: 'image/png'
    });
    form.append('purpose', 'test');

    console.log('\nUploading test image...');

    // Make the upload request
    const response = await axios.post('http://localhost:3000/api/upload/image', form, {
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'en'
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });

    console.log('\nUpload Response:');
    console.log('- Success:', response.data.success);
    console.log('- Image URL:', response.data.image_url);
    console.log('- Image ID:', response.data.image_id);

    if (response.data.message) {
      console.log('- Message:', response.data.message);
    }

    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\nTest image cleaned up');
    }

  } catch (error) {
    console.error('\nUpload test failed:');
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Data:', error.response.data);
    } else {
      console.error('- Error:', error.message);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/api/status');
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.log('Server is not running. Please start the Next.js server first:');
    console.log('npm run dev');
    process.exit(1);
  }

  await testUploadAPI();
}

main();