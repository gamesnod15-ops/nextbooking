/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#CFF21E',
        'primary-dark': '#A8C818',
        'primary-light': '#E8F98F',
        brand: {
          50:  '#F7FDD8',
          100: '#F0FBBF',
          200: '#E5F994',
          500: '#CFF21E',
          600: '#AECE19',
          700: '#8CAB14',
          900: '#506210',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
