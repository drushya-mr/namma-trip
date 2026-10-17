/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        karnataka: {
          red: '#DC2626',
          crimson: '#B91C1C',
          yellow: '#F59E0B',
          gold: '#D97706',
          amber: '#FBBF24',
          sand: '#FEF3C7',
          forest: '#065F46',
          emerald: '#059669',
          temple: '#7C2D12',
          clay: '#9A3412',
          earth: '#451A03'
        }
      },
      fontFamily: {
        kannada: ['"Noto Sans Kannada"', 'system-ui', '-apple-system', 'sans-serif'],
        sans: ['"Noto Sans Kannada"', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
};
