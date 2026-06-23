/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{jsx,js}'],
  theme: {
    extend: {
      colors: {
        brand: {
          600: '#497abf',
          500: '#5a8bcc',
          50:  '#eef3fb',
        },
      },
    },
  },
  plugins: [],
}

