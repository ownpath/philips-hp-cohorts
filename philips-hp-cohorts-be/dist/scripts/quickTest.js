"use strict";
// src/scripts/quickTest.ts
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
function quickTest() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('Testing S3 Access\n');
        try {
            // Create S3 client
            const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_REGION });
            // List all buckets (this will verify our credentials work)
            console.log('Attempting to list buckets...');
            const command = new client_s3_1.ListBucketsCommand({});
            const response = yield s3Client.send(command);
            console.log('\n✅ Successfully connected to S3!');
            console.log('Available buckets:', (_a = response.Buckets) === null || _a === void 0 ? void 0 : _a.map(b => b.Name));
        }
        catch (error) {
            console.error('\n❌ S3 Access Failed:', error.message);
            console.log('\nTroubleshooting tips:');
            console.log('1. Verify your IAM user has the necessary S3 permissions');
            console.log('2. Check if the AWS CLI credentials are configured correctly');
            console.log('\nRequired IAM permissions:');
            console.log(`{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:ListBucket",
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject"
          ],
          "Resource": [
            "arn:aws:s3:::${process.env.TARGET_BUCKET_NAME}",
            "arn:aws:s3:::${process.env.TARGET_BUCKET_NAME}/*"
          ]
        }
      ]
    }`);
        }
    });
}
quickTest();
