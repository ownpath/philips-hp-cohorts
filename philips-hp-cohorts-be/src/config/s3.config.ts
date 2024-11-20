// src/config/s3.config.ts

import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';


dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'AWS_REGION',
  'BUCKET_NAME'
] as const;

requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

export function getS3Client() {
  try {
    // Create S3 client - AWS SDK will automatically handle credentials
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!
    });

    return s3Client;
  } catch (error) {
    console.error('Error creating S3 client:', error);
    throw error;
  }
}

export const BUCKET_NAME = process.env.BUCKET_NAME!;