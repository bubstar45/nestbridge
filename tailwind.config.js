/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          100: '#dbe4ff',
          500: '#3b5bdb',
          600: '#3451c7',
          700: '#2f44b0',
          900: '#1e2d7a',
        },
        stay: {
          500: '#e8590c',
          600: '#d44e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}