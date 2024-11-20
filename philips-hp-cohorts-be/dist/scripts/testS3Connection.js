"use strict";
// src/scripts/testConnection.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const s3Helper_1 = require("../utils/s3Helper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function testConnection() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const files = yield s3Helper_1.S3Helper.listFiles();
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
            yield s3Helper_1.S3Helper.uploadFile(testKey, testData);
            console.log('✅ Successfully uploaded test file');
            console.log('File key:', testKey);
            console.log();
            // Test 3: Read test file
            console.log('Test 3: Reading test file...');
            const readData = yield s3Helper_1.S3Helper.getFile(testKey);
            console.log('✅ Successfully read test file');
            console.log('File contents:', readData);
            console.log();
            // Test 4: Delete test file
            console.log('Test 4: Deleting test file...');
            yield s3Helper_1.S3Helper.deleteFile(testKey);
            console.log('✅ Successfully deleted test file');
            console.log();
            console.log('🎉 All connection tests passed successfully!');
        }
        catch (error) {
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
    });
}
// Run the test
testConnection();
