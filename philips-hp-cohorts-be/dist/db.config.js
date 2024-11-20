"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config('../../.env');
if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not defined');
}
exports.default = {
    port: process.env.PORT || 8080,
    mongodbURI: process.env.MONGODB_URI,
    // Add other environment variables as needed
};
