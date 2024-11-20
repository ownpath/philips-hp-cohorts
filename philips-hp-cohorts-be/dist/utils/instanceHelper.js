"use strict";
// src/utils/instanceHelper.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstanceHelper = void 0;
class InstanceHelper {
    static getInstancePath(instanceId) {
        return `${this.COHORT_NAME}/${instanceId}/`;
    }
    static getInstanceData(s3Helper, instanceId) {
        return __awaiter(this, void 0, void 0, function* () {
            const path = this.getInstancePath(instanceId);
            const files = yield s3Helper.listFiles(path);
            const result = {
                metadata: null,
                users: []
            };
            for (const file of files) {
                const data = yield s3Helper.getFile(file);
                if (file.endsWith('metadata.json')) {
                    result.metadata = data;
                }
                else {
                    result.users.push(data);
                }
            }
            return result;
        });
    }
    static calculateStats(users) {
        if (users.length === 0)
            return null;
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
            }, {})
        };
    }
    static getGradeDescription(grade) {
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
exports.InstanceHelper = InstanceHelper;
InstanceHelper.COHORT_NAME = 'welphis';
