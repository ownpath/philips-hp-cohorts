// src/scripts/testBucketAccess.ts

import { S3Helper } from '../utils/s3Helper';
import dotenv from 'dotenv';

dotenv.config();

async function testBucketAccess() {
    console.log('Testing S3 Bucket Access\n');
    console.log('Configuration:');
    console.log('- Region:', process.env.AWS_REGION);
    console.log('- Bucket:', process.env.BUCKET_NAME);
    console.log();

    try {
        // Test 1: List files
        console.log('Test 1: Listing files...');
        const files = await S3Helper.listFiles();
        console.log('✅ Successfully listed files');
        console.log(`Found ${files.length} files`);
        if (files.length > 0) {
            console.log('Sample files:', files.slice(0, 3));
        }
        console.log();

        // Test 2: Upload test file
        console.log('Test 2: Uploading test file...');
        const testData = {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Test file'
        };
        const testKey = `test/access-test-${Date.now()}.json`;
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

        console.log('🎉 All bucket access tests passed successfully!');

    } catch (error: any) {
        console.error('\n❌ Bucket Access Test Failed:', error.message);
        console.log('\nTroubleshooting tips:');
        console.log('1. Verify the bucket name is correct');
        console.log('2. Check if your account has been granted access by the client');
        console.log('3. Ensure your IAM role has the necessary S3 permissions');
        
        if (error.Code === 'AccessDenied') {
            console.log('\nAccess Denied Error:');
            console.log('- Ask the client to verify they have set up the correct permissions');
            console.log('- Confirm the bucket name is exactly as provided by the client');
        }
    }
}

testBucketAccess();