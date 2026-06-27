import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        bg: { DEFAULT: "#0b0d10", soft: "#11151a", card: "#161b22" },
        accent: { DEFAULT: "#f5b041", soft: "#ffd28a" },
        ink: { DEFAULT: "#e6edf3", soft: "#9ba6b3" },
        line: "#1f2630",
        good: "#3fb950",
        bad: "#f85149",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,176,65,.35), 0 8px 32px rgba(245,176,65,.12)",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
