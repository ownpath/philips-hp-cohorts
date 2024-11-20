"use strict";
// src/services/GroupService.ts
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
exports.GroupService = void 0;
const InsurtechData_1 = require("../models/InsurtechData");
const mongoose_1 = __importDefault(require("mongoose"));
const GROUP_SIZE = 4;
const BUBBLE_SIZES = ['2vh', '2.5vh', '3vh', '3.5vh', '4vh'];
class GroupService {
    static manageGroups(instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield mongoose_1.default.startSession();
            session.startTransaction();
            try {
                // First, get all existing grouped users to avoid regrouping
                const existingGroupedUsers = yield InsurtechData_1.InsurtechData.distinct('userId', {
                    welphiInstanceId: instanceId,
                    groupId: { $exists: true }
                }).session(session);
                // Get only truly ungrouped users
                const ungroupedUsers = yield InsurtechData_1.InsurtechData.find({
                    welphiInstanceId: instanceId,
                    userId: { $nin: existingGroupedUsers },
                    groupId: { $exists: false }
                })
                    .sort({ timestamp: 1 })
                    .session(session)
                    .lean();
                const updateOperations = [];
                const newGroups = [];
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
                        users: groupUsers.map((user, index) => ({
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
                    yield InsurtechData_1.InsurtechData.bulkWrite(updateOperations, { session });
                }
                // Get all existing groups
                const existingGroups = yield InsurtechData_1.InsurtechData.aggregate([
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
                const seenGroupIds = new Set();
                const allGroups = [
                    ...existingGroups.map(group => {
                        seenGroupIds.add(group._id);
                        return {
                            id: group._id,
                            users: group.users.map((user, index) => (Object.assign(Object.assign({}, user), { index }))),
                            severity: Math.round(group.avgSeverity),
                            size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)]
                        };
                    }),
                    ...newGroups.filter(group => !seenGroupIds.has(group.id))
                ];
                // Get remaining ungrouped users
                const remainingUngrouped = yield InsurtechData_1.InsurtechData.find({
                    welphiInstanceId: instanceId,
                    groupId: { $exists: false }
                })
                    .sort({ timestamp: 1 })
                    .session(session)
                    .lean();
                const ungroupedData = remainingUngrouped.map((user, index) => ({
                    id: user.userId,
                    severity: user.grade,
                    value: user.value,
                    index
                }));
                yield session.commitTransaction();
                return {
                    groups: allGroups,
                    ungrouped: ungroupedData
                };
            }
            catch (error) {
                yield session.abortTransaction();
                throw error;
            }
            finally {
                session.endSession();
            }
        });
    }
}
exports.GroupService = GroupService;
