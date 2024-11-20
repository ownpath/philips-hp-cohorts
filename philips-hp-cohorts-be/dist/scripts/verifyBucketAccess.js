"use strict";
// src/scripts/verifyBucketAccess.ts
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
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const BUCKET_NAME = 'philips-hp-mock';
function verifyAccess() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('Verifying access to specific bucket...\n');
        try {
            const s3Client = new client_s3_1.S3Client({ region: 'ap-south-1' });
            // Try to list objects in the specific bucket
            console.log(`Testing access to bucket: ${BUCKET_NAME}`);
            const command = new client_s3_1.ListObjectsV2Command({
                Bucket: BUCKET_NAME,
                MaxKeys: 5
            });
            const response = yield s3Client.send(command);
            console.log('\n✅ Success! Access verified.');
            console.log('First few objects in bucket:');
            (_a = response.Contents) === null || _a === void 0 ? void 0 : _a.forEach(object => {
                console.log(`- ${object.Key} (${object.Size} bytes)`);
            });
        }
        catch (error) {
            console.error('\n❌ Access verification failed:', error.message);
            if (error.name === 'NoSuchBucket') {
                console.log('\nError: Bucket does not exist or name is incorrect');
            }
            else if (error.name === 'AccessDenied') {
                console.log('\nError: Access denied. Please check IAM permissions');
            }
            console.log('\nRequired permissions:');
            console.log('- s3:ListBucket on the bucket');
            console.log('- s3:GetObject on bucket objects');
            console.log('- s3:PutObject on bucket objects');
            console.log('- s3:DeleteObject on bucket objects');
        }
    });
}
verifyAccess();
