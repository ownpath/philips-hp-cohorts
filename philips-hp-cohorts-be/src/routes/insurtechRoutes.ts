// src/routes/insurtechRoutes.ts

import { Router, Request, Response, RequestHandler } from 'express';
import { InsurtechService } from '../services/InsurtechService';
import { InsurtechData } from '../models/InsurtechData';

const router = Router();
const INSTANCE_ID = process.env.INSTANCE_ID!;

// Define type-safe handlers
const pollHandler: RequestHandler = async (req, res) => {
    try {
        console.log('=== Starting Poll Handler ===');
        console.log(`Instance ID: ${INSTANCE_ID}`);
        
        if (!INSTANCE_ID) {
            console.error('INSTANCE_ID is not set in environment variables');
            throw new Error('INSTANCE_ID is required');
        }

        console.log('Calling InsurtechService.syncInstanceData...');
        const syncResult = await InsurtechService.syncInstanceData(INSTANCE_ID);
        console.log('syncResult:', JSON.stringify(syncResult, null, 2));

        // Always get current stats regardless of new data
        console.log('Getting current stats...');
        const currentStats = await InsurtechService.getInstanceStats(INSTANCE_ID);
        
        if (!currentStats) {
            console.error('No stats available for instance');
            throw new Error('No stats available for instance');
        }

       // console.log('Current stats:', JSON.stringify(currentStats, null, 2));

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

        //console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error: any) {
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
};

const statsHandler: RequestHandler = async (req, res) => {
    try {
        console.log('=== Starting Stats Handler ===');
        console.log(`Instance ID: ${INSTANCE_ID}`);

        const stats = await InsurtechService.getInstanceStats(INSTANCE_ID);
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
        //console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error: any) {
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
};

const userGradesHandler: RequestHandler = async (req, res) => {
    try {
        const stats = await InsurtechService.getUserGrades(INSTANCE_ID);
        res.json({
            success: true,
            data: stats
        });
        console.log("hitting usccessfully")
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: 'Failed to get user grades',
            message: error.message
        });
    }
};

// Route definitions
router.get('/poll', pollHandler);
router.get('/stats', statsHandler);
router.get('/users/grades', userGradesHandler);


export const InsurtechRouter = router;