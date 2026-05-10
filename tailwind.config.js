/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#d4a017',
          light: '#ffcc44',
          dim: '#8a6a00',
        },
      },
    },
  },
  plugins: [],
}
