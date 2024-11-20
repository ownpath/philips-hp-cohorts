// src/utils/statsUtils.ts

import { UserBubbleData, BubbleGroup, TransformedStats, DBInsurtechData } from '../types/insurtech';

const BUBBLE_SIZES = ['2vh', '2.5vh', '3vh', '3.5vh', '4vh'];
const GROUP_SIZE = 4;

export function getClaimRiskStatus(averageGrade: number): string {
    if (averageGrade <= 2) return 'Low';
    if (averageGrade <= 3) return 'Medium';
    return 'High';
}

export function getCohortStressLevel(averageValue: number): string {
    if (averageValue < 60) return 'High';
    if (averageValue <= 75) return 'Normal';
    return 'Low';
}

export function calculateCohortHealth(gradeDistribution: Record<number, number>): number {
    const totalUsers = Object.values(gradeDistribution).reduce((sum, count) => sum + count, 0);
    const weightedSum = Object.entries(gradeDistribution).reduce((sum, [grade, count]) => {
        return sum + (Number(grade) * count);
    }, 0);
    
    return totalUsers > 0 ? weightedSum / totalUsers : 0;
}

export function transformUserData(data: DBInsurtechData[]): { 
    users: UserBubbleData[], 
    averageGrade: number 
} {
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

export function groupUsers(users: UserBubbleData[]): {
    groups: BubbleGroup[],
    ungrouped: UserBubbleData[]
} {
    // Group users by severity
    const usersBySeverity: Record<number, UserBubbleData[]> = {};
    users.forEach(user => {
        if (!usersBySeverity[user.severity]) {
            usersBySeverity[user.severity] = [];
        }
        usersBySeverity[user.severity].push(user);
    });

    const groups: BubbleGroup[] = [];
    const ungrouped: UserBubbleData[] = [];

    // Create groups of 4 users for each severity level
    Object.entries(usersBySeverity).forEach(([severity, severityUsers]) => {
        const shuffled = [...severityUsers].sort(() => Math.random() - 0.5);
        
        for (let i = 0; i < shuffled.length; i += GROUP_SIZE) {
            if (i + GROUP_SIZE <= shuffled.length) {
                const groupUsers = shuffled.slice(i, i + GROUP_SIZE);
                groups.push({
                    id: `group-${severity}-${i/GROUP_SIZE}`,
                    users: groupUsers,
                    severity: Number(severity),
                    size: BUBBLE_SIZES[Math.floor(Math.random() * BUBBLE_SIZES.length)]
                });
            } else {
                ungrouped.push(...shuffled.slice(i));
            }
        }
    });

    return { groups, ungrouped };
}

export function transformStats(
    data: DBInsurtechData[],
    gradeDistribution: Record<number, number>,
    totalScans: number,
    averageValue: number,
    lastUpdated: Date
): TransformedStats {
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