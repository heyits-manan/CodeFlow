/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    // For Electron apps, also include main process files if they contain Tailwind classes
    "./electron/**/*.{js,jsx,ts,tsx}",
    // Add any other directories containing Tailwind classes
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
