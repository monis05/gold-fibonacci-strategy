import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gold: {
          50: "#FFFDF0",
          100: "#FFF9C2",
          200: "#FFF285",
          300: "#FFE647",
          400: "#FFD700",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
        },
        terminal: {
          bg: "#0B0E14",
          card: "#121721",
          cardHover: "#161D2B",
          border: "#1E293B",
          muted: "#64748B",
          text: "#F8FAFC",
          emerald: "#10B981",
          emeraldGlow: "rgba(16, 185, 129, 0.2)",
          rose: "#EF4444",
          roseGlow: "rgba(239, 68, 68, 0.2)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
