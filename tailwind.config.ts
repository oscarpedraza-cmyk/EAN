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
          950: "#02161f",
          900: "#042433",
          800: "#0a3243",
          700: "#124256",
          600: "#1c5670",
        },
        cian: {
          DEFAULT: "#0a7fa0",
          claro: "#3aa8c4",
          tenue: "#c9d8de",
        },
        menta: { DEFAULT: "#00d494", oscuro: "#2f7049" },
        ladrillo: { DEFAULT: "#be4b4b", claro: "#e28a8a" },
        ambar: { DEFAULT: "#e0a33c" },
        pizarra: { DEFAULT: "#7a8a92", oscuro: "#4a5c66" },
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
