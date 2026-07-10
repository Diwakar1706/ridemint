/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // One brand color used everywhere = coherent look
        brand: {
          50: "#eefbf4", 100: "#d6f5e3", 500: "#10b981",
          600: "#059669", 700: "#047857", 900: "#064e3b",
        },
      },
    },
  },
  plugins: [],
};
