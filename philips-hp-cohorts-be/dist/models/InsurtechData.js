"use strict";
// src/models/InsurtechData.ts
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InsurtechData = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const insurtechSchema = new mongoose_1.Schema({
    welphiInstanceId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        unique: true
    },
    grade: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    value: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    timestamp: {
        type: Date,
        required: true,
        index: true
    },
    synced_at: {
        type: Date,
        default: Date.now
    },
    groupId: {
        type: String,
        sparse: true,
        index: true
    }
}, {
    timestamps: true,
    collection: 'insurtech_data'
});
// Compound indexes for efficient querying
insurtechSchema.index({ welphiInstanceId: 1, timestamp: -1 });
insurtechSchema.index({ welphiInstanceId: 1, userId: 1 }, { unique: true });
insurtechSchema.index({ welphiInstanceId: 1, groupId: 1 }); // New index for group queries
exports.InsurtechData = mongoose_1.default.model('InsurtechData', insurtechSchema);
