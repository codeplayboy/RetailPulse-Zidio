/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial"],
      },
      colors: {
        obsidian: "#05070d",
        titanium: "#d7dee8",
        chrome: "#f7fbff",
        pulse: "#38bdf8",
        mint: "#54f6b4",
        gold: "#f4d58d",
        coral: "#ff6b7a",
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.18)",
        glow: "0 0 50px rgba(56,189,248,.22)",
      },
    },
  },
  plugins: [],
};
