import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brat: {
          green: "#7FFF00",
          hot: "#7CFF2F",
          soft: "#B8FF9C",
          bg: "#E6FFDC",
        },
        riot: {
          pink: "#FF7AC8",
          pinkSoft: "#FFD2EA",
          yellow: "#EAFF3D",
          ink: "#050505",
          muted: "#3F443A",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Arial Black", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Arial", "sans-serif"],
      },
      boxShadow: {
        glass: "0 18px 48px rgba(0, 0, 0, 0.12)",
        glow: "0 0 32px rgba(140, 255, 79, 0.42)",
      },
    },
  },
  plugins: [],
};

export default config;
