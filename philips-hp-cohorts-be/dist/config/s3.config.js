"use strict";
// src/config/s3.config.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUCKET_NAME = void 0;
exports.getS3Client = getS3Client;
const client_s3_1 = require("@aws-sdk/client-s3");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = [
    'AWS_REGION',
    'BUCKET_NAME'
];
requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});
function getS3Client() {
    try {
        // Create S3 client - AWS SDK will automatically handle credentials
        const s3Client = new client_s3_1.S3Client({
            region: process.env.AWS_REGION
        });
        return s3Client;
    }
    catch (error) {
        console.error('Error creating S3 client:', error);
        throw error;
    }
}
exports.BUCKET_NAME = process.env.BUCKET_NAME;
