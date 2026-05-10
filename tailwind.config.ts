import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        inkBrown: "#2A1F1A",
        paper: "#F7F4EC",
        warmGold: "#A97A3D",
        "warmGold-soft": "#C0A060",
        cinnabar: "#8F1F2D",
        ritualRed: "#7F1D1D",
        porcelain: "#33251F",
        ink: "#2A1F1A",
        charcoal: "#F7F4EC",
        gold: "#A97A3D",
        "gold-soft": "#C0A060"
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ],
        serif: ["Georgia", "Times New Roman", "serif"]
      },
      boxShadow: {
        aureate: "0 14px 36px rgba(80, 54, 36, 0.065)"
      }
    }
  },
  plugins: []
};

export default config;
