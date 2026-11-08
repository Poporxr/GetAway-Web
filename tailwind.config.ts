import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAFAF9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        hand: ["Caveat", "Segoe Script", "cursive"],
        display: ['"Archivo Black"', "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
