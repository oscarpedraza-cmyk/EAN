import type { Config } from "tailwindcss";

/** Paleta tomada del theme de la plantilla institucional (ppt/theme1.xml). */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        casco: {
          950: "#f8f9fa",
          900: "#f0f2f5",
          800: "#e8eaed",
          700: "#e0e2e6",
          600: "#d8dadd",
        },
        cian: {
          DEFAULT: "#0d7ca8",
          claro: "#4ba3c7",
          tenue: "#b3d9e8",
        },
        menta: { DEFAULT: "#16a34a", oscuro: "#15803d" },
        ladrillo: { DEFAULT: "#dc2626", claro: "#f87171" },
        ambar: { DEFAULT: "#d97706" },
        pizarra: { DEFAULT: "#4b5563", oscuro: "#1f2937" },
      },
      keyframes: {
        entrada: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        latido: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(190,75,75,.45)" },
          "50%": { boxShadow: "0 0 0 10px rgba(190,75,75,0)" },
        },
      },
      animation: {
        entrada: "entrada .3s ease-out both",
        latido: "latido 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
