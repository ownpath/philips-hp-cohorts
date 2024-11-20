// src/scripts/quickTest.ts

import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

async function quickTest() {
  console.log('Testing S3 Access\n');

  try {
    // Create S3 client
    const s3Client = new S3Client({ region: process.env.AWS_REGION! });

    // List all buckets (this will verify our credentials work)
    console.log('Attempting to list buckets...');
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    console.log('\n✅ Successfully connected to S3!');
    console.log('Available buckets:', response.Buckets?.map(b => b.Name));

  } catch (error: any) {
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
}

quickTest();