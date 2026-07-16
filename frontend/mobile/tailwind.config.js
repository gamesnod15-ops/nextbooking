/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#CE0D1E',
        'primary-dark': '#A70B18',
        'primary-light': '#E78B93',
        brand: {
          50:  '#F8DBDD',
          100: '#F0B6BC',
          200: '#E78891',
          500: '#CE0D1E',
          600: '#AF0B1A',
          700: '#900915',
          900: '#52050C',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
