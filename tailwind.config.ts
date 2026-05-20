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
        serif: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        breathe: "breathe 8s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.04)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
