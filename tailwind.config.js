/** @type {import('tailwindcss').Config} */
module.exports = {
  // 暗色模式：通过 class 切换
  darkMode: 'class',

  // 扫描这些文件中的 Tailwind 类名
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // 颜色配置
      colors: {
        // 品牌主色（蓝色）- 用于按钮、链接等主要元素
        brand: {
          50: '#F0F5FF',   // 极浅蓝
          100: '#E0EBFF',  // 浅蓝
          200: '#C2D7FF',
          300: '#94BBFF',
          400: '#5C9AFF',
          500: '#0551FF',  // 主色调
          600: '#0041CC',  // 深蓝
          700: '#003199',
          800: '#002266',
          900: '#001A66',  // 最深
        },

        // 强调色（紫色）- 用于特殊提示、高亮等
        accent: {
          50: '#FAF5FF',
          100: '#F3E8FF',
          200: '#E9D5FF',
          300: '#D8B4FE',
          400: '#C084FC',
          500: '#8B5CF6',  // 主色调
          600: '#7C3AED',
          700: '#6D28D9',
        },
        // 背景色（高级灰系统）
        surface: {
          DEFAULT: '#F7F7F8',      // 主背景（高级浅灰）
          card: '#F7F7F8',         // 卡片背景（与主背景一致）
          secondary: '#EFEFEF',    // 次级背景（中浅灰）
          hover: '#F5F5F5',        // 悬停背景
          dark: '#0E0E0E',         // 暗色主背景（深灰黑）
          'card-dark': '#1C1C1E',  // 暗色卡片背景
        },

        // 文字颜色（柔和黑系统）
        text: {
          primary: '#1A1A1A',           // 主要文字（柔和深灰黑）
          secondary: '#6B6B6B',         // 次要文字（中灰）
          tertiary: '#999999',          // 辅助文字（浅灰）
          'primary-dark': '#ECECEC',    // 暗色主要文字（柔和白）
          'secondary-dark': '#A0A0A0',  // 暗色次要文字
        },

        // 边框颜色
        border: {
          DEFAULT: '#E8E8E8',  // 默认边框（柔和灰）
          dark: '#2C2C2E',     // 暗色边框
        },
      },
      // 字体配置（优先使用系统字体，支持鸿蒙）
      fontFamily: {
        sans: [
          '-apple-system',           // macOS/iOS 系统字体
          'BlinkMacSystemFont',      // macOS Chrome
          '"HarmonyOS Sans"',        // 鸿蒙系统（新增）
          '"PingFang SC"',           // 苹方简体中文
          '"Microsoft YaHei UI"',    // 微软雅黑 UI（Windows 10+）
          '"Segoe UI"',              // Windows
          'Roboto',                  // Android
          '"Helvetica Neue"',
          'Arial',
          '"Hiragino Sans GB"',      // 冬青黑体简体中文
          '"Microsoft YaHei"',       // 微软雅黑
          'sans-serif',
        ],
      },

      // 字体大小系统（更精细的控制）
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['0.9375rem', { lineHeight: '1.5rem' }],
        'lg': ['1.0625rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },

      // 字重系统
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // 字间距系统（提升高级感）
      letterSpacing: {
        tighter: '-0.02em',
        tight: '-0.01em',
        normal: '0',
        wide: '0.01em',
        wider: '0.02em',
      },

      // 行高系统
      lineHeight: {
        tight: '1.25',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
        loose: '2',
      },

      // 圆角系统（现代感）
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',
        'DEFAULT': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        'full': '9999px',
      },

      // 间距系统（呼吸感）
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '15': '3.75rem',
        '18': '4.5rem',
      },

      // 阴影效果
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',           // 卡片阴影
        'card-hover': '0 10px 40px rgba(5,81,255,0.08), 0 2px 8px rgba(0,0,0,0.06)', // 卡片悬停阴影
        'search': '0 4px 24px rgba(5,81,255,0.12)',                                   // 搜索框阴影
        'glow': '0 0 20px rgba(5,81,255,0.15)',                                       // 发光效果
      },

      // 动画效果
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',      // 淡入
        'slide-up': 'slideUp 0.4s ease-out',    // 上滑
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',  // 慢速脉冲
      },

      // 关键帧定义
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
