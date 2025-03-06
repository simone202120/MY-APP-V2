/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#f7f3ff',
          100: '#ede5ff',
          200: '#deccff',
          300: '#c4a3ff',
          400: '#a371fc',
          500: '#8a4df9',
          600: '#7c3fed',
          700: '#6c29d4',
          800: '#5925aa',
          900: '#4b238a',
          950: '#2d1165',
        },
        tertiary: {
          50: '#fff7ec',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        background: {
          light: '#f9fafb',
          card: '#ffffff',
          dark: '#111827',
          alt: '#eff6ff',
        },
        surface: {
          light: '#ffffff',
          dark: '#111827',
          muted: '#f9fafb',
          accent: '#f0f9ff',
        },
        dark: {
          background: {
            light: '#121212',
            card: '#1e1e1e',
            alt: '#1a1a1a',
          },
          surface: {
            light: '#1e1e1e',
            dark: '#0f0f0f',
            muted: '#252525',
            accent: '#2a2a2a',
          },
          text: {
            primary: '#f5f5f5',
            secondary: '#a0a0a0',
            muted: '#6b6b6b',
          },
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'sans-serif'],
        display: ['"Lexend"', '"Montserrat"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.05), 0 4px 24px -2px rgba(9, 30, 66, 0.07)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.08), 0 0 0 1px rgba(9, 30, 66, 0.08)',
        'button': '0 2px 4px 0 rgba(0,0,0,0.05)',
        'active': '0 0 0 3px rgba(14, 165, 233, 0.25)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'colored': '0 6px 20px rgba(14, 165, 233, 0.15)',
        'colored-hover': '0 10px 25px rgba(14, 165, 233, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '3rem',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'zoom-in': 'zoomIn 0.3s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-8px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-card': 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(249, 250, 251, 0.5) 100%)',
        'gradient-accent': 'linear-gradient(145deg, #0ea5e9 0%, #8a4df9 100%)',
        'gradient-accent-soft': 'linear-gradient(145deg, rgba(14, 165, 233, 0.2) 0%, rgba(138, 77, 249, 0.2) 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}