import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0A0E0C",
        paper: "#F4F1EA",
        sage: "#DAE6D8",
        olive: "#7B930A",
      },
    },
  },
  plugins: [],
};

export default config;
