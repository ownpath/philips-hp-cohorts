"use strict";
// src/scripts/viewRawData.ts
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
const INSTANCE_ID = '6d904bcc-dfbc-4274-adb2-0118fc01da89';
const COHORT_NAME = 'welphis';
function viewRawData() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Viewing Raw Instance Data\n');
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
            console.log('Raw file contents:\n');
            for (const filePath of files) {
                try {
                    console.log(`File: ${filePath}`);
                    console.log('Contents:');
                    const data = yield s3Helper_1.S3Helper.getFile(filePath);
                    console.log(JSON.stringify(data, null, 2));
                    console.log('\n-------------------\n');
                }
                catch (error) {
                    console.error(`Error reading file ${filePath}:`, error);
                }
            }
        }
        catch (error) {
            console.error('\n❌ Error:', error.message);
            if (error.Code === 'AccessDenied') {
                console.log('Please verify read access to this instance');
            }
        }
    });
}
// Run the viewer
viewRawData();
