/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0EFFF',
          100: '#E0DFFE',
          200: '#C2BFFD',
          300: '#A39EFC',
          400: '#857EFB',
          500: '#6C5CE7',
          600: '#5B4ED4',
          700: '#4A3FB3',
          800: '#3A3192',
          900: '#2A2371',
        },
        accent: {
          50: '#E0FFFE',
          100: '#B3FFF9',
          200: '#66FFF3',
          300: '#00E8DA',
          400: '#00D2D3',
          500: '#00B8BA',
          600: '#009A9C',
          700: '#007C7E',
        },
        surface: {
          DEFAULT: '#FAFBFF',
          card: '#FFFFFF',
          dark: '#0F1117',
          'card-dark': '#1A1D2E',
        },
        text: {
          primary: '#1A1D2E',
          secondary: '#6B7294',
          'primary-dark': '#E8EAF6',
          'secondary-dark': '#9BA1C0',
        },
        border: {
          DEFAULT: '#E8EAF6',
          dark: '#2A2D3E',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 10px 40px rgba(108,92,231,0.08), 0 2px 8px rgba(0,0,0,0.06)',
        'search': '0 4px 24px rgba(108,92,231,0.12)',
        'glow': '0 0 20px rgba(108,92,231,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
