"use strict";
// src/scripts/uploadMockData.ts
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
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Constants for mock data
const INSTANCE_ID = "36e63927-7d61-4204-af43-5a933016ea14";
const COHORT_NAME = "welphis";
function generateUserData() {
    const userId = (0, uuid_1.v4)();
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
function generateMetadata() {
    const startDate = Date.now();
    return {
        endDate: startDate + (30 * 24 * 60 * 60 * 1000), // 30 days from now
        cohortId: (0, uuid_1.v4)(),
        startDate: startDate,
        title: "Heart Print HeRve",
        Template: "BubbleChart"
    };
}
function uploadMockData() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Starting mock data upload...\n');
            // Upload metadata
            console.log('Uploading metadata...');
            const metadata = generateMetadata();
            yield s3Helper_1.S3Helper.uploadFile(`${COHORT_NAME}/${INSTANCE_ID}/metadata.json`, metadata);
            console.log('✅ Metadata uploaded successfully');
            // Upload user data files
            const numberOfUsers = 10;
            console.log(`\nUploading ${numberOfUsers} user files...`);
            for (let i = 0; i < numberOfUsers; i++) {
                const userData = generateUserData();
                const key = `${COHORT_NAME}/${INSTANCE_ID}/${userData._source.userId}.json`;
                yield s3Helper_1.S3Helper.uploadFile(key, userData);
                console.log(`✅ Uploaded user file ${i + 1}/${numberOfUsers}`);
            }
            console.log('\n🎉 Mock data upload completed successfully!');
        }
        catch (error) {
            console.error('Error uploading mock data:', error);
            process.exit(1);
        }
    });
}
// Run the upload
uploadMockData();
