/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}', './app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'rgb(var(--brand-50)  / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
        },
      },
      fontFamily: { sans: ['Inter', 'sans-serif'] },
      keyframes: {
        'fade-in':        { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in-right': { from: { opacity: '0', transform: 'translateX(-16px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        'marquee':        { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'marquee-slow':   { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        'float':          { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: {
        'fade-in':        'fade-in 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'marquee':        'marquee 28s linear infinite',
        'marquee-slow':   'marquee-slow 40s linear infinite',
        'float':          'float 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
