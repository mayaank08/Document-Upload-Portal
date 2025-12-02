/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          green: '#10B981',
          'green-light': '#D1FAE5',
          'green-dark': '#059669',
        },
        gray: {
          light: '#F3F4F6',
          medium: '#9CA3AF',
          dark: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}

