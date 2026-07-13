/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  'rgb(var(--brand-50) / <alpha-value>)',
          100: 'rgb(var(--brand-100) / <alpha-value>)',
          200: 'rgb(var(--brand-200) / <alpha-value>)',
          500: 'rgb(var(--brand-500) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
          700: 'rgb(var(--brand-700) / <alpha-value>)',
          900: 'rgb(var(--brand-900) / <alpha-value>)',
        },
        background:  'rgb(var(--color-background) / <alpha-value>)',
        surface:     'rgb(var(--color-surface) / <alpha-value>)',
        'surface-raised': 'rgb(var(--color-surface-raised) / <alpha-value>)',
        border:      'rgb(var(--color-border) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
        primary: {
          DEFAULT:    'rgb(var(--color-primary) / <alpha-value>)',
          foreground: 'rgb(var(--color-primary-foreground) / <alpha-value>)',
          hover:      'rgb(var(--color-primary-hover) / <alpha-value>)',
        },
        text: {
          primary:   'rgb(var(--color-text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--color-text-secondary) / <alpha-value>)',
          muted:     'rgb(var(--color-text-muted) / <alpha-value>)',
          inverse:   'rgb(var(--color-text-inverse) / <alpha-value>)',
        },
        success: 'rgb(var(--color-success) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        danger:  'rgb(var(--color-danger) / <alpha-value>)',
        info:    'rgb(var(--color-info) / <alpha-value>)',
        // shadcn compat aliases
        foreground:  'rgb(var(--color-text-primary) / <alpha-value>)',
        muted: {
          DEFAULT:    'rgb(var(--color-surface) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT:    'rgb(var(--color-surface) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:    'rgb(var(--color-danger) / <alpha-value>)',
          foreground: '255 255 255',
        },
        input: 'rgb(var(--color-border) / <alpha-value>)',
        ring:  'rgb(var(--color-primary) / <alpha-value>)',
        card: {
          DEFAULT:    'rgb(var(--color-surface-raised) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        popover: {
          DEFAULT:    'rgb(var(--color-surface-raised) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-primary) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:    'rgb(var(--color-surface) / <alpha-value>)',
          foreground: 'rgb(var(--color-text-secondary) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        DEFAULT: 'var(--radius-md)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'calc(var(--radius-xl) + 4px)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        xs:    'var(--shadow-xs)',
        sm:    'var(--shadow-sm)',
        DEFAULT: 'var(--shadow-md)',
        md:    'var(--shadow-md)',
        lg:    'var(--shadow-lg)',
        xl:    'var(--shadow-xl)',
        glow:  'var(--shadow-glow)',
        'glow-sm': '0 0 0 2px rgb(var(--color-primary) / 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to:   { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
      },
      animation: {
        'accordion-down':  'accordion-down 0.2s ease-out',
        'accordion-up':    'accordion-up 0.2s ease-out',
        'fade-in':         'fade-in 0.2s ease-out',
        'slide-in-right':  'slide-in-right 0.25s ease-out',
        shimmer:           'shimmer 2s infinite linear',
      },
    },
  },
}
