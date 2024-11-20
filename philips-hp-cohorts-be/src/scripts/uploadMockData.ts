// src/scripts/uploadMockData.ts

import { S3Helper } from '../utils/s3Helper';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Constants for mock data
const INSTANCE_ID = "36e63927-7d61-4204-af43-5a933016ea14";
const COHORT_NAME = "welphis";

interface UserData {
  _index: string;
  _type: string;
  _id: string;
  _score: number;
  _source: {
    welphiInstanceId: string;
    userId: string;
    grade: number;
    value: number;
    createdDT: number;
  };
}

interface MetadataJson {
  endDate: number;
  cohortId: string;
  startDate: number;
  title: string;
  Template: string;
}

function generateUserData(): UserData {
  const userId = uuidv4();
  const value = Math.floor(Math.random() * 101);
  const grade = value >= 80 ? 5 
              : value >= 60 ? 4 
              : value >= 40 ? 3 
              : value >= 20 ? 2 
              : 1;

  return {
    _index: `cad_welphi_score_${INSTANCE_ID}`,
    _type: "_doc",
    _id: userId,
    _score: 1.0,
    _source: {
      welphiInstanceId: INSTANCE_ID,
      userId: userId,
      grade: grade,
      value: value,
      createdDT: Date.now()
    }
  };
}

function generateMetadata(): MetadataJson {
  const startDate = Date.now();
  return {
    endDate: startDate + (30 * 24 * 60 * 60 * 1000), // 30 days from now
    cohortId: uuidv4(),
    startDate: startDate,
    title: "Heart Print HeRve",
    Template: "BubbleChart"
  };
}

async function uploadMockData() {
  try {
    console.log('Starting mock data upload...\n');

    // Upload metadata
    console.log('Uploading metadata...');
    const metadata = generateMetadata();
    await S3Helper.uploadFile(
      `${COHORT_NAME}/${INSTANCE_ID}/metadata.json`,
      metadata
    );
    console.log('✅ Metadata uploaded successfully');

    // Upload user data files
    const numberOfUsers = 10;
    console.log(`\nUploading ${numberOfUsers} user files...`);
    
    for (let i = 0; i < numberOfUsers; i++) {
      const userData = generateUserData();
      const key = `${COHORT_NAME}/${INSTANCE_ID}/${userData._source.userId}.json`;
      
      await S3Helper.uploadFile(key, userData);
      console.log(`✅ Uploaded user file ${i + 1}/${numberOfUsers}`);
    }

    console.log('\n🎉 Mock data upload completed successfully!');
    
  } catch (error) {
    console.error('Error uploading mock data:', error);
    process.exit(1);
  }
}

// Run the upload
uploadMockData();