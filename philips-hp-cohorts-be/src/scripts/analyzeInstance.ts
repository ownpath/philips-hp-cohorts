// src/scripts/analyzeInstance.ts

import { S3Helper } from '../utils/s3Helper';
import dotenv from 'dotenv';

dotenv.config();

interface UserData {
    welphiInstanceId: string;
    userId: string;
    grade: number;
    value: number;
    timestamp: string;
}

const INSTANCE_ID = 'f6159a67-9365-44e5-bf0f-c267b4046060';
const COHORT_NAME = 'welphis';

function getGradeDescription(grade: number): string {
    switch (grade) {
        case 1: return 'Dark Orange';
        case 2: return 'Dark Amber';
        case 3: return 'Amber';
        case 4: return 'Light green';
        case 5: return 'Dark green';
        default: return 'Unknown';
    }
}

async function analyzeInstanceData() {
    console.log('Analyzing Instance Data\n');
    console.log('Configuration:');
    console.log('- Instance ID:', INSTANCE_ID);
    console.log('- Cohort:', COHORT_NAME);
    console.log('\n-------------------\n');

    try {
        // Get all files for this instance
        const files = await S3Helper.listFiles(`${COHORT_NAME}/${INSTANCE_ID}/`);
        const userData: UserData[] = [];

        // Read and collect all user data
        for (const file of files) {
            const data = await S3Helper.getFile(file);
            userData.push(data);
        }

        // Sort by timestamp
        userData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Basic Statistics
        console.log('Basic Statistics:');
        console.log(`Total Users: ${userData.length}`);
        console.log('\n-------------------\n');

        // Value Statistics
        const values = userData.map(u => u.value);
        console.log('HeartPrint Values:');
        console.log(`Minimum: ${Math.min(...values)}`);
        console.log(`Maximum: ${Math.max(...values)}`);
        console.log(`Average: ${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)}`);
        console.log('\n-------------------\n');

        // Grade Distribution
        const gradeDistribution = userData.reduce((acc, user) => {
            acc[user.grade] = (acc[user.grade] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);

        console.log('Grade Distribution:');
        Object.entries(gradeDistribution)
            .sort(([a], [b]) => Number(a) - Number(b))
            .forEach(([grade, count]) => {
                console.log(`Grade ${grade} (${getGradeDescription(Number(grade))}): ${count} users`);
            });
        console.log('\n-------------------\n');

        // Timeline Analysis
        console.log('Timeline:');
        console.log('First Entry:', new Date(userData[0].timestamp).toLocaleString());
        console.log('Latest Entry:', new Date(userData[userData.length - 1].timestamp).toLocaleString());
        console.log('\n-------------------\n');

        // Detailed User List
        console.log('Detailed User List:');
        userData.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log(`- ID: ${user.userId}`);
            console.log(`- Value: ${user.value}`);
            console.log(`- Grade: ${user.grade} (${getGradeDescription(user.grade)})`);
            console.log(`- Timestamp: ${new Date(user.timestamp).toLocaleString()}`);
            console.log();
        });

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        if (error.Code === 'AccessDenied') {
            console.log('Please verify read access to this instance');
        }
    }
}

// Run the analysis
analyzeInstanceData();