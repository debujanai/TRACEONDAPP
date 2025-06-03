import tailwindScrollbar from 'tailwind-scrollbar';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ClashGrotesk-Light', 'sans-serif'],
        heading: ['ClashGrotesk-Regular', 'sans-serif'],
        medium: ['ClashGrotesk-Medium', 'sans-serif'],
        bold: ['ClashGrotesk-Bold', 'sans-serif'],
      },
      scale: {
        '98': '0.98',
      },
    },
  },
  plugins: [
    tailwindScrollbar,
  ],
}; 