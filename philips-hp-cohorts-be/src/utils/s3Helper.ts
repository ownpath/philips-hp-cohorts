// src/utils/s3Helper.ts

import { getS3Client, BUCKET_NAME } from '../config/s3.config';
import { 
  ListObjectsV2Command, 
  GetObjectCommand, 
  PutObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';

export class S3Helper {
  static async listFiles(prefix?: string): Promise<string[]> {
    try {
      const s3Client = await getS3Client();
      
      const command = new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix
      });

      const response = await s3Client.send(command);
      return response.Contents?.map(file => file.Key || '') || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  static async uploadFile(key: string, data: any): Promise<string> {
    try {
      const s3Client = await getS3Client();
      
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(data, null, 2),
        ContentType: 'application/json'
      });

      await s3Client.send(command);
      return key;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  static async getFile(key: string): Promise<any> {
    try {
      const s3Client = await getS3Client();
      
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      const response = await s3Client.send(command);
      const bodyContents = await response.Body?.transformToString();
      if (!bodyContents) {
        throw new Error('Empty response body');
      }
      return JSON.parse(bodyContents);
    } catch (error) {
      console.error('Error getting file:', error);
      throw error;
    }
  }

  static async deleteFile(key: string): Promise<void> {
    try {
      const s3Client = await getS3Client();
      
      const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      });

      await s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}