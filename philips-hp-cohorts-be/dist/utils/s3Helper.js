"use strict";
// src/utils/s3Helper.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Helper = void 0;
const s3_config_1 = require("../config/s3.config");
const client_s3_1 = require("@aws-sdk/client-s3");
class S3Helper {
    static listFiles(prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const s3Client = yield (0, s3_config_1.getS3Client)();
                const command = new client_s3_1.ListObjectsV2Command({
                    Bucket: s3_config_1.BUCKET_NAME,
                    Prefix: prefix
                });
                const response = yield s3Client.send(command);
                return ((_a = response.Contents) === null || _a === void 0 ? void 0 : _a.map(file => file.Key || '')) || [];
            }
            catch (error) {
                console.error('Error listing files:', error);
                throw error;
            }
        });
    }
    static uploadFile(key, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const s3Client = yield (0, s3_config_1.getS3Client)();
                const command = new client_s3_1.PutObjectCommand({
                    Bucket: s3_config_1.BUCKET_NAME,
                    Key: key,
                    Body: JSON.stringify(data, null, 2),
                    ContentType: 'application/json'
                });
                yield s3Client.send(command);
                return key;
            }
            catch (error) {
                console.error('Error uploading file:', error);
                throw error;
            }
        });
    }
    static getFile(key) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const s3Client = yield (0, s3_config_1.getS3Client)();
                const command = new client_s3_1.GetObjectCommand({
                    Bucket: s3_config_1.BUCKET_NAME,
                    Key: key
                });
                const response = yield s3Client.send(command);
                const bodyContents = yield ((_a = response.Body) === null || _a === void 0 ? void 0 : _a.transformToString());
                if (!bodyContents) {
                    throw new Error('Empty response body');
                }
                return JSON.parse(bodyContents);
            }
            catch (error) {
                console.error('Error getting file:', error);
                throw error;
            }
        });
    }
    static deleteFile(key) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const s3Client = yield (0, s3_config_1.getS3Client)();
                const command = new client_s3_1.DeleteObjectCommand({
                    Bucket: s3_config_1.BUCKET_NAME,
                    Key: key
                });
                yield s3Client.send(command);
            }
            catch (error) {
                console.error('Error deleting file:', error);
                throw error;
            }
        });
    }
}
exports.S3Helper = S3Helper;
