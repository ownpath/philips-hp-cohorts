// Part 1: Base Setup and Type Definitions
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Type definitions
interface BubblePosition {
  id: string;
  x: number;
  y: number;
}

interface BottomSectionProps {
    totalScans: number;
    cohortHealth: number;
    cohortStressLevel: string;
    lastUpdated: string;
  }



interface UnGroupedUser {
  id: string;
}

interface SeverityContainer {
  xRange: [number, number];
  color: string;
  backgroundClass: string;
}

type SeverityContainers = {
  [key in 1 | 2 | 3 | 4 | 5]: SeverityContainer;
}

interface InsuranceData {
  bubbleGroups: BubbleGroup[];
  ungroupedUsers: UnGroupedUser[];
  totalScans: number;
  heartEnergyLevel: number;
  claimRiskStatus: string;
  cohortHealth: number;
  cohortStressLevel: string;
}

// QueryClient configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 3,
      staleTime: 30000,
      refetchInterval: 30000,
    },
  },
});

// Severity container configuration
const severityContainers: SeverityContainers = {
  1: { xRange: [0, 20], color: '#4ade80', backgroundClass: 'bg-success-green/10' },
  2: { xRange: [20, 40], color: '#bef264', backgroundClass: 'bg-lime-50' },
  3: { xRange: [40, 60], color: '#fcd34d', backgroundClass: 'bg-warning-yellow/10' },
  4: { xRange: [60, 80], color: '#fb923c', backgroundClass: 'bg-orange-50' },
  5: { xRange: [80, 100], color: '#ef4444', backgroundClass: 'bg-danger-red/10' }
};


// Bubble size configuration with responsive scaling
const BUBBLE_SIZES = {
  sm: {
    base: 'w-8 h-8',
    'tv-sm': 'tv-sm:w-8 tv-sm:h-8',
    'tv-md': 'tv-md:w-10 tv-md:h-10',
    'tv-lg': 'tv-lg:w-12 tv-lg:h-12',
    'tv-xl': 'tv-xl:w-16 tv-xl:h-16'
  },
  md: {
    base: 'w-10 h-10',
    'tv-sm': 'tv-sm:w-10 tv-sm:h-10',
    'tv-md': 'tv-md:w-12 tv-md:h-12',
    'tv-lg': 'tv-lg:w-14 tv-lg:h-14',
    'tv-xl': 'tv-xl:w-20 tv-xl:h-20'
  },
  lg: {
    base: 'w-12 h-12',
    'tv-sm': 'tv-sm:w-12 tv-sm:h-12',
    'tv-md': 'tv-md:w-16 tv-md:h-16',
    'tv-lg': 'tv-lg:w-20 tv-lg:h-20',
    'tv-xl': 'tv-xl:w-24 tv-xl:h-24'
  }
};

// Responsive typography classes
const TYPOGRAPHY = {
  heading: 'text-4xl tv-sm:text-heading tv-md:text-5xl tv-lg:text-6xl tv-xl:text-7xl font-black tracking-tight',
  subtitle: 'text-lg tv-sm:text-subtitle tv-md:text-xl tv-lg:text-2xl tv-xl:text-3xl',
  label: 'text-base tv-sm:text-label tv-md:text-lg tv-lg:text-xl tv-xl:text-2xl',
  display: 'text-2xl tv-sm:text-display tv-md:text-4xl tv-lg:text-5xl tv-xl:text-6xl font-bold'
};

// Animation configurations
const bubbleAnimationVariants = {
  initial: { 
    scale: 0, 
    opacity: 0 
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    transition: {
      duration: 0.3
    }
  },
  hover: {
    scale: 1.1,
    transition: {
      duration: 0.2
    }
  }
};

// Landscape enforcer component with responsive handling
const LandscapeEnforcer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <>
      <div className="lg:hidden h-screen w-screen flex items-center justify-center bg-black text-white fixed inset-0 z-50 portrait:flex landscape:hidden">
        <div className="text-center p-4">
          <div className="text-4xl mb-4 animate-spin">⟳</div>
          <p className={TYPOGRAPHY.subtitle}>Please rotate your device to landscape mode</p>
        </div>
      </div>
      
      <div className="portrait:hidden landscape:block">
        {children}
      </div>
    </>
  );
};



// Main container layout component
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-white overflow-hidden">
        <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
          <div 
            className="relative bg-white rounded-xl shadow-lg w-full h-full 
                       max-w-dashboard max-h-dashboard overflow-hidden"
            style={{ aspectRatio: '16/9' }}
          >
            <div className="w-full h-full flex flex-col lg:block overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    );
  };



