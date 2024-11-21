// src/api/insurtech.ts
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

// API Types
export interface UserBubbleData {
  id: string;
  severity: number;
  value: number;
  index: number;
}

export interface BubbleGroup {
  id: string;
  users: UserBubbleData[];
  severity: number;
  size: string;
}

export interface InsurtechStats {
  totalScans: number;
  averageValue: number;
  heartEnergyLevel: number;
  claimRiskStatus: string;
  cohortHealth: number;
  cohortStressLevel: string;
  gradeDistribution: Record<number, number>;
  lastUpdated: string;
  bubbleGroups: BubbleGroup[];
  ungroupedUsers: UserBubbleData[];
}

interface PollResponse {
  success: boolean;
  data?: {
    stats: InsurtechStats;
    lastSync: string;
  };
  message?: string;
}

export interface UserGrade {
  id: string;
  grade: number;
  timestamp: string;
  value: number;
}

const POLLING_INTERVAL = 5000; // 3 minutes in milliseconds

// Create a more visible logging utility
const createVisibleLog = (type: 'info' | 'warn' | 'error') => (message: string, data?: any) => {
  const timestamp = new Date().toLocaleTimeString();
  const emoji = type === 'info' ? 'ℹ️' : type === 'warn' ? '⚠️' : '❌';
  console[type](
    `\n${emoji} [${timestamp}] ${message}`,
    data ? '\n' + JSON.stringify(data, null, 2) : ''
  );
};

const log = {
  info: createVisibleLog('info'),
  warn: createVisibleLog('warn'),
  error: createVisibleLog('error')
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

export const fetchInsurtechData = async (): Promise<InsurtechStats> => {
  const startTime = Date.now();
  log.info(`Starting data fetch`, {
    time: new Date().toLocaleTimeString(),
    nextFetchIn: `${POLLING_INTERVAL / 1000} seconds`
  });

  try {
    const { data: response, status } = await api.get<PollResponse>('/insurtech/poll');
    
    const duration = Date.now() - startTime;
    log.info(`Fetch completed in ${duration}ms`, {
      status,
      hasNewData: response?.data?.stats ? 'yes' : 'no',
      nextFetchAt: new Date(Date.now() + POLLING_INTERVAL).toLocaleTimeString()
    });

    if (!response.success || !response.data?.stats) {
      throw new Error(response.message || 'Invalid response structure');
    }

    return response.data.stats;
  } catch (error) {
    log.error(`Fetch failed`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      nextRetryIn: '3 minutes'
    });
    throw error;
  }
};

export const useInsurtechData = () => {
  // Log initial mount
  useEffect(() => {
    log.info('InsurtechData hook mounted', {
      pollingInterval: `${POLLING_INTERVAL / 1000} seconds`,
      firstFetchAt: new Date().toLocaleTimeString()
    });

    // Log polling interval details
    const nextFewPolls = Array.from({ length: 3 }, (_, i) => {
      const time = new Date(Date.now() + (POLLING_INTERVAL * (i + 1)));
      return time.toLocaleTimeString();
    });

    log.info('Upcoming poll schedule', {
      currentTime: new Date().toLocaleTimeString(),
      nextPolls: nextFewPolls
    });

    return () => {
      log.info('InsurtechData hook unmounted');
    };
  }, []);

  const queryResult = useQuery({
    queryKey: ['insurtech-data'],
    queryFn: fetchInsurtechData,
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL,
    gcTime: POLLING_INTERVAL * 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    select: (data) => {
      if (!data) return undefined;
      
      return {
        ...data,
        lastUpdated: new Date(data.lastUpdated),
        bubbleGroups: data.bubbleGroups?.map(group => ({
          ...group,
          size: group.size || '3vh'
        })) || [],
        ungroupedUsers: data.ungroupedUsers || []
      };
    },
  });

  // Monitor and log state changes
  useEffect(() => {
    if (queryResult.isFetching) {
      log.info('Fetch in progress', {
        time: new Date().toLocaleTimeString(),
        dataUpdateCount: queryResult.dataUpdatedAt ? 
          new Date(queryResult.dataUpdatedAt).toLocaleTimeString() : 'never'
      });
    }
  }, [queryResult.isFetching, queryResult.dataUpdatedAt]);

  return queryResult;
};

export const fetchUsersGrades = async (): Promise<UserGrade[]> => {
  const { data: response } = await api.get<{ success: boolean; data: UserGrade[] }>('/insurtech/users/grades');
  if (!response.success) throw new Error('Failed to fetch user grades');
  return response.data;
};

export const useUsersGrades = () => {
  return useQuery({
    queryKey: ['users-grades'],
    queryFn: fetchUsersGrades,
    refetchInterval: POLLING_INTERVAL,
    staleTime: POLLING_INTERVAL,
  });
};

// Export configuration
export const INSURTECH_CONFIG = {
  POLLING_INTERVAL,
  POLLING_INTERVAL_MINUTES: POLLING_INTERVAL / 1000 / 60
};
