/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Primary Colors - Tangerine/Coral
        primary: {
          50: '#FFF7F0',
          100: '#FFEADB',
          200: '#FFD4B8',
          300: '#FFB88C',
          400: '#FF9559',
          500: '#FF7A33',
          600: '#E66A25',
          700: '#CC581A',
          800: '#B34812',
          900: '#99380C',
          950: '#7A2D0A',
        },
        
        // Secondary Colors - Apricot/Saffron
        secondary: {
          50: '#FFFBF0',
          100: '#FFF4E0',
          200: '#FFE8C3',
          300: '#FFD699',
          400: '#FFC166',
          500: '#FFAB33',
          600: '#E69525',
          700: '#CC7E1A',
          800: '#B36812',
          900: '#99520C',
          950: '#7A400A',
        },
        
        // Accent Colors - Orchid/Lilac
        accent: {
          50: '#F9F7FF',
          100: '#F0EFFF',
          200: '#E3D9FF',
          300: '#D3B8FF',
          400: '#C28CFF',
          500: '#B064FF',
          600: '#9945E6',
          700: '#8033CC',
          800: '#6625B3',
          900: '#4D1A99',
          950: '#331166',
        },
        
        // Neutral Colors - Warm Ivory, Sand, Charcoal
        neutral: {
          ivory: '#FFFBF5',
          cream: '#FFF7ED',
          sand: '#F5E6D3',
          warm: '#E8D5B7',
          charcoal: '#2D2D2D',
          'charcoal-soft': '#4A4A4A',
          'charcoal-light': '#6B6B6B',
        },
        
        // Dark Mode Colors
        dark: {
          plum: '#1A1A2E',
          'plum-light': '#16213E',
          aubergine: '#2D1B4E',
          'aubergine-light': '#3D2B5E',
          surface: '#0F0F23',
          'surface-light': '#1A1B2E',
        },
        
        // Semantic Colors
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
        error: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
        },
        info: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
        },
      },
      
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Manrope', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 2px 10px -2px rgba(0, 0, 0, 0.04)',
        'primary': '0 4px 14px 0 rgba(255, 122, 51, 0.39)',
        'primary-lg': '0 10px 30px -5px rgba(255, 122, 51, 0.4)',
        'accent': '0 4px 14px 0 rgba(176, 100, 255, 0.39)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'inner-primary': 'inset 0 2px 4px 0 rgba(255, 122, 51, 0.1)',
      },
      
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-600) 100%)',
        'gradient-secondary': 'linear-gradient(135deg, var(--secondary-500) 0%, var(--secondary-600) 100%)',
        'gradient-accent': 'linear-gradient(135deg, var(--accent-500) 0%, var(--accent-600) 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, var(--primary-500) 0px, transparent 50%), radial-gradient(at 80% 0%, var(--accent-500) 0px, transparent 50%), radial-gradient(at 0% 50%, var(--secondary-500) 0px, transparent 50%)',
      },
      
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'slide-left': 'slide-left 0.5s ease-out',
        'slide-right': 'slide-right 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'progress': 'progress 2s ease-in-out infinite',
      },
      
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        progress: {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0%' },
        },
      },
      
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
}
