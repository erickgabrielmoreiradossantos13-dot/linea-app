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
          50: "#fff4ed",
          100: "#ffe6d5",
          200: "#ffc7a3",
          300: "#ff9d63",
          400: "#ff7a35",
          500: "#f4611a",
          600: "#e0500f",
          700: "#b93f0c",
          800: "#8f3210",
          900: "#6b280f",
        },
        carbon: {
          // Escala oscura derivada del azul de marca (no gris neutro): mismo
          // tono que el fondo del logo, distinto solo en luminosidad.
          50: "#f2f5fa",
          100: "#e1e7f1",
          200: "#c3cee2",
          300: "#9aacc9",
          400: "#6b84ab",
          500: "#48608a",
          600: "#324768",
          700: "#1f2c48",
          800: "#141d33",
          900: "#0b1220",
          950: "#060a14",
        },
        // Tokens con nombre (background/surface/border/text/brand-blue) que
        // leen de las variables CSS de globals.css: fuente única de verdad
        // para la identidad Línea Sur, reutilizable como bg-surface,
        // text-text-secondary, border-border, etc.
        background: "var(--background)",
        surface: "var(--surface)",
        "surface-hover": "var(--surface-hover)",
        border: "var(--border)",
        "brand-blue": "var(--brand-blue)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        secondary: {
          50: "#fff1ee",
          100: "#ffe1da",
          200: "#ffc0b3",
          300: "#ff9a85",
          400: "#ff7a5f",
          500: "#ff6b5b",
          600: "#e2503f",
          700: "#bc3d2e",
          800: "#8f2e22",
          900: "#6b2119",
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
        "card-hover": "0 2px 6px -1px rgb(0 0 0 / 0.05), 0 8px 24px -4px rgb(0 0 0 / 0.08)",
        popover: "0 10px 40px -10px rgb(0 0 0 / 0.15)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.04)" },
        },
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-soft": "pulseSoft 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
