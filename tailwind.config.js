/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#bae0fd',
          300: '#7cc8fa',
          400: '#36acf6',
          500: '#0d90e5',
          600: '#0270c3',
          700: '#02599e',
          800: '#074c82',
          900: '#0c416d',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede8ff',
          200: '#dcd3fe',
          300: '#cabdfc',
          400: '#ac94f4',
          500: '#9776ed',
          600: '#7e4fd8',
          700: '#6938b7',
          800: '#563296',
          900: '#492c7d',
        },
        tertiary: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#e74694',
          600: '#d61f69',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        background: {
          light: '#f8fafc',
          card: '#ffffff',
          dark: '#f1f5f9',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Montserrat"', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(9, 30, 66, 0.08)',
        'button': '0 2px 4px 0 rgba(0,0,0,0.05)',
        'active': '0 0 0 3px rgba(13, 144, 229, 0.25)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'breathe': 'breathe 4s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
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
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}