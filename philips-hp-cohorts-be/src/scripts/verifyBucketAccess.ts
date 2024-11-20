// src/scripts/verifyBucketAccess.ts

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const BUCKET_NAME = 'philips-hp-mock';

async function verifyAccess() {
    console.log('Verifying access to specific bucket...\n');

    try {
        const s3Client = new S3Client({ region: 'ap-south-1' });

        // Try to list objects in the specific bucket
        console.log(`Testing access to bucket: ${BUCKET_NAME}`);
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            MaxKeys: 5
        });

        const response = await s3Client.send(command);
        
        console.log('\n✅ Success! Access verified.');
        console.log('First few objects in bucket:');
        response.Contents?.forEach(object => {
            console.log(`- ${object.Key} (${object.Size} bytes)`);
        });

    } catch (error: any) {
        console.error('\n❌ Access verification failed:', error.message);
        
        if (error.name === 'NoSuchBucket') {
            console.log('\nError: Bucket does not exist or name is incorrect');
        } else if (error.name === 'AccessDenied') {
            console.log('\nError: Access denied. Please check IAM permissions');
        }

        console.log('\nRequired permissions:');
        console.log('- s3:ListBucket on the bucket');
        console.log('- s3:GetObject on bucket objects');
        console.log('- s3:PutObject on bucket objects');
        console.log('- s3:DeleteObject on bucket objects');
    }
}

verifyAccess();