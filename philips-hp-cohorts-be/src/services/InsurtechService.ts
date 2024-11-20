// src/services/InsurtechService.ts

import { S3Helper } from '../utils/s3Helper';
import { InsurtechData } from '../models/InsurtechData';
import { GroupService } from './GroupService';
import { 
    S3InsurtechData, 
    DBInsurtechData, 
    TransformedStats, 
    SyncResult 
} from '../types/insurtech';
import mongoose from 'mongoose';

const BATCH_SIZE = 100;
const CACHE_TTL = 60000;

const statsCache = new Map<string, { data: TransformedStats; timestamp: number }>();

export class InsurtechService {
    private static COHORT_NAME = 'welphis';

   static async syncInstanceData(instanceId: string): Promise<SyncResult> {
    console.log('\n=== Starting syncInstanceData ===');
    console.log('Instance ID:', instanceId);
    console.log('Looking in path:', `${this.COHORT_NAME}/${instanceId}/`);
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Get latest timestamp from DB
        const latestInDb = await InsurtechData.findOne(
            { welphiInstanceId: instanceId },
            { timestamp: 1 },
            { sort: { timestamp: -1 }, session }
        ).lean();

        const lastSyncTimestamp = latestInDb?.timestamp;
        console.log('Last sync timestamp:', lastSyncTimestamp);

        // List S3 files
        console.log('Listing S3 files...');
        const files = await S3Helper.listFiles(`${this.COHORT_NAME}/${instanceId}/`);
        console.log(`Found ${files.length} files in S3:`, files);
        
        if (files.length === 0) {
            console.log('No files found in S3');
            return {
                newData: [],
                syncTimestamp: new Date(),
                hasNewData: false
            };
        }

        const userDataMap = new Map<string, S3InsurtechData>();

        console.log('Processing files in batches...');
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
            const batch = files.slice(i, i + BATCH_SIZE);
            console.log(`Processing batch ${i / BATCH_SIZE + 1}`);
            const promises = batch.map(file => S3Helper.getFile(file));
            const batchData = await Promise.all(promises);

            batchData.forEach((data: S3InsurtechData) => {
                console.log('Processing file data:', data);
                const existingData = userDataMap.get(data.userId);
                if (!existingData || new Date(data.timestamp) > new Date(existingData.timestamp)) {
                    userDataMap.set(data.userId, data);
                }
            });
        }

        console.log('Filtering new data...');
        const newData = Array.from(userDataMap.values()).filter(data => 
            !lastSyncTimestamp || new Date(data.timestamp) > lastSyncTimestamp
        );
        console.log(`Found ${newData.length} new records`);

        if (newData.length > 0) {
            console.log('Preparing bulk operations...');
            const bulkOps = newData.map(data => ({
                updateOne: {
                    filter: { userId: data.userId },
                    update: {
                        $set: {
                            welphiInstanceId: data.welphiInstanceId,
                            grade: data.grade,
                            value: data.value,
                            timestamp: new Date(data.timestamp),
                            synced_at: new Date()
                        }
                    },
                    upsert: true
                }
            }));

            console.log('Executing bulk writes...');
            for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
                const batchOps = bulkOps.slice(i, i + BATCH_SIZE);
                await InsurtechData.bulkWrite(batchOps, { session });
            }

            statsCache.delete(instanceId);
            console.log('Cache cleared for instance');
        }

        await session.commitTransaction();
        console.log('Transaction committed');

        // Get transformed stats with latest grouping
        let updatedStats: TransformedStats | undefined;
        if (newData.length > 0) {
            console.log('Getting updated stats...');
            const stats = await this.getInstanceStats(instanceId);
            updatedStats = stats || undefined;
        }

        const result = {
            newData: newData.map(data => ({
                ...data,
                timestamp: new Date(data.timestamp),
                synced_at: new Date()
            })) as DBInsurtechData[],
            syncTimestamp: new Date(),
            hasNewData: newData.length > 0,
            stats: updatedStats
        };

        console.log('Final result:', JSON.stringify(result, null, 2));
        return result;

    } catch (error: any) {
        console.error('Sync error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}

    static async getInstanceStats(instanceId: string): Promise<TransformedStats | null> {
        const cached = statsCache.get(instanceId);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
            return cached.data;
        }

        try {
            const pipeline = [
                { $match: { welphiInstanceId: instanceId } },
                {
                    $facet: {
                        stats: [
                            {
                                $group: {
                                    _id: null,
                                    totalScans: { $sum: 1 },
                                    averageValue: { $avg: '$value' },
                                    averageGrade: { $avg: '$grade' },
                                    latestTimestamp: { $max: '$timestamp' }
                                }
                            }
                        ],
                        gradeDistribution: [
                            {
                                $group: {
                                    _id: '$grade',
                                    count: { $sum: 1 }
                                }
                            }
                        ]
                    }
                }
            ];

            const [result] = await InsurtechData.aggregate(pipeline).exec();
            
            if (!result.stats.length) return null;

            const gradeDistribution = result.gradeDistribution.reduce((acc: Record<number, number>, item: any) => {
                acc[item._id] = item.count;
                return acc;
            }, {});

            // Get bubble groups and ungrouped users
            const { groups, ungrouped } = await GroupService.manageGroups(instanceId);

            const stats: TransformedStats = {
                totalScans: result.stats[0].totalScans,
                averageValue: result.stats[0].averageValue,
                heartEnergyLevel: result.stats[0].averageValue,
                claimRiskStatus: this.getClaimRiskStatus(result.stats[0].averageGrade),
                cohortHealth: result.stats[0].averageGrade,
                cohortStressLevel: this.getCohortStressLevel(result.stats[0].averageValue),
                gradeDistribution,
                lastUpdated: result.stats[0].latestTimestamp,
                bubbleGroups: groups,
                ungroupedUsers: ungrouped
            };

            statsCache.set(instanceId, { 
                data: stats, 
                timestamp: Date.now() 
            });

            return stats;
        } catch (error) {
            console.error('Error getting instance stats:', error);
            throw error;
        }
    }

    private static getClaimRiskStatus(averageGrade: number): string {
        if (averageGrade <= 2) return 'Low';
        if (averageGrade <= 3) return 'Medium';
        return 'High';
    }

    private static getCohortStressLevel(averageValue: number): string {
        if (averageValue < 60) return 'High';
        if (averageValue <= 75) return 'Normal';
        return 'Low';
    }

    static getGradeDescription(grade: number): string {
        switch (grade) {
            case 1: return 'Dark Orange';
            case 2: return 'Dark Amber';
            case 3: return 'Amber';
            case 4: return 'Light green';
            case 5: return 'Dark green';
            default: return 'Unknown';
        }
    }
}