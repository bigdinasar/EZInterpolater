/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        minHeight: {
          '150p': '150px',
          'screen-1/2': '50vh',
        },
      },
    },
    plugins: [],
  }