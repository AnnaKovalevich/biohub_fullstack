/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        base: "#0D1117",
        accent: "#00FFAA",
        surface: "rgba(255,255,255,0.03)",
        borderLine: "rgba(255,255,255,0.08)",
        muted: "#8B949E",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        custom: "8px",
      },
    },
  },
  plugins: [],
}
