import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBFBFD",
        ink: "#1A2230",
        cele: {
          50: "#F2F9FE",
          100: "#E1F0FB",
          200: "#C2E1F6",
          300: "#9BCEEF",
          400: "#73B8E6",
          500: "#4D9FD8",
          600: "#3683BF",
          700: "#2A689B",
          800: "#22557D",
          900: "#1D4665",
        },
      },
      fontFamily: {
        hand: ["var(--font-caveat)", "ui-serif", "cursive"],
        note: ["var(--font-kalam)", "ui-serif", "cursive"],
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
