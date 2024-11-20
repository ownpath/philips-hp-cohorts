// src/models/InsurtechData.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IInsurtechData extends Document {
    welphiInstanceId: string;
    userId: string;
    grade: number;
    value: number;
    timestamp: Date;
    synced_at: Date;
    groupId?: string;  // New field for tracking groups
}

const insurtechSchema = new Schema<IInsurtechData>({
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

export const InsurtechData = mongoose.model<IInsurtechData>('InsurtechData', insurtechSchema);