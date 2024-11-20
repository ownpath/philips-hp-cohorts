// src/utils/instanceHelper.ts

interface UserData {
    _source: {
        welphiInstanceId: string;
        userId: string;
        grade: number;
        value: number;
        createdDT: number;
    };
}

interface MetadataData {
    endDate: number;
    cohortId: string;
    startDate: number;
    title: string;
    Template: string;
}

export class InstanceHelper {
    private static readonly COHORT_NAME = 'welphis';

    static getInstancePath(instanceId: string) {
        return `${this.COHORT_NAME}/${instanceId}/`;
    }

    static async getInstanceData(s3Helper: typeof import('./s3Helper').S3Helper, instanceId: string) {
        const path = this.getInstancePath(instanceId);
        const files = await s3Helper.listFiles(path);
        
        const result = {
            metadata: null as MetadataData | null,
            users: [] as UserData[]
        };

        for (const file of files) {
            const data = await s3Helper.getFile(file);
            if (file.endsWith('metadata.json')) {
                result.metadata = data;
            } else {
                result.users.push(data);
            }
        }

        return result;
    }

    static calculateStats(users: UserData[]) {
        if (users.length === 0) return null;

        const values = users.map(u => u._source.value);
        const grades = users.map(u => u._source.grade);

        return {
            userCount: users.length,
            valueStats: {
                min: Math.min(...values),
                max: Math.max(...values),
                average: values.reduce((a, b) => a + b, 0) / values.length
            },
            gradeDistribution: grades.reduce((acc, grade) => {
                acc[grade] = (acc[grade] || 0) + 1;
                return acc;
            }, {} as Record<number, number>)
        };
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