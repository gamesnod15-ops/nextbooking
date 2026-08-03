/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#C97D72',
        'primary-dark': '#6B372E',
        'primary-light': '#F3DAD3',
        brand: {
          50:  '#FDF4F0',
          100: '#F9E2DB',
          200: '#F3DAD3',
          500: '#C97D72',
          600: '#B05F52',
          700: '#8A4A3F',
          900: '#4A251F',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
