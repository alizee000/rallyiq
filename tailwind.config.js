/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a', // Main background
          800: '#18181b', // Darker background
          900: '#0f0f11', // Almost black
          950: '#0a0a0b',
        },
        lime: {
          50: '#f4fbf0',
          100: '#e6f7dc',
          200: '#cceebb',
          300: '#aae18f',
          400: '#84cf5e',
          500: '#64b63a',
          600: '#4d942a',
          700: '#3c7123',
          800: '#325a21',
          900: '#2a4a1d',
          950: '#14280d',
          DEFAULT: '#a3e635', // Electric Lime
        },
        cyan: {
          DEFAULT: '#06b6d4', // Court Cyan
        },
        amber: {
          DEFAULT: '#f59e0b', // Warning Amber
        },
        coral: {
          DEFAULT: '#ef4444', // Error Coral Red
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', 'system-ui', 'Helvetica Neue', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Display"', 'system-ui', 'Helvetica Neue', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
