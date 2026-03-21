/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#0f766e',
          dark: '#0d6860',
        },
      },
      borderRadius: {
        '2xl': '14px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
