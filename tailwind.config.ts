import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          DEFAULT: "#059669",
          dark: "#047857"
        },
        accent: {
          DEFAULT: "#F59E0B",
          dark: "#D97706"
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#475569",
          soft: "#94A3B8"
        }
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.06)",
        cardHover: "0 2px 4px rgba(15, 23, 42, 0.06), 0 12px 32px rgba(15, 23, 42, 0.12)"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem"
      }
    }
  },
  plugins: []
};

export default config;