// Average Score Card Component
const AverageScoreCard: React.FC<{
    heartEnergyLevel: number;
    claimRiskStatus: string;
  }> = ({ heartEnergyLevel, claimRiskStatus }) => {
    return (
      <div className="w-[180px] h-[96px] sm:w-[200px] sm:h-[106px] lg:w-[240px] lg:h-[128px] tv-md:w-[360px] tv-md:h-[192px] tv-lg:w-[480px] tv-lg:h-[256px]">
        <div className="bg-philips-blue rounded-xl shadow-lg overflow-hidden h-full">
          <div className="p-2 sm:p-3 lg:p-4 tv-md:p-6 h-full flex flex-col justify-between">
            <h3 className="text-sm sm:text-base lg:text-lg tv-md:text-xl tv-lg:text-2xl text-white font-medium mb-2">
              Average score card
            </h3>
            
            <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl text-white">
                  Heart Energy Level
                </span>
                <span className="text-xs sm:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl text-white font-medium">
                  {Math.round(heartEnergyLevel)}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl text-white">
                  Claim Risk Status
                </span>
                <span className="text-xs sm:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl text-white font-medium bg-white/10 px-2 py-1 rounded">
                  {claimRiskStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  // Stats Card Component
  const StatsCard: React.FC<{
    totalScans: number;
    cohortHealth: number;
    cohortStressLevel: string;
  }> = ({ totalScans, cohortHealth, cohortStressLevel }) => {
    const [width, setWidth] = useState(640);
  
    // Use useEffect to access window after mount
    useEffect(() => {
      setWidth(window.innerWidth);
      const handleResize = () => setWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
  
    const statsData = React.useMemo(() => {
      const startPoint = Math.max(30, Math.floor(totalScans * 0.35));
      const midPoint = Math.floor(totalScans * 0.6);
      const endPoint = Math.floor(totalScans * 0.85);
  
      return [
        { x: startPoint, health: cohortHealth - 1.5 },
        { x: midPoint, health: cohortHealth - 0.5 },
        { x: endPoint, health: cohortHealth }
      ];
    }, [totalScans, cohortHealth]);
  
    return (
      <div className="bg-white rounded-xl shadow-lg p-3 sm:p-4 tv-md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-stretch gap-3 sm:gap-4 lg:gap-6">
          {/* Left section with total scans and graph */}
          <div className="flex-1 min-w-[160px] sm:min-w-[200px]">
            <div className="flex items-center gap-2 mb-3 sm:mb-4 lg:mb-6">
              <span className="text-xl sm:text-2xl md:text-3xl tv-sm:text-display 
                             tv-md:text-4xl tv-lg:text-5xl tv-xl:text-6xl font-bold text-black">
                {totalScans}
              </span>
              <span className="text-sm sm:text-base tv-sm:text-label text-gray-600 mt-1">
                Total scans
              </span>
            </div>
            
            <div className="h-16 sm:h-20 tv-md:h-24">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={statsData} 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <Line 
                    type="monotone" 
                    dataKey="health"
                    stroke="#4ade80"
                    strokeWidth={2}
                    dot={{
                      r: 3,
                      fill: "#fff",
                      stroke: "#4ade80",
                      strokeWidth: 2
                    }}
                  />
                  <XAxis 
                    dataKey="x"
                    axisLine={false}
                    tickLine={false}
                    tick={{ 
                      fontSize: width < 640 ? 10 : 12,
                      fill: '#6b7280' 
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
  
          {/* Right section with cohort stats */}
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 lg:min-w-[240px]">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between h-8">
                <span className="text-sm sm:text-base tv-sm:text-label text-black font-medium">
                  Cohort overall health
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((_, i) => (
                    <svg 
                      key={i}
                      className="w-4 h-4 sm:w-5 sm:h-5 tv-md:w-6 tv-md:h-6"
                      viewBox="0 0 24 24" 
                      fill="#4ade80"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between h-8">
                <span className="text-sm sm:text-base tv-sm:text-label text-black font-medium">
                  Cohort stress level
                </span>
                <span className="bg-warning-yellow px-2 sm:px-3 py-1 rounded-full 
                               text-sm sm:text-base tv-sm:text-label">
                  {cohortStressLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Bubble Component
  const Bubble: React.FC<{
    id: string;
    x: number;
    y: number;
    size: string;
    color?: string;
    isGrey?: boolean;
  }> = ({ id, x, y, size, color, isGrey = false }) => {
    const getBubbleSize = (apiSize: string) => {
      const sizeMap: Record<string, keyof typeof BUBBLE_SIZES> = {
        'small': 'sm',
        'medium': 'md',
        'large': 'lg',
        '3vh': 'sm',
        '4vh': 'md',
        '5vh': 'lg'
      };
      return BUBBLE_SIZES[sizeMap[apiSize] || 'sm'];
    };
  
    const bubbleSize = getBubbleSize(size);
    const sizeClasses = Object.values(bubbleSize).join(' ');
  
    return (
      <motion.div
        key={id}
        className={`absolute ${sizeClasses}`}
        initial="initial"
        animate="animate"
        exit="exit"
        whileHover="hover"
        variants={bubbleAnimationVariants}
        style={{
          left: `${x}%`,
          top: `${y}%`,
        }}
      >
        <div 
          className="w-full h-full rounded-full relative overflow-hidden"
          style={{
            background: isGrey
              ? "radial-gradient(circle at 30% 30%, rgba(180,180,180,0.8), rgba(160,160,160,0.4))"
              : `radial-gradient(circle at 30% 30%, ${color}ee, ${color}aa)`
          }}
        >
          <div 
            className="absolute w-[60%] h-[60%] rounded-full"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)",
              top: "10%",
              left: "10%"
            }}
          />
        </div>
      </motion.div>
    );
  };
  
  // QR Code Section
  const QRSection: React.FC = () => {
    return (
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <img 
            src="/qr.svg" 
            alt="QR Code"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 
                       tv-md:w-44 tv-md:h-44 tv-lg:w-56 tv-lg:h-56"
          />
          <div>
            <div className="text-base sm:text-lg md:text-xl tv-sm:text-subtitle 
                           tv-md:text-2xl font-medium text-black">
              Want to see your impact?
            </div>
            <div className="text-sm sm:text-base tv-sm:text-label tv-md:text-xl text-black">
              Scan on our app and watch your data update live!
            </div>
          </div>
        </div>
        <div className="text-xs sm:text-sm tv-sm:text-base tv-md:text-lg 
                        font-light text-black mt-2 sm:mt-4">
          *This shows the average data of people scanning with Philips HeartPrint app.
        </div>
      </div>
    );
  };

  // Part 3: Main Dashboard Layout and Visualization Components

// Header Section Component
const Header: React.FC<{
    heartEnergyLevel: number;
    claimRiskStatus: string;
  }> = ({ heartEnergyLevel, claimRiskStatus }) => {
    console.log("claim risk status", claimRiskStatus)
    return (
      <div className="w-full flex flex-col lg:flex-row items-start p-4 sm:p-6 lg:p-8">
        {/* Logo aligned at top left */}
        <div className="absolute left-8 top-8">
          <img 
            src="/LOGO.svg" 
            alt="Philips Logo" 
            className="w-[60px] h-[60px] sm:w-logo sm:h-logo 
                       tv-md:w-[123px] tv-md:h-[123px] 
                       tv-lg:w-[164px] tv-lg:h-[164px]"
          />
        </div>
  
        {/* Center title - Absolute positioning */}
        <div className="w-full flex flex-col items-center">
          <h1 className="text-2xl sm:text-4xl md:text-5xl tv-sm:text-heading 
                         tv-md:text-6xl tv-lg:text-7xl font-black text-black text-center">
            How are we doing today?
          </h1>
          <p className="text-base sm:text-lg tv-sm:text-subtitle tv-md:text-2xl 
                        text-center text-gray-600 mt-2">
            How close are we to claim risk,
            <br className="hidden lg:block" />
            and how secure are you in staying away from it?
          </p>
        </div>
  
        {/* Score Card Container with exact sizing */}
        <div className="absolute right-8 top-8">
          <AverageScoreCard 
            heartEnergyLevel={heartEnergyLevel}
            claimRiskStatus={claimRiskStatus}
          />
        </div>
      </div>
    );
  };
  
  // Risk Indicator Component
  const RiskIndicator: React.FC<{
    position: 'left' | 'right';
    type: 'good' | 'risk';
  }> = ({ position, type }) => {
    const isLeft = position === 'left';
    const config = {
      good: {
        bg: 'bg-success-green',
        img: '/happy.png',
        text: 'Doing Great'
      },
      risk: {
        bg: 'bg-danger-red',
        img: '/sad.png',
        text: 'Claim Risk'
      }
    }[type];
  
    return (
      <div className={`
        absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-30
        ${isLeft ? 'left-2 sm:left-4 lg:left-8' : 'right-2 sm:right-4 lg:right-8'}
      `}>
        <div className={`
          ${config.bg} rounded-full flex items-center justify-center
          w-12 h-12 
          sm:w-16 sm:h-16 
          tv-md:w-24 tv-md:h-24 
          tv-lg:w-32 tv-lg:h-32
        `}>
          <img 
            src={config.img} 
            alt={config.text} 
            className="w-8 h-8 
                       sm:w-10 sm:h-10 
                       tv-md:w-16 tv-md:h-16 
                       tv-lg:w-20 tv-lg:h-20
                       object-contain p-2" 
          />
        </div>
        <div className="text-sm sm:text-base tv-sm:text-label tv-md:text-xl 
                        font-bold text-black mt-2">
          {config.text}
        </div>
      </div>
    );
  };
  
  // Visualization Area Component
  const VisualizationArea: React.FC<{
    bubbleGroups: BubbleGroup[];
    ungroupedUsers: UserBubbleData[];
    bubblePositions: Record<string, BubblePosition>;
    totalDesiredBubbles: number;
  }> = ({ bubbleGroups, ungroupedUsers, bubblePositions, totalDesiredBubbles }) => {
    const activeCount = bubbleGroups.length + ungroupedUsers.length;
    const backgroundCount = Math.max(0, totalDesiredBubbles - activeCount);
  
    const backgroundBubbles = Array.from({ length: backgroundCount }, (_, i) => ({
      id: `background-${i}`,
      isBackground: true
    }));
  
    return (
      <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full flex items-center">
        {/* Risk indicators */}
        <div className="absolute left-16 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center">
            <img src="/happy.svg" alt="Doing Great" className="w-20 h-20 object-contain fill-[#25D07D]" />
          </div>
          <span className="mt-2 font-bold text-black">Doing Great</span>
        </div>

        <div className="absolute right-16 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center">
            <img src="/sad.svg" alt="Claim Risk" className="w-20 h-20 object-contain overflow-hidden fill-[#E43404]" />
          </div>
          <span className="mt-2 font-bold text-black">Claim Risk</span>
        </div>

        {/* Gradient line */}
        <div className="absolute left-32 right-32 top-1/2 -translate-y-1/2 z-20">
          <div className="h-1 w-full bg-gradient-to-r from-[#25D07D] via-[#fcd34d] to-[#E43404]" />
        </div>
          <div className="absolute inset-x-32 top-[10%] bottom-[10%]">
            <AnimatePresence mode="popLayout">
              {backgroundBubbles.map((bubble) => {
                const position = bubblePositions[bubble.id];
                return position && (
                  <Bubble
                    key={bubble.id}
                    id={bubble.id}
                    x={position.x}
                    y={position.y}
                    size="sm"
                    isGrey={true}
                  />
                );
              })}
            </AnimatePresence>
  
            <AnimatePresence mode="popLayout">
              {[...bubbleGroups, ...ungroupedUsers].map((item) => {
                const position = bubblePositions[item.id];
                const severity = ('severity' in item ? item.severity : 3) as 1 | 2 | 3 | 4 | 5;
                const container = severityContainers[severity];
                return position && (
                  <Bubble
                    key={item.id}
                    id={item.id}
                    x={position.x}
                    y={position.y}
                    size={'size' in item ? item.size : 'sm'}
                    color={container.color}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
  };


  
  



  // Bottom Section Component
  const BottomSection: React.FC<{
    totalScans: number;
    cohortHealth: number;
    cohortStressLevel: string;
    lastUpdated: string;
    isLoading: boolean;
  }> = ({ totalScans, cohortHealth, cohortStressLevel, lastUpdated, isLoading }) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };
  
    return (
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-6">
        <div className="flex justify-between items-end">
          <QRSection />
          <div className="flex flex-col items-end">
            <StatsCard 
              totalScans={totalScans}
              cohortHealth={cohortHealth}
              cohortStressLevel={cohortStressLevel}
            />
            <p className="text-sm text-gray-500 mt-2">
              {isLoading ? 'updating...' : `last updated - ${formatDate(lastUpdated)}`}
            </p>
          </div>
        </div>
      </div>
    );
  };
  
  // Part 4: Main Dashboard Component and Final Integration
import { useInsurtechData, type InsurtechStats, type BubbleGroup, type UserBubbleData } from '../pages/api/insurtech';

// Update the interface to match your API types
interface BubblePosition {
  id: string;
  x: number;
  y: number;
}

// Main Dashboard Content Component

  const InsurtechDashboardContent: React.FC = () => {
    const [bubblePositions, setBubblePositions] = useState<Record<string, BubblePosition>>({});
    const positionsRef = useRef<Record<string, BubblePosition>>({});
    const initializedRef = useRef(false);
  
    const { 
      data: insurtechData = {
        bubbleGroups: [],
        ungroupedUsers: [],
        totalScans: 0,
        heartEnergyLevel: 0,
        claimRiskStatus: 'Low',
        cohortHealth: 0,
        cohortStressLevel: 'Normal'
      }, 
      isLoading, 
      dataUpdatedAt 
    } = useInsurtechData();
  
  // Generate random position within section
  const generateRandomPosition = (xMin: number, xMax: number) => {
    const x = xMin + Math.random() * (xMax - xMin);
    const ySpread = 35;
    const yOffset = (Math.random() - 0.5) * ySpread;
    return {
      x,
      y: 50 + yOffset
    };
  };

  // Initialize positions only once
  useEffect(() => {
    if (!initializedRef.current && insurtechData) {
      const newPositions: Record<string, BubblePosition> = {};
      
      const totalDesiredBubbles = 250;
      const activeCount = insurtechData.bubbleGroups.length + insurtechData.ungroupedUsers.length;
      const backgroundCount = Math.max(0, totalDesiredBubbles - activeCount);
      
      for (let i = 0; i < backgroundCount; i++) {
        const rand = Math.random();
        let severity: 1 | 2 | 3 | 4 | 5;
        if (rand < 0.3) severity = 1;
        else if (rand < 0.55) severity = 2;
        else if (rand < 0.75) severity = 3;
        else if (rand < 0.9) severity = 4;
        else severity = 5;

        const container = severityContainers[severity];
        const position = generateRandomPosition(container.xRange[0], container.xRange[1]);
        const id = `background-${i}`;
        newPositions[id] = { id, ...position };
      }

      // Position active bubbles
      [...insurtechData.bubbleGroups, ...insurtechData.ungroupedUsers].forEach(item => {
        const severity = ('severity' in item ? item.severity : 3) as 1 | 2 | 3 | 4 | 5;
        const container = severityContainers[severity];
        const position = generateRandomPosition(container.xRange[0], container.xRange[1]);
        newPositions[item.id] = { id: item.id, ...position };
      });

      positionsRef.current = newPositions;
      setBubblePositions(newPositions);
      initializedRef.current = true;
    }
  }, [insurtechData]);

  // Handle updates while maintaining existing positions
  useEffect(() => {
    if (insurtechData && initializedRef.current) {
      const currentPositions = { ...positionsRef.current };
      
      [...insurtechData.bubbleGroups, ...insurtechData.ungroupedUsers].forEach(item => {
        if (!currentPositions[item.id]) {
          const severity = ('severity' in item ? item.severity : 3) as 1 | 2 | 3 | 4 | 5;
          const container = severityContainers[severity];
          const position = generateRandomPosition(container.xRange[0], container.xRange[1]);
          currentPositions[item.id] = { id: item.id, ...position };
        }
      });

      positionsRef.current = currentPositions;
      setBubblePositions(currentPositions);
    }
  }, [insurtechData]);
  
    return (
      <div className="relative w-full h-full flex flex-col">
        <div className="h-[15%] min-h-[100px]">
          <Header 
            heartEnergyLevel={insurtechData.heartEnergyLevel}
            claimRiskStatus={insurtechData.claimRiskStatus}
          />
        </div>
        
        <div className="flex-1 h-[70%]">
          <VisualizationArea 
            bubbleGroups={insurtechData.bubbleGroups}
            ungroupedUsers={insurtechData.ungroupedUsers}
            bubblePositions={bubblePositions}
            totalDesiredBubbles={250}
          />
        </div>
        
        <div className="h-[15%] min-h-[100px]">
          <BottomSection 
            totalScans={insurtechData.totalScans}
            cohortHealth={insurtechData.cohortHealth}
            cohortStressLevel={insurtechData.cohortStressLevel}
            lastUpdated={new Date(dataUpdatedAt).toISOString()}
            isLoading={isLoading}
          />
        </div>
      </div>
    );
  };

// Custom hook for window dimensions (unchanged)
const useWindowDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return dimensions;
};

// Root component with providers
const InsurtechDashboard: React.FC = () => {
  const dimensions = useWindowDimensions();

  // Calculate actual dimensions based on screen size
  const getScaledDimensions = () => {
    const aspectRatio = 16 / 9;
    let width = dimensions.width;
    let height = width / aspectRatio;

    if (height > dimensions.height) {
      height = dimensions.height;
      width = height * aspectRatio;
    }

    return { width, height };
  };

  const { width, height } = getScaledDimensions();

  return (
    <QueryClientProvider client={queryClient}>
      <DashboardLayout>
        <InsurtechDashboardContent />
      </DashboardLayout>
    </QueryClientProvider>
  );
};

export default InsurtechDashboard;