"use strict";
// src/scripts/viewInstanceData.ts
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
const s3Helper_1 = require("../utils/s3Helper");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const INSTANCE_ID = 'f6159a67-9365-44e5-bf0f-c267b4046060';
const COHORT_NAME = 'welphis';
function viewInstanceData() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        console.log('Viewing Instance Data\n');
        console.log('Configuration:');
        console.log('- Bucket:', process.env.BUCKET_NAME);
        console.log('- Instance ID:', INSTANCE_ID);
        console.log('- Path:', `${COHORT_NAME}/${INSTANCE_ID}/`);
        console.log('\n-------------------\n');
        try {
            // List all files under this instance
            console.log('Listing files for instance...');
            const files = yield s3Helper_1.S3Helper.listFiles(`${COHORT_NAME}/${INSTANCE_ID}/`);
            console.log(`Found ${files.length} files\n`);
            // Read each file's contents
            console.log('Reading file contents:\n');
            for (const filePath of files) {
                try {
                    console.log(`File: ${filePath}`);
                    const data = yield s3Helper_1.S3Helper.getFile(filePath);
                    // If it's metadata.json, format it differently
                    if (filePath.endsWith('metadata.json')) {
                        console.log('Metadata File:');
                        console.log('- Title:', data.title);
                        console.log('- Cohort ID:', data.cohortId);
                        console.log('- Start Date:', new Date(data.startDate).toLocaleString());
                        console.log('- End Date:', new Date(data.endDate).toLocaleString());
                        console.log('- Template:', data.Template);
                    }
                    else {
                        // For user data files
                        const userId = ((_a = data._source) === null || _a === void 0 ? void 0 : _a.userId) || 'Unknown';
                        const grade = ((_b = data._source) === null || _b === void 0 ? void 0 : _b.grade) || 'N/A';
                        const value = ((_c = data._source) === null || _c === void 0 ? void 0 : _c.value) || 'N/A';
                        const createdDT = ((_d = data._source) === null || _d === void 0 ? void 0 : _d.createdDT) ?
                            new Date(data._source.createdDT).toLocaleString() : 'N/A';
                        console.log('User Data:');
                        console.log('- User ID:', userId);
                        console.log('- Grade:', grade);
                        console.log('- Value:', value);
                        console.log('- Created:', createdDT);
                    }
                    console.log('\n-------------------\n');
                }
                catch (error) {
                    console.error(`Error reading file ${filePath}:`, error);
                }
            }
            // Print summary
            console.log('\nSummary:');
            console.log(`Total files processed: ${files.length}`);
            console.log('Metadata file:', files.some(f => f.endsWith('metadata.json')) ? 'Found' : 'Not found');
            console.log('User data files:', files.filter(f => !f.endsWith('metadata.json')).length);
        }
        catch (error) {
            console.error('\n❌ Error:', error.message);
            if (error.Code === 'AccessDenied') {
                console.log('\nAccess Denied Error:');
                console.log('- Verify you have read access to this instance');
                console.log('- Check if the instance ID is correct');
            }
            else if (error.Code === 'NoSuchKey') {
                console.log('\nNo Such Key Error:');
                console.log('- Check if the instance ID is correct');
                console.log('- Verify the path structure is correct');
            }
        }
    });
}
// Run the viewer
viewInstanceData();
