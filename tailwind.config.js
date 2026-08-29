/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // matches the purple/blue pixel-art button artwork and mascot
        brand: {
          50: "#f6f4fa",
          100: "#e8e3f2",
          200: "#cec3e4",
          300: "#af9cd3",
          400: "#8c72c0",
          500: "#6f4fb0",
          600: "#62469b",
          700: "#523a82",
          800: "#45316d",
          900: "#3a295b",
        },
      },
    },
  },
  plugins: [],
};
