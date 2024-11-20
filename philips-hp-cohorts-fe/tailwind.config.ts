import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '375px',     // iPhone SE
      'sm': '640px',     // Small tablets
      'md': '768px',     // Tablets
      'lg': '1024px',    // Small laptops
      'xl': '1280px',    // Laptops
      'tv-sm': '1280px', // 720p
      'tv-md': '1920px', // 1080p
      'tv-lg': '2560px', // 1440p
      'tv-xl': '3840px', // 4K
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'philips-blue': '#123772',
        'success-green': '#4ade80',
        'warning-yellow': '#fcd34d',
        'danger-red': '#ef4444',
        'neutral-gray': '#6b7280',
      },
      fontFamily: {
        'neue-frutiger': ['Neue Frutiger World', 'Arial', 'Helvetica', 'sans-serif'],
      },
      spacing: {
        // Component specific spacing
        'logo': '82px',
        'score-card-w': '240px',
        'score-card-h': '128px',
        'stats-card-w': '551px',
        'stats-card-h': '169px',
        'bubble-container-w': '197px',
        'bubble-container-h': '250.73px',
      },
      fontSize: {
        // Mobile-first typography scale
        'xs': ['12px', '1.2'],
        'sm': ['14px', '1.3'],
        'base': ['16px', '1.4'],
        'lg': ['18px', '1.4'],
        'xl': ['20px', '1.4'],
        '2xl': ['24px', '1.3'],
        '3xl': ['30px', '1.2'],
        '4xl': ['36px', '1.1'],
        // Responsive typography scale
        'heading': ['52px', '1.1'],
        'subtitle': ['20px', '1.5'],
        'label': ['17px', '1.4'],
        'display': ['32px', '1.2'],
      },
      borderRadius: {
        'card': '15px',
      },
      maxWidth: {
        'dashboard': '1920px',
      },
      maxHeight: {
        'dashboard': '1080px',
      },
      aspectRatio: {
        'tv': '16/9',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;