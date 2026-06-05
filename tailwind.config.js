/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Polymarket-ish dark palette
        ink: {
          900: '#0b0e13', // app background
          850: '#0f131a',
          800: '#131722', // panels / cards
          750: '#171c28',
          700: '#1b212e', // raised
          600: '#222a3a', // borders
          500: '#2b3446',
        },
        text: {
          DEFAULT: '#e8edf6',
          muted: '#8b95a7',
          faint: '#5c6678',
        },
        brand: {
          DEFAULT: '#2d6cff', // Polymarket blue
          600: '#2d6cff',
          700: '#1f56e0',
        },
        yes: {
          DEFAULT: '#27ae8b',
          soft: 'rgba(39,174,139,0.14)',
          strong: '#23c08b',
        },
        no: {
          DEFAULT: '#e5484d',
          soft: 'rgba(229,72,77,0.14)',
          strong: '#f0575c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 0 0 rgba(255,255,255,0.02), 0 8px 24px -12px rgba(0,0,0,0.6)',
        pop: '0 12px 40px -8px rgba(0,0,0,0.7)',
      },
      keyframes: {
        'fade-in': { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'scale(0.97)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        flash: { '0%': { background: 'rgba(45,108,255,0.18)' }, '100%': { background: 'transparent' } },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease both',
        'pop-in': 'pop-in 0.18s ease both',
        flash: 'flash 0.6s ease',
      },
    },
  },
  plugins: [],
}
