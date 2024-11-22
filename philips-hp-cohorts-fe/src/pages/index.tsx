import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BubbleGroup, useInsurtechData, UserBubbleData, useUsersGrades } from './api/insurtech';

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
  1: { xRange: [80, 100], color: '#ef4444', backgroundClass: 'bg-danger-red/10' },   // Dark Orange (worst)
  2: { xRange: [60, 80], color: '#fb923c', backgroundClass: 'bg-orange-50' },        // Dark Amber
  3: { xRange: [40, 60], color: '#fcd34d', backgroundClass: 'bg-warning-yellow/10' }, // Amber
  4: { xRange: [20, 40], color: '#bef264', backgroundClass: 'bg-lime-50' },          // Light green
  5: { xRange: [0, 20], color: '#4ade80', backgroundClass: 'bg-success-green/10' }   // Dark green (best)
};

// Updated BUBBLE_SIZES configuration for better mobile landscape support
const BUBBLE_SIZES = {
  'small': {
    base: 'w-6 h-6',             // 24px
    ls: 'ls:w-8 ls:h-8',         // 32px
    ll: 'll:w-10 ll:h-10',       // 40px
    lg: 'lg:w-12 lg:h-12',       // 48px
    xl: 'xl:w-16 xl:h-16'        // 64px
  },
  'medium': {
    base: 'w-8 h-8',             // 32px
    ls: 'ls:w-10 ls:h-10',       // 40px
    ll: 'll:w-12 ll:h-12',       // 48px
    lg: 'lg:w-16 lg:h-16',       // 64px
    xl: 'xl:w-20 xl:h-20'        // 80px
  },
  'large': {
    base: 'w-10 h-10',           // 40px
    ls: 'ls:w-12 ls:h-12',       // 48px
    ll: 'll:w-16 ll:h-16',       // 64px
    lg: 'lg:w-20 lg:h-20',       // 80px
    xl: 'xl:w-24 xl:h-24'        // 96px
  }
};

// Updated TYPOGRAPHY configuration for better mobile landscape support
const TYPOGRAPHY = {
  heading: 'text-xl landscape:text-2xl tv-sm:text-heading tv-md:text-5xl tv-lg:text-6xl tv-xl:text-7xl font-black tracking-tight',
  subtitle: 'text-sm landscape:text-base tv-sm:text-subtitle tv-md:text-xl tv-lg:text-2xl tv-xl:text-3xl',
  label: 'text-xs landscape:text-sm tv-sm:text-label tv-md:text-lg tv-lg:text-xl tv-xl:text-2xl',
  display: 'text-lg landscape:text-xl tv-sm:text-display tv-md:text-4xl tv-lg:text-5xl tv-xl:text-6xl font-bold'
};







// Updated DashboardLayout component with mobile scroll support
const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-screen bg-white overflow-y-auto overflow-x-hidden landscape:overflow-auto">
      <div className="min-h-screen w-full flex items-center justify-center p-1 landscape:p-2 sm:p-2 md:p-4">
        <div 
          className="relative bg-white rounded-xl shadow-lg w-full h-full 
                     max-w-dashboard min-h-[calc(100vh-1rem)] landscape:min-h-[calc(100vh-2rem)]
                     overflow-hidden"
          style={{ 
            aspectRatio: '16/9',
            maxHeight: 'calc(100vh - 2rem)'
          }}
        >
          <div className="w-full h-full flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated LandscapeEnforcer with scroll support
const LandscapeEnforcer: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  return (
    <>
      <div className="lg:hidden h-screen w-screen flex items-center justify-center 
                      bg-black text-white fixed inset-0 z-50 portrait:flex landscape:hidden">
        <div className="text-center p-4">
          <div className="text-2xl ls:text-3xl lm:text-4xl animate-spin">⟳</div>
          <p className="text-sm ls:text-base lm:text-lg ll:text-xl">
            Please rotate your device to landscape mode
          </p>
        </div>
      </div>
      <div className="portrait:hidden landscape:block">
        {children}
      </div>
    </>
  );
};





