"use strict";
// src/utils/statsUtils.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClaimRiskStatus = getClaimRiskStatus;
exports.getCohortStressLevel = getCohortStressLevel;
exports.calculateCohortHealth = calculateCohortHealth;
exports.transformUserData = transformUserData;
exports.groupUsers = groupUsers;
exports.transformStats = transformStats;
const BUBBLE_SIZES = ['2vh', '2.5vh', '3vh', '3.5vh', '4vh'];
const GROUP_SIZE = 4;
function getClaimRiskStatus(averageGrade) {
    if (averageGrade <= 2)
        return 'Low';
    if (averageGrade <= 3)
        return 'Medium';
    return 'High';
}
function getCohortStressLevel(averageValue) {
    if (averageValue < 60)
        return 'High';
    if (averageValue <= 75)
        return 'Normal';
    return 'Low';
}
function calculateCohortHealth(gradeDistribution) {
    const totalUsers = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
    const weightedSum = Object.entries(gradeDistribution).reduce((sum, [grade, count]) => {
        return sum + (Number(grade) * count);
    }, 0);
    return totalUsers > 0 ? weightedSum / totalUsers : 0;
}
function transformUserData(data) {
    // Sort by value to assign indices
    const sortedData = [...data].sort((a, b) => a.value - b.value);
    const users = sortedData.map((item, index) => ({
        id: item.userId,
        severity: item.grade,
        value: item.value,
        index: index + 1
    }));
    const averageGrade = data.reduce((sum, item) => sum + item.grade, 0) / data.length;
    return { users, averageGrade };
}
function groupUsers(users) {
    // Group users by severity
    const usersBySeverity = {};
    users.forEach(user => {
        if (!usersBySeverity[user.severity]) {
            usersBySeverity[user.severity] = [];
        }
        usersBySeverity[user.severity].push(user);
    });
    const groups = [];
    const ungrouped = [];
    // Create groups of 4 users for each severity level
    Object.entries(usersBySeverity).forEach(([severity, severityUsers]) => {
        const shuffled = [...severityUsers].sort(() => Math.random() - 0.5);
        for (let i = 0; i < shuffled.length; i += GROUP_SIZE) {
            if (i + GROUP_SIZE <= shuffled.length) {
                const groupUsers = shuffled.slice(i, i + GROUP_SIZE);
                groups.push({
                    id: `group-${severity}-${i / GROUP_SIZE}`,
                    users: groupUsers,
                    severity: Number(severity),
                    size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)]
                });
            }
            else {
                ungrouped.push(...shuffled.slice(i));
            }
        }
    });
    return { groups, ungrouped };
}
function transformStats(data, gradeDistribution, totalScans, averageValue, lastUpdated) {
    const { users, averageGrade } = transformUserData(data);
    const { groups, ungrouped } = groupUsers(users);
    const cohortHealth = calculateCohortHealth(gradeDistribution);
    return {
        totalScans,
        averageValue,
        heartEnergyLevel: averageValue,
        claimRiskStatus: getClaimRiskStatus(averageGrade),
        cohortHealth,
        cohortStressLevel: getCohortStressLevel(averageValue),
        gradeDistribution,
        lastUpdated,
        bubbleGroups: groups,
        ungroupedUsers: ungrouped
    };
}
