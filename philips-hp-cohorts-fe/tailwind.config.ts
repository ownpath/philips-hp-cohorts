import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      // Mobile landscape breakpoints
      'ls': '667px',    // iPhone SE landscape
      'lm': '740px',    // iPhone Pro landscape
      'll': '844px',    // iPhone Pro Max landscape
      
      // Traditional breakpoints
      'sm': '640px',    
      'md': '768px',    
      'lg': '1024px',   // Small laptops
      'xl': '1280px',   // Larger laptops
      
      // TV breakpoints
      'tv-sm': '1280px', // 720p
      'tv-md': '1920px', // 1080p
      'tv-lg': '2560px', // 1440p
      'tv-xl': '3840px', // 4K
      
      // Orientation queries
      'landscape': { 'raw': '(orientation: landscape)' },
      'portrait': { 'raw': '(orientation: portrait)' },
    },
    extend: {
      colors: {
        'philips-blue': '#123772',
        'success-green': '#4ade80',
        'warning-yellow': '#fcd34d',
        'danger-red': '#E43404',
        'neutral-gray': '#6b7280',
      },
      spacing: {
        // Logo sizes
        'logo-base': '45px',
        'logo-ls': '50px',
        'logo-ll': '55px',
        'logo-lg': '62px',
        
        // Card dimensions for AverageScoreCard
        'card-w-base': '180px',
        'card-w-ls': '200px',
        'card-w-ll': '220px',
        'card-w-lg': '240px',
        
        'card-h-base': '96px',
        'card-h-ls': '106px',
        'card-h-ll': '116px',
        'card-h-lg': '128px',
        
        // Stats Card dimensions
        'stats-w-base': '180px',    // Mobile (default) - Even smaller
        'stats-w-ls': '170px',      // Landscape SE
        'stats-w-ll': '160px',      // Landscape Pro Max
        'stats-w-lg': '150px',      // Desktop
        
        'stats-h-base': '80px',     // Mobile (default) - Much smaller height
        'stats-h-ls': '75px',       // Landscape SE
        'stats-h-ll': '70px',       // Landscape Pro Max
        'stats-h-lg': '65px',       // Desktop     // Desktop
        
        // Bubble dimensions
        'bubble-base': '16px',
        'bubble-ls': '20px',
        'bubble-ll': '24px',
        'bubble-lg': '32px',
        
        // QR Code dimensions
        'qr-w-base': '80px',
        'qr-w-ls': '100px',
        'qr-w-ll': '120px',
        'qr-w-lg': '134.6px',
        
        'qr-h-base': '64px',
        'qr-h-ls': '80px',
        'qr-h-ll': '96px',
        'qr-h-lg': '108.14px',
      },
      fontSize: {
        // Base typography
        'xs': ['0.75rem', '1rem'],     // 12px
        'sm': ['0.875rem', '1.25rem'], // 14px
        'base': ['1rem', '1.5rem'],    // 16px
        'lg': ['1.125rem', '1.75rem'], // 18px
        'xl': ['1.25rem', '1.75rem'],  // 20px
        '2xl': ['1.5rem', '2rem'],     // 24px
        
        // Heading sizes
        'heading-base': ['24px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-ls': ['28px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-ll': ['32px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-lg': ['52px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        
        // Subtitle sizes
        'subtitle-base': ['14px', { lineHeight: '1.5' }],
        'subtitle-ls': ['16px', { lineHeight: '1.5' }],
        'subtitle-ll': ['18px', { lineHeight: '1.5' }],
        'subtitle-lg': ['20px', { lineHeight: '1.5' }],
        
        // Card title sizes
        'card-title-base': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'card-title-ls': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'card-title-ll': ['16px', { lineHeight: '1.4', fontWeight: '500' }],
        'card-title-lg': ['17px', { lineHeight: '1.4', fontWeight: '500' }],
        
        // Stats sizes
        'stats-base': ['16px', { lineHeight: '1.2', fontWeight: '700' }],
        'stats-ls': ['18px', { lineHeight: '1.2', fontWeight: '700' }],
        'stats-ll': ['20px', { lineHeight: '1.2', fontWeight: '700' }],
        'stats-lg': ['32px', { lineHeight: '1.2', fontWeight: '700' }],
      },
      maxWidth: {
        // Dashboard max widths
        'dashboard-base': '667px',
        'dashboard-ls': '740px',
        'dashboard-ll': '844px',
        'dashboard-lg': '1280px',
      },
      maxHeight: {
        // Dashboard max heights
        'dashboard-base': '375px',
        'dashboard-ls': '390px',
        'dashboard-ll': '430px',
        'dashboard-lg': '720px',
      },
      borderRadius: {
        // Card radius
        'card-base': '8px',
        'card-ls': '12px',
        'card-ll': '14px',
        'card-lg': '16px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      padding: {
        // Card padding
        'card-base': '8px',
        'card-ls': '12px',
        'card-ll': '14px',
        'card-lg': '16px',
      },
    },
  },
  plugins: [],
} satisfies Config;