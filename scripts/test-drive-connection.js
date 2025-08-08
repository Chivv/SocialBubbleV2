// Test script to verify Google Drive connection
// Run with: node scripts/test-drive-connection.js

import { testDriveConnection } from '../lib/google-drive.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function test() {
  console.log('Testing Google Drive connection...');
  
  try {
    const connected = await testDriveConnection();
    
    if (connected) {
      console.log('✅ Successfully connected to Google Drive!');
      console.log('Your service account is properly configured.');
    } else {
      console.log('❌ Failed to connect to Google Drive.');
      console.log('Please check your service account configuration.');
    }
  } catch (error) {
    console.error('❌ Error testing connection:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Ensure GOOGLE_SERVICE_ACCOUNT_KEY is set in .env.local');
    console.log('2. Verify the key is properly base64 encoded');
    console.log('3. Check that the Drive API is enabled in Google Cloud Console');
  }
}

test();