"use strict";
// src/routes/insurtechRoutes.ts
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
exports.InsurtechRouter = void 0;
const express_1 = require("express");
const InsurtechService_1 = require("../services/InsurtechService");
const router = (0, express_1.Router)();
const INSTANCE_ID = process.env.INSTANCE_ID;
// Define type-safe handlers
const pollHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== Starting Poll Handler ===');
        console.log(`Instance ID: ${INSTANCE_ID}`);
        if (!INSTANCE_ID) {
            console.error('INSTANCE_ID is not set in environment variables');
            throw new Error('INSTANCE_ID is required');
        }
        console.log('Calling InsurtechService.syncInstanceData...');
        const syncResult = yield InsurtechService_1.InsurtechService.syncInstanceData(INSTANCE_ID);
        console.log('syncResult:', JSON.stringify(syncResult, null, 2));
        // Always get current stats regardless of new data
        console.log('Getting current stats...');
        const currentStats = yield InsurtechService_1.InsurtechService.getInstanceStats(INSTANCE_ID);
        if (!currentStats) {
            console.error('No stats available for instance');
            throw new Error('No stats available for instance');
        }
        console.log('Current stats:', JSON.stringify(currentStats, null, 2));
        // Always return current data
        const response = {
            success: true,
            data: {
                newRecords: syncResult.hasNewData ? syncResult.newData : [],
                stats: currentStats,
                lastSync: syncResult.syncTimestamp,
                hasNewData: syncResult.hasNewData
            }
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    }
    catch (error) {
        console.error('Polling error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            error: 'Failed to poll data',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
const statsHandler = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('=== Starting Stats Handler ===');
        console.log(`Instance ID: ${INSTANCE_ID}`);
        const stats = yield InsurtechService_1.InsurtechService.getInstanceStats(INSTANCE_ID);
        console.log('Stats result:', JSON.stringify(stats, null, 2));
        if (!stats) {
            console.log('No stats found');
            res.status(404).json({
                success: false,
                message: 'No data found for this instance'
            });
            return;
        }
        const response = {
            success: true,
            data: stats
        };
        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    }
    catch (error) {
        console.error('Stats error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get stats',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
// Route definitions
router.get('/poll', pollHandler);
router.get('/stats', statsHandler);
exports.InsurtechRouter = router;
