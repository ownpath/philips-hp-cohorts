"use strict";
// src/scripts/testBucketAccess.ts
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
function testBucketAccess() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Testing S3 Bucket Access\n');
        console.log('Configuration:');
        console.log('- Region:', process.env.AWS_REGION);
        console.log('- Bucket:', process.env.BUCKET_NAME);
        console.log();
        try {
            // Test 1: List files
            console.log('Test 1: Listing files...');
            const files = yield s3Helper_1.S3Helper.listFiles();
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
            console.log('🎉 All bucket access tests passed successfully!');
        }
        catch (error) {
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
    });
}
testBucketAccess();