// Average Score Card Component
const AverageScoreCard: React.FC<{
  heartEnergyLevel: number;
  claimRiskStatus: string;
}> = ({ heartEnergyLevel, claimRiskStatus }) => {
  return (
    <div className="w-[160px] h-[86px] ls:w-[180px] ls:h-[96px] ll:w-[200px] ll:h-[106px] 
                    lg:w-[260px] lg:h-[128px] tv-md:w-[360px] tv-md:h-[192px] 
                    tv-lg:w-[480px] tv-lg:h-[256px]">
      <div className="bg-white rounded-[15px] shadow-lg overflow-hidden h-full">
        <div className="h-full flex flex-col">
          {/* Blue Header */}
          <div className="bg-philips-blue px-1.5 py-1.5 ls:p-2 lg:p-1.5">
            <h3 className="text-sm ls:text-base lg:text-lg tv-md:text-xl tv-lg:text-2xl 
                          text-white font-normal text-center">
              Average score card
            </h3>
          </div>
          
          {/* White Content Section */}
          <div className="px-3 py-2 ls:px-3 ls:py-3 lg:px-4 lg:py-4 flex-1 flex flex-col 
                         justify-center gap-1.5 lg:gap-2">
            {/* Heart Energy Level */}
            <div className="flex items-center justify-between">
              <span className="text-xs ls:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl 
                             text-black font-normal">
                Heart Energy Level
              </span>
              <span className="text-xs ls:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl 
                             text-black font-medium">
                {Math.round(heartEnergyLevel)}%
              </span>
            </div>
            
            {/* Claim Risk Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs ls:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl 
                             text-black font-normal">
                Risk Status
              </span>
              <span className="text-xs ls:text-sm lg:text-base tv-md:text-lg tv-lg:text-xl 
                             text-black font-medium  px-2 py-0.5 rounded-md">
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
  const { data: userGrades } = useUsersGrades();

  const chartData = React.useMemo(() => {
    if (!userGrades) return [];
    return userGrades.map((user, index) => ({
      user: index + 1,
      grade: user.grade
    }));
  
  }, [userGrades]);

  // console.log('chart data', chartData)

  return (
    <div className="bg-white rounded-xl shadow-lg p-3 ls:p-4 lg:p-6
                    w-[300px] h-[140px] 
                    ls:w-[340px] ls:h-[96px] 
                    lm:w-[340px] lm:h-[96px]
                    sm:w-[340px] sm:h-[96px] 
                     md:w-[340px] md:h-[96px]
                   


                    ll:w-[240vw] ll:h-[48vw] 
                    lg:w-[40vw] lg:h-[169px]
                    ">
      <div className="flex flex-row h-full gap-3 ls:gap-4 lg:gap-6">
        {/* Left section with total scans and chart */}
        <div className="w-[30%] flex flex-col justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-xl ls:text-lg ll:text-lg lg:text-2xl 
                           font-bold text-black leading-none">
              {totalScans}
            </span>
            <span className="text-xs ls:text-sm ll:text-base lg:text-lg text-gray-500 font-semibold">
              Total scans
            </span>
          </div>
          
          <div className="h-16 ls:h-12 ll:h-24 lg:h-28 -ml-2 lg:-ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{ top: 5, right: 5, bottom: -15, left: -40 }}
              >
                <Line 
                  type="monotone" 
                  dataKey="grade"
                  stroke="#4ade80"
                  strokeWidth={2}
                  dot={false}
                />
                <XAxis 
                  dataKey="user"
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={[1, 5]}
                  ticks={[1, 3, 5]}
                  tick={{ fontSize: 8, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right section with health metrics */}
        <div className="w-[70%] ls:w-[60%] border border-sm rounded-lg">
          <div className=" rounded-lg p-3 ls:p-4 lg:p-6 h-full">
            <div className="flex flex-col justify-between h-full">
              <div className="flex items-center justify-between">
                <span className="text-xs ls:text-xs ll:text-xs lm:text-xs sm:text-xs md:text-xs lg:text-lg font-medium text-black">
                  Cohort overall health
                </span>
                <div className="flex gap-0 mx-[10%]">
                  
                    <svg 
                   
                      className="w-4 h-4 ls:w-5 ls:h-5 lg:w-6 lg:h-6 items-center justify-center"
                      viewBox="0 0 24 24" 
                      fill="#4ade80"
                    >
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
             
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full">
                <span className="text-xs ls:text-xs ll:text-xs lm:text-xs sm:text-xs md:text-xs lg:text-lg font-medium text-black">
                  Cohort stress level
                </span>
                <span className="bg-warning-yellow px-4 py-2 sm:px-2 sm:py-2 md:px-2 md:py-2  text-black rounded-full 
                               text-xs ls:text-xs sm:text-xs md:text-xs lg:text-sm">
                  {cohortStressLevel}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// Header Section Component
const Header: React.FC<{
  heartEnergyLevel: number;
  claimRiskStatus: string;
}> = ({ heartEnergyLevel, claimRiskStatus }) => {
  return (
    <div className="w-full flex flex-col items-start p-2 ls:p-3 lm:p-4 lg:p-6 xl:p-8">
      {/* Logo */}
      <div className="absolute left-2 ls:left-3 lm:left-4 lg:left-8 
                      top-2 ls:top-3 lm:top-4 lg:top-8">
        <img 
          src="/LOGO.svg" 
          alt="Philips Logo" 
          className="w-[45px] h-[45px] ls:w-[50px] ls:h-[50px] ll:w-[55px] ll:h-[55px]
                     lg:w-[62px] lg:h-[80px] tv-md:w-[123px] tv-md:h-[123px] 
                     tv-lg:w-[164px] tv-lg:h-[164px]"
        />
      </div>

      {/* Title */}
      <div className="w-full flex flex-col items-center ">
        <h1 className="text-xl ls:text-2xl ll:text-3xl lg:text-4xl xl:text-5xl
                      font-black text-black text-center tracking-tight">
          How are we doing today?
        </h1>
        <p className="text-sm ls:text-base ll:text-lg lg:text-xl xl:text-2xl
                     text-center text-gray-600 mt-1 lg:mt-2">
        How stressed is your heart
          <br className="" />
          and how secure are you in staying away from stress?
        </p>
      </div>

      {/* Score Card */}
      <div className="absolute right-2 ls:right-3 lm:right-4 lg:right-8 
                      top-2 ls:top-3 lm:top-4 lg:top-8">
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
      bg: 'bg-danger-red',
      img: '/sad.svg',
      text: 'Doing Bad'
    },
    risk: {
      bg: 'bg-pink-500',
      img: '/happy.svg',
      text: 'Doing Great'
    }
  }[type];

  return (
    <div className={`
      absolute top-1/2 -translate-y-1/2 flex flex-col items-center z-30
      ${isLeft ? 'left-2 ls:left-4 ll:left-6 lg:left-8' : 'right-2 ls:right-4 ll:right-6 lg:right-8'}
    `}>
      <div className={`
        ${config.bg} rounded-full flex items-center justify-center
        w-bubble-base h-bubble-base 
        ls:w-bubble-ls ls:h-bubble-ls
        ll:w-bubble-ll ll:h-bubble-ll
        lg:w-bubble-lg lg:h-bubble-lg
        tv-md:w-20 tv-md:h-20 
        tv-lg:w-28 tv-lg:h-28
      `}>
        <img 
          src={config.img} 
          alt={config.text} 
          className="w-[60%] h-[60%] object-contain p-1 
                     ls:p-1.5 ll:p-2 lg:p-2.5" 
        />
      </div>
      <div className="text-xs ls:text-sm ll:text-base lg:text-lg font-bold text-black mt-1 ls:mt-2">
        {config.text}
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
    <div className="absolute bottom-0 left-0 right-0 px-2 landscape:px-3 sm:px-4 pb-2 landscape:pb-3 sm:pb-4">
      <div className="relative flex justify-end w-full">
        {/* Left side - QR Section */}
        <div className="absolute left-0 bottom-0">
          <QRSection />
        </div>
        
        {/* Right side - Stats Card */}
        <div className="flex flex-col items-end">
          <StatsCard 
            totalScans={totalScans}
            cohortHealth={cohortHealth}
            cohortStressLevel={cohortStressLevel}
          />
          <p className="text-[10px] landscape:text-xs text-gray-500 mt-1">
            {isLoading ? 'updating...' : `last updated - ${formatDate(lastUpdated)}`}
          </p>
        </div>
      </div>
    </div>
  );
};

const QRSection: React.FC = () => {
  return (
    <div className="hidden lg:flex flex-row items-end">
      <div className="flex flex-col justify-end">
        <img 
          src="/qr.svg" 
          alt="QR Code"
          className="w-36 h-32 xl:w-44 xl:h-40 2xl:w-52 2xl:h-48 object-contain"
        />
      </div>
      <div className="ml-4 xl:ml-6 max-w-xs xl:max-w-sm pb-1">
        <div className="text-lg xl:text-xl font-medium text-black leading-tight">
          Want to see your impact?
          <br />
         
        </div>
        <div className="text-sm xl:text-sm text-black mt-2 leading-snug">
          Scan on our app and watch your data update live!
        
          
        </div>
        <div className="text-xs xl:text-xs font-light text-black mt-2 leading-tight">
          *This shows the average data of people scanning with   Philips HeartPrint app.
        
        
        </div>
      </div>
    </div>
  );
};



interface BubbleProps {
  id: string;
  x: number;
  y: number;
  size: string;
  color?: string;
  isGrey?: boolean;
}

// Bubble animation configuration
const bubbleAnimationVariants = {
  initial: { 
    scale: 0, 
    opacity: 0,
    rotate: -180
  },
  animate: { 
    scale: 1, 
    opacity: 1,
    rotate: 0,
    y: [0, -10, 0, 10, 0],
    x: [0, 8, 0, -8, 0],
    transition: {
      scale: {
        type: "spring",
        stiffness: 200,
        damping: 15,
        duration: 0.8
      },
      opacity: {
        duration: 0.8
      },
      rotate: {
        duration: 0.8
      },
      y: {
        repeat: Infinity,
        duration: 5,
        ease: "easeInOut"
      },
      x: {
        repeat: Infinity,
        duration: 6,
        ease: "easeInOut"
      }
    }
  },
  exit: { 
    scale: 0, 
    opacity: 0,
    rotate: 180,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  hover: {
    scale: 1.15,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 15
    }
  }
};

// Bubble Component
const Bubble: React.FC<BubbleProps> = ({ 
  id, 
  x, 
  y, 
  size, 
  color, 
  isGrey = false 
}) => {
  // Use ID to generate consistent random variations
  const seed = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const randomDuration = 15 + (seed % 10);
  
   // Generate random size variation (-1, 0, or +1)
   const sizeVariation = ((seed % 3) - 1);

   // Base sizes with random variation - Further increased base sizes
   const getBaseSize = (baseSize: number) => {
     return baseSize + sizeVariation;
   };
 
   const getBubbleSize = (apiSize: string) => {
     const baseSizes = {
       'small': getBaseSize(7),    // 24-32px base
       'medium': getBaseSize(8),   // 28-36px base
       'large': getBaseSize(9)     // 32-40px base
     }[apiSize] || getBaseSize(7);
 
     return `w-${baseSizes} h-${baseSizes} 
             ls:w-${baseSizes + 1} ls:h-${baseSizes + 1} 
             ll:w-${baseSizes + 2} ll:h-${baseSizes + 2} 
             lg:w-${baseSizes + 3} lg:h-${baseSizes + 3}`;
   };
 
   // Increased movement range
   const customMotion = {
     y: [0, -6, 0, 6, 0],   // Increased from ±4 to ±6
     x: [0, 5, 0, -5, 0]    // Increased from ±3 to ±5
   };

  // Different opacity for grey vs colored bubbles
  const bubbleOpacity = isGrey ? 0.4 : 0.9;
  const gradientOpacity = isGrey ? 
    "radial-gradient(circle at 30% 30%, rgba(180,180,180,0.5), rgba(160,160,180,0.2))" :
    `radial-gradient(circle at 30% 30%, ${color}ee, ${color}aa)`;

  return (
    <motion.div
      key={id}
      className={`absolute ${getBubbleSize(size)}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        position: 'absolute',
        filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.1))',
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: bubbleOpacity,
        y: customMotion.y,
        x: customMotion.x,
      }}
      transition={{
        opacity: { duration: 0.5 },
        x: {
          duration: randomDuration,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        },
        y: {
          duration: randomDuration * 1.2,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut"
        }
      }}
    >
      <div 
        className="w-full h-full rounded-full relative overflow-hidden"
        style={{
          background: gradientOpacity,
          boxShadow: isGrey ? 
            'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.1)' :
            'inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.2)'
        }}
      >
        {/* Main highlight - reduced for grey bubbles */}
        <div 
          className="absolute w-[60%] h-[60%] rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${isGrey ? '0.25' : '0.35'}) 0%, transparent 60%)`,
            top: "10%",
            left: "10%"
          }}
        />
        
        {/* Secondary highlight - reduced for grey bubbles */}
        <div 
          className="absolute w-[30%] h-[30%] rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,${isGrey ? '0.15' : '0.25'}) 0%, transparent 100%)`,
            top: "15%",
            left: "15%"
          }}
        />
      </div>
    </motion.div>
  );
};

