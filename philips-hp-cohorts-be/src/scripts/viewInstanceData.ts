// src/scripts/viewInstanceData.ts

import { S3Helper } from '../utils/s3Helper';
import dotenv from 'dotenv';

dotenv.config();

const INSTANCE_ID = 'f6159a67-9365-44e5-bf0f-c267b4046060';
const COHORT_NAME = 'welphis';

async function viewInstanceData() {
    console.log('Viewing Instance Data\n');
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
        console.log('Reading file contents:\n');
        for (const filePath of files) {
            try {
                console.log(`File: ${filePath}`);
                const data = await S3Helper.getFile(filePath);
                
                // If it's metadata.json, format it differently
                if (filePath.endsWith('metadata.json')) {
                    console.log('Metadata File:');
                    console.log('- Title:', data.title);
                    console.log('- Cohort ID:', data.cohortId);
                    console.log('- Start Date:', new Date(data.startDate).toLocaleString());
                    console.log('- End Date:', new Date(data.endDate).toLocaleString());
                    console.log('- Template:', data.Template);
                } else {
                    // For user data files
                    const userId = data._source?.userId || 'Unknown';
                    const grade = data._source?.grade || 'N/A';
                    const value = data._source?.value || 'N/A';
                    const createdDT = data._source?.createdDT ? 
                        new Date(data._source.createdDT).toLocaleString() : 'N/A';

                    console.log('User Data:');
                    console.log('- User ID:', userId);
                    console.log('- Grade:', grade);
                    console.log('- Value:', value);
                    console.log('- Created:', createdDT);
                }
                console.log('\n-------------------\n');

            } catch (error) {
                console.error(`Error reading file ${filePath}:`, error);
            }
        }

        // Print summary
        console.log('\nSummary:');
        console.log(`Total files processed: ${files.length}`);
        console.log('Metadata file:', files.some(f => f.endsWith('metadata.json')) ? 'Found' : 'Not found');
        console.log('User data files:', files.filter(f => !f.endsWith('metadata.json')).length);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        
        if (error.Code === 'AccessDenied') {
            console.log('\nAccess Denied Error:');
            console.log('- Verify you have read access to this instance');
            console.log('- Check if the instance ID is correct');
        } else if (error.Code === 'NoSuchKey') {
            console.log('\nNo Such Key Error:');
            console.log('- Check if the instance ID is correct');
            console.log('- Verify the path structure is correct');
        }
    }
}

// Run the viewer
viewInstanceData();