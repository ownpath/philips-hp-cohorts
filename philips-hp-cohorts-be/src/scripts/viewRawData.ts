// src/scripts/viewRawData.ts

import { S3Helper } from '../utils/s3Helper';
import dotenv from 'dotenv';

dotenv.config();

const INSTANCE_ID = '6d904bcc-dfbc-4274-adb2-0118fc01da89';
const COHORT_NAME = 'welphis';

async function viewRawData() {
    console.log('Viewing Raw Instance Data\n');
    console.log('Configuration:');
    console.log('- Bucket:', process.env.BUCKET_NAME);
    console.log('- Instance ID:', INSTANCE_ID);
    console.log('- Path:', `${COHORT_NAME}/${INSTANCE_ID}/`);
    console.log('\n-------------------\n');

    try {
        // List all files under this instance
        console.log('Listing files for instance...');
        const files = await S3Helper.listFiles(`${COHORT_NAME}/${INSTANCE_ID}/`);
        console.log(`Found ${files.length} files\n`);

        // Read each file's contents
        console.log('Raw file contents:\n');
        for (const filePath of files) {
            try {
                console.log(`File: ${filePath}`);
                console.log('Contents:');
                const data = await S3Helper.getFile(filePath);
                console.log(JSON.stringify(data, null, 2));
                console.log('\n-------------------\n');

            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
            }
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.Code === 'AccessDenied') {
            console.log('Please verify read access to this instance');
        }
    }
}

// Run the viewer
viewRawData();