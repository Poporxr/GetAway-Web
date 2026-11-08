import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F3",
        cream: "#F3EFE3",
      },
      fontFamily: {
        hand: ["Caveat", "Segoe Script", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
