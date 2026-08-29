/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Every stone-* shade is a CSS variable (defined in globals.css) that
        // flips under the .dark class, so existing bg-stone-*/text-stone-*/
        // border-stone-* usage across the app becomes dark-mode-aware
        // without touching each component.
        stone: {
          50: "var(--stone-50)",
          100: "var(--stone-100)",
          200: "var(--stone-200)",
          300: "var(--stone-300)",
          400: "var(--stone-400)",
          500: "var(--stone-500)",
          600: "var(--stone-600)",
          700: "var(--stone-700)",
          800: "var(--stone-800)",
          900: "var(--stone-900)",
        },
        // card/input/navbar surface — kept separate from the stone-100 token
        // (chips/hover states) so cards still visibly stand out from both the
        // page background and chips in dark mode, not just in light mode.
        surface: "var(--surface)",
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
