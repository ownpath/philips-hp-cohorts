// src/types/insurtech.ts

export interface S3InsurtechData {
    welphiInstanceId: string;
    userId: string;
    grade: number;
    value: number;
    timestamp: string;
}

export interface DBInsurtechData extends Omit<S3InsurtechData, 'timestamp'> {
    timestamp: Date;
    synced_at: Date;
    groupId?: string;
}

export interface UserBubbleData {
    id: string;
    severity: number;
    index: number;
    value: number;
}

export interface BubbleGroup {
    id: string;
    users: UserBubbleData[];
    severity: number;
    size: string;
}

export interface BaseStats {
    totalScans: number;
    averageValue: number;
    heartEnergyLevel: number;
    claimRiskStatus: string;
    cohortHealth: number;
    cohortStressLevel: string;
    gradeDistribution: Record<number, number>;
    lastUpdated: Date;
    bubbleGroups: BubbleGroup[];
    ungroupedUsers: UserBubbleData[];
}

export interface TransformedStats extends BaseStats {}

export interface SyncResult {
    newData: DBInsurtechData[];
    syncTimestamp: Date;
    hasNewData: boolean;
    stats?: TransformedStats;
}