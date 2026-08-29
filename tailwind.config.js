/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cheese: {
          50: "#fffdf3",
          100: "#fff8d9",
          200: "#ffedad",
          300: "#ffdd70",
          400: "#ffc933",
          500: "#f7b500",
          600: "#d99400",
          700: "#b06f02",
          800: "#8f570b",
          900: "#76480f",
        },
      },
    },
  },
  plugins: [],
};
