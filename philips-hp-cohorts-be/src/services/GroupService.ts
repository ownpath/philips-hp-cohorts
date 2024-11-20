// src/services/GroupService.ts

import { InsurtechData, IInsurtechData } from '../models/InsurtechData';
import { BubbleGroup, UserBubbleData } from '../types/insurtech';
import mongoose from 'mongoose';

const GROUP_SIZE = 4;
const BUBBLE_SIZES = ['2vh', '2.5vh', '3vh', '3.5vh', '4vh'];

interface GroupUpdateOperation {
    updateOne: {
        filter: { userId: string };
        update: { $set: { groupId: string } };
    };
}

interface AggregatedGroup {
    _id: string;
    users: Array<{
        id: string;
        severity: number;
        value: number;
    }>;
    avgSeverity: number;
}

export class GroupService {
    static async manageGroups(instanceId: string): Promise<{
        groups: BubbleGroup[];
        ungrouped: UserBubbleData[];
    }> {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // First, get all existing grouped users to avoid regrouping
            const existingGroupedUsers = await InsurtechData.distinct('userId', {
                welphiInstanceId: instanceId,
                groupId: { $exists: true }
            }).session(session);

            // Get only truly ungrouped users
            const ungroupedUsers = await InsurtechData.find({
                welphiInstanceId: instanceId,
                userId: { $nin: existingGroupedUsers },
                groupId: { $exists: false }
            })
            .sort({ timestamp: 1 })
            .session(session)
            .lean();

            const updateOperations: GroupUpdateOperation[] = [];
            const newGroups: BubbleGroup[] = [];

            // Calculate how many complete groups we can make
            const completeGroups = Math.floor(ungroupedUsers.length / GROUP_SIZE);

            for (let i = 0; i < completeGroups; i++) {
                const groupUsers = ungroupedUsers.slice(i * GROUP_SIZE, (i + 1) * GROUP_SIZE);
                const timestamp = Date.now() + i; // Ensure unique IDs even if created in same millisecond
                const groupId = `group-${timestamp}`;

                // Prepare updates for each user in the group
                groupUsers.forEach((user) => {
                    updateOperations.push({
                        updateOne: {
                            filter: { userId: user.userId },
                            update: { $set: { groupId } }
                        }
                    });
                });

                // Create the bubble group
                newGroups.push({
                    id: groupId,
                    users: groupUsers.map((user, index: number) => ({
                        id: user.userId,
                        severity: user.grade,
                        value: user.value,
                        index
                    })),
                    severity: Math.floor(groupUsers.reduce((sum, user) => sum + user.grade, 0) / groupUsers.length),
                    size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)]
                });
            }

            // Apply all group updates
            if (updateOperations.length > 0) {
                await InsurtechData.bulkWrite(updateOperations, { session });
            }

            // Get all existing groups
            const existingGroups = await InsurtechData.aggregate<AggregatedGroup>([
                {
                    $match: {
                        welphiInstanceId: instanceId,
                        groupId: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$groupId',
                        users: {
                            $push: {
                                id: '$userId',
                                severity: '$grade',
                                value: '$value'
                            }
                        },
                        avgSeverity: { $avg: '$grade' }
                    }
                }
            ]).session(session);

            // Combine existing and new groups, ensuring no duplicates
            const seenGroupIds = new Set<string>();
            const allGroups: BubbleGroup[] = [
                ...existingGroups.map(group => {
                    seenGroupIds.add(group._id);
                    return {
                        id: group._id,
                        users: group.users.map((user, index) => ({
                            ...user,
                            index
                        })),
                        severity: Math.round(group.avgSeverity),
                        size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)]
                    };
                }),
                ...newGroups.filter(group => !seenGroupIds.has(group.id))
            ];

            // Get remaining ungrouped users
            const remainingUngrouped = await InsurtechData.find({
                welphiInstanceId: instanceId,
                groupId: { $exists: false }
            })
            .sort({ timestamp: 1 })
            .session(session)
            .lean();

            const ungroupedData: UserBubbleData[] = remainingUngrouped.map((user, index) => ({
                id: user.userId,
                severity: user.grade,
                value: user.value,
                index
            }));

            await session.commitTransaction();

            return {
                groups: allGroups,
                ungrouped: ungroupedData
            };
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}