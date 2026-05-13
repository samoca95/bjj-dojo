/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Mirror of src/constants/themeColors.ts — keep these in sync.
        // Hex values are needed here (not CSS vars) so Tailwind opacity modifiers
        // like `bg-gold/20` work.
        gold: {
          DEFAULT: '#d4a017',
          light: '#ffcc44',
          dim: '#8a6a00',
        },
        'belt-black': 'var(--belt-black)',
      },
    },
  },
  plugins: [],
}
