import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f2f4ff",
          100: "#e6e9fe",
          200: "#c3caff",
          300: "#9fa9ff",
          400: "#7c88fd",
          500: "#5b63f0",
          600: "#4640d6",
          700: "#3730ad",
          800: "#2c2687",
          900: "#211d63",
        },
        ink: {
          50: "#f7f7f8",
          100: "#eeeef0",
          200: "#d9d9de",
          300: "#b6b6c0",
          400: "#8b8b9a",
          500: "#6c6c7c",
          600: "#54545f",
          700: "#43434c",
          800: "#28282e",
          900: "#16161a",
          950: "#0c0c0e",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.03), 0 1px 6px -1px rgb(0 0 0 / 0.04)",
        popover: "0 10px 40px -10px rgb(0 0 0 / 0.15)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
