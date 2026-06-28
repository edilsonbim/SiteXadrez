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
        bg: { DEFAULT: "#07090d", soft: "#0d1118", card: "#111722", elev: "#161e2b" },
        accent: { DEFAULT: "#d8b46a", soft: "#f0d59a" },
        ink: { DEFAULT: "#f2efe8", soft: "#a7b0bc" },
        line: "#223041",
        good: "#4bd18b",
        bad: "#ff6b6b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(216,180,106,.42), 0 16px 48px rgba(216,180,106,.16)",
        frame: "0 28px 80px rgba(0,0,0,.45)",
      },
      keyframes: {
        pulseSoft: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: ".5" },
        },
        floatSlow: {
          "0%,100%": { transform: "translate3d(0, 0, 0)" },
          "50%": { transform: "translate3d(0, -8px, 0)" },
        },
      },
      animation: {
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "float-slow": "floatSlow 8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
