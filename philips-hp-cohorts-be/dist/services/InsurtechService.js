"use strict";
// src/services/InsurtechService.ts
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
exports.InsurtechService = void 0;
const s3Helper_1 = require("../utils/s3Helper");
const InsurtechData_1 = require("../models/InsurtechData");
const GroupService_1 = require("./GroupService");
const mongoose_1 = __importDefault(require("mongoose"));
const BATCH_SIZE = 100;
const CACHE_TTL = 60000;
const statsCache = new Map();
class InsurtechService {
    static syncInstanceData(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('\n=== Starting syncInstanceData ===');
            console.log('Instance ID:', instanceId);
            console.log('Looking in path:', `${this.COHORT_NAME}/${instanceId}/`);
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // Get latest timestamp from DB
                const latestInDb = yield InsurtechData_1.InsurtechData.findOne({ welphiInstanceId: instanceId }, { timestamp: 1 }, { sort: { timestamp: -1 }, session }).lean();
                const lastSyncTimestamp = latestInDb === null || latestInDb === void 0 ? void 0 : latestInDb.timestamp;
                console.log('Last sync timestamp:', lastSyncTimestamp);
                // List S3 files
                console.log('Listing S3 files...');
                const files = yield s3Helper_1.S3Helper.listFiles(`${this.COHORT_NAME}/${instanceId}/`);
                console.log(`Found ${files.length} files in S3:`, files);
                if (files.length === 0) {
                    console.log('No files found in S3');
                    return {
                        newData: [],
                        syncTimestamp: new Date(),
                        hasNewData: false
                    };
                }
                const userDataMap = new Map();
                console.log('Processing files in batches...');
                for (let i = 0; i < files.length; i += BATCH_SIZE) {
                    const batch = files.slice(i, i + BATCH_SIZE);
                    console.log(`Processing batch ${i / BATCH_SIZE + 1}`);
                    const promises = batch.map(file => s3Helper_1.S3Helper.getFile(file));
                    const batchData = yield Promise.all(promises);
                    batchData.forEach((data) => {
                        console.log('Processing file data:', data);
                        const existingData = userDataMap.get(data.userId);
                        if (!existingData || new Date(data.timestamp) > new Date(existingData.timestamp)) {
                            userDataMap.set(data.userId, data);
                        }
                    });
                }
                console.log('Filtering new data...');
                const newData = Array.from(userDataMap.values()).filter(data => !lastSyncTimestamp || new Date(data.timestamp) > lastSyncTimestamp);
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
                        yield InsurtechData_1.InsurtechData.bulkWrite(batchOps, { session });
                    }
                    statsCache.delete(instanceId);
                    console.log('Cache cleared for instance');
                }
                yield session.commitTransaction();
                console.log('Transaction committed');
                // Get transformed stats with latest grouping
                let updatedStats;
                if (newData.length > 0) {
                    console.log('Getting updated stats...');
                    const stats = yield this.getInstanceStats(instanceId);
                    updatedStats = stats || undefined;
                }
                const result = {
                    newData: newData.map(data => (Object.assign(Object.assign({}, data), { timestamp: new Date(data.timestamp), synced_at: new Date() }))),
                    syncTimestamp: new Date(),
                    hasNewData: newData.length > 0,
                    stats: updatedStats
                };
                console.log('Final result:', JSON.stringify(result, null, 2));
                return result;
            }
            catch (error) {
                console.error('Sync error details:', {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
    }
    static getInstanceStats(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const [result] = yield InsurtechData_1.InsurtechData.aggregate(pipeline).exec();
                if (!result.stats.length)
                    return null;
                const gradeDistribution = result.gradeDistribution.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {});
                // Get bubble groups and ungrouped users
                const { groups, ungrouped } = yield GroupService_1.GroupService.manageGroups(instanceId);
                const stats = {
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
            }
            catch (error) {
                console.error('Error getting instance stats:', error);
                throw error;
            }
        });
    }
    static getUserGrades(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pipeline = [
                    {
                        $match: {
                            welphiInstanceId: instanceId
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            userId: 1,
                            grade: 1,
                            timestamp: 1,
                            value: 1
                        }
                    },
                    {
                        $sort: {
                            timestamp: -1
                        }
                    }
                ];
                const userGrades = yield InsurtechData_1.InsurtechData.aggregate(pipeline);
                return userGrades.map(user => ({
                    id: user.userId,
                    grade: user.grade,
                    timestamp: user.timestamp,
                    value: user.value
                }));
            }
            catch (error) {
                console.error('Error getting user grades:', error);
                throw error;
            }
        });
    }
    // private static getClaimRiskStatus(averageGrade: number): string {
    //     if (averageGrade <= 2) return 'Low';
    //     if (averageGrade <= 3) return 'Medium';
    //     return 'High';
    // }
    // private static getCohortStressLevel(averageValue: number): string {
    //     if (averageValue < 60) return 'High';
    //     if (averageValue <= 75) return 'Medium';
    //     return 'Low';
    // }
    // static getGradeDescription(grade: number): string {
    //     switch (grade) {
    //         case 1: return 'Dark Orange';
    //         case 2: return 'Dark Amber';
    //         case 3: return 'Amber';
    //         case 4: return 'Light green';
    //         case 5: return 'Dark green';
    //         default: return 'Unknown';
    //     }
    // }
    static getClaimRiskStatus(averageGrade) {
        // Since higher grades (4-5) indicate better health (Light/Dark green),
        // the risk should be inversely proportional
        if (averageGrade >= 4)
            return 'Low'; // Light/Dark green
        if (averageGrade >= 3)
            return 'Medium'; // Amber
        return 'High'; // Dark Orange/Dark Amber
    }
    static getCohortStressLevel(averageValue) {
        // Since higher HEP values (0-100) indicate better heart health,
        // stress should be inversely proportional
        if (averageValue >= 75)
            return 'Low'; // Good heart health
        if (averageValue >= 60)
            return 'Medium'; // Moderate heart health
        return 'High'; // Poor heart health
    }
    static getGradeDescription(grade) {
        // This method is already correct according to the data definition
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
exports.InsurtechService = InsurtechService;
InsurtechService.COHORT_NAME = 'welphis';
