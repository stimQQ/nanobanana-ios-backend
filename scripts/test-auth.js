#!/usr/bin/env node

// Test script for authentication flow
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';

async function testDevAuth() {
  console.log('Testing Development Authentication...');

  try {
    const response = await axios.post(`${API_URL}/api/auth/dev`, {
      email: 'test@example.com',
      name: 'Test User'
    });

    if (response.data.success && response.data.token) {
      console.log('✅ Dev Auth Success!');
      console.log('Token:', response.data.token.substring(0, 20) + '...');
      console.log('User:', response.data.user);
      return response.data.token;
    } else {
      console.error('❌ Dev Auth Failed:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Dev Auth Error:', error.response?.data || error.message);
    return null;
  }
}

async function testProfile(token) {
  console.log('\nTesting Profile Endpoint...');

  try {
    const response = await axios.get(`${API_URL}/api/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.user) {
      console.log('✅ Profile Fetch Success!');
      console.log('User Profile:', response.data.user);
      return true;
    } else {
      console.error('❌ Profile Fetch Failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Profile Fetch Error:', error.response?.data || error.message);
    return false;
  }
}

async function testGoogleAuthEndpoint() {
  console.log('\nTesting Google Auth Endpoint Availability...');

  try {
    // Test OPTIONS request for CORS
    const optionsResponse = await axios.options(`${API_URL}/api/auth/google`);
    console.log('✅ Google Auth OPTIONS request successful');
    console.log('CORS Headers:', optionsResponse.headers);

    // Test with invalid data to check endpoint exists
    try {
      await axios.post(`${API_URL}/api/auth/google`, {
        credential: null
      });
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Google Auth endpoint exists and validates input');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Google Auth Endpoint Error:', error.response?.data || error.message);
    return false;
  }
}

async function testHealthCheck() {
  console.log('\nTesting Health Check...');

  try {
    const response = await axios.get(`${API_URL}/api/health`);
    console.log('✅ Health Check:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('=================================');
  console.log('Authentication Flow Test Suite');
  console.log(`API URL: ${API_URL}`);
  console.log('=================================\n');

  // Test health check
  await testHealthCheck();

  // Test Google Auth endpoint
  await testGoogleAuthEndpoint();

  // Test dev authentication
  const token = await testDevAuth();

  if (token) {
    // Test authenticated endpoints
    await testProfile(token);
  }

  console.log('\n=================================');
  console.log('Test Suite Complete');
  console.log('=================================');
}

// Run tests
runTests().catch(console.error);