// Visualization Area Component
const VisualizationArea: React.FC<{
  bubbleGroups: BubbleGroup[];
  ungroupedUsers: UserBubbleData[];
  bubblePositions: Record<string, BubblePosition>;
  totalDesiredBubbles: number;
}> = ({ bubbleGroups, ungroupedUsers, bubblePositions, totalDesiredBubbles }) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-full h-full flex items-center">
        {/* Risk indicators */}
        <div className="absolute left-4 ls:left-8 ll:left-12 lg:left-16 top-1/2 -translate-y-1/2 z-30 
                    flex flex-col items-center">
          <div className="w-20 h-20 ls:w-14 ls:h-14 ll:w-18 ll:h-18 lg:w-20 lg:h-20 
                       fill-success-green rounded-full mt-6 flex items-center justify-center">
            <img 
              src="/happy.svg" 
              alt="Doing Great" 
              className="w-20 h-20 ls:w-12 ls:h-12 ll:w-14 ll:h-14 lg:w-20 lg:h-20 
                         object-contain fill-white" 
            />
          </div>
          <span className="mt-2 text-xs ls:text-sm ll:text-base lg:text-lg font-bold text-black">
            Doing Great
          </span>
        </div>

        <div className="absolute right-4 ls:right-8 ll:right-12 lg:right-16 top-1/2 -translate-y-1/2 z-30 
                    flex flex-col items-center">
          <div className="w-20 h-20 ls:w-14 ls:h-14 ll:w-18 ll:h-18 lg:w-20 lg:h-20 
                       fill-danger-red rounded-full mt-6 flex items-center justify-center">
            <img 
              src="/sad.svg" 
              alt="Claim Risk" 
              className="w-20 h-20 ls:w-12 ls:h-12 ll:w-14 ll:h-14 lg:w-20 lg:h-20 
                         object-contain fill-white" 
            />
          </div>
          <span className="mt-2 text-xs ls:text-sm ll:text-base lg:text-lg font-bold text-black">
            Doing Bad
          </span>
        </div>

        {/* Gradient line */}
        <div className="absolute left-16 right-16 ls:left-24 ls:right-24 ll:left-32 ll:right-32 
                     lg:left-40 lg:right-40 top-1/2 -translate-y-1/2 z-20">
          <div className="h-0.5 ls:h-1 w-full bg-gradient-to-r from-[#25D07D] via-[#fcd34d] to-[#E43404]" />
        </div>

        {/* Bubbles container with increased space */}
        <div className="absolute inset-x-16 ls:inset-x-24 ll:inset-x-32 lg:inset-x-40 
                     top-[15%] bottom-[15%]">
          <AnimatePresence mode="popLayout">
            {/* Background bubbles */}
            <div className="relative w-full h-full">
              {Array.from({ length: 110 }, (_, i) => {
                const position = bubblePositions[`background-${i}`];
                return position && (
                  <Bubble
                    key={`background-${i}`}
                    id={`background-${i}`}
                    x={position.x}
                    y={position.y}
                    size="small"
                    isGrey={true}
                  />
                );
              })}
              
              {/* Active bubbles */}
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
                    size={'size' in item ? item.size : 'small'}
                    color={container.color}
                  />
                );
              })}
            </div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// Custom hook for window dimensions
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
      claimRiskStatus: '',
      cohortHealth: 0,
      cohortStressLevel: ''
    }, 
    isLoading, 
    dataUpdatedAt 
  } = useInsurtechData();

  console.log('data', insurtechData)
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
      
      const totalDesiredBubbles = 110;
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
      <div className="h-[15%] min-h-[80px] landscape:min-h-[100px]">
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
          totalDesiredBubbles={11}
        />
      </div>
      
      <div className="h-[15%] min-h-[80px] landscape:min-h-[100px]">
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
      <LandscapeEnforcer>
        <DashboardLayout>
          <InsurtechDashboardContent />
        </DashboardLayout>
      </LandscapeEnforcer>
    </QueryClientProvider>
  );
};


export default InsurtechDashboard
