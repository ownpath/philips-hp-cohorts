// src/scripts/testConnection.ts

import { S3Helper } from '../utils/s3Helper';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  console.log('🔍 Testing S3 Role-based Connection...\n');
  console.log('Configuration:');
  console.log('- Region:', process.env.AWS_REGION);
  console.log('- Account ID:', process.env.TARGET_ACCOUNT_ID);
  console.log('- Role Name:', process.env.ROLE_NAME);
  console.log('- Bucket:', process.env.TARGET_BUCKET_NAME);
  console.log('- Full Role ARN:', `arn:aws:iam::${process.env.TARGET_ACCOUNT_ID}:role/${process.env.ROLE_NAME}`);
  console.log();

  try {
    // Test 1: List files
    console.log('Test 1: Listing files...');
    const files = await S3Helper.listFiles();
    console.log('✅ Successfully listed files');
    console.log(`Found ${files.length} files in bucket`);
    if (files.length > 0) {
      console.log('Sample files:', files.slice(0, 3));
    }
    console.log();

    // Test 2: Upload test file
    console.log('Test 2: Uploading test file...');
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Role-based access test'
    };
    const testKey = `test/connection-test-${Date.now()}.json`;
    await S3Helper.uploadFile(testKey, testData);
    console.log('✅ Successfully uploaded test file');
    console.log('File key:', testKey);
    console.log();

    // Test 3: Read test file
    console.log('Test 3: Reading test file...');
    const readData = await S3Helper.getFile(testKey);
    console.log('✅ Successfully read test file');
    console.log('File contents:', readData);
    console.log();

    // Test 4: Delete test file
    console.log('Test 4: Deleting test file...');
    await S3Helper.deleteFile(testKey);
    console.log('✅ Successfully deleted test file');
    console.log();

    console.log('🎉 All connection tests passed successfully!');

  } catch (error: any) {
    console.error('\n❌ Connection Test Failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if the role exists and has correct trust relationship');
    console.log('2. Verify the role has AmazonS3FullAccess policy');
    console.log('3. Confirm the bucket exists and is accessible');
    console.log('4. Check if environment variables are set correctly');
    
    if (error.Code === 'AccessDenied') {
      console.log('\nAccess Denied Error:');
      console.log('- Verify the role trust policy includes your account');
      console.log('- Check if the role has necessary S3 permissions');
    }
    
    process.exit(1);
  }
}

// Run the test
testConnection();