import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bccfff",
          300: "#8eaeff",
          400: "#5a83ff",
          500: "#3a5cff",
          600: "#2a3df5",
          700: "#232fd8",
          800: "#1f2aae",
          900: "#202b89",
          950: "#161b54",
        },
        accent: {
          500: "#ff7a59",
          600: "#ff5b35",
        },
        success: {
          500: "#22c55e",
          600: "#16a34a",
        },
        warning: {
          500: "#f59e0b",
          600: "#d97706",
        },
        danger: {
          500: "#ef4444",
          600: "#dc2626",
        },
        ink: {
          50: "#f7f7fb",
          100: "#eef0f6",
          200: "#dde1ec",
          300: "#bcc3d6",
          400: "#8a93ad",
          500: "#5b6478",
          600: "#3d4456",
          700: "#2a3041",
          800: "#1b1f2c",
          900: "#0f121b",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 6px 24px -8px rgba(36, 50, 110, 0.18)",
        card: "0 10px 30px -12px rgba(36, 50, 110, 0.25)",
        glow: "0 12px 40px -12px rgba(58, 92, 255, 0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        "grid-light":
          "linear-gradient(to right, rgba(15,18,27,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,18,27,0.06) 1px, transparent 1px)",
        "hero-gradient":
          "radial-gradient(1200px 600px at 80% -10%, rgba(58,92,255,0.25), transparent 60%), radial-gradient(900px 500px at -10% 30%, rgba(255,122,89,0.18), transparent 60%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out both",
        "slide-up": "slideUp 0.5s ease-out both",
        float: "float 4s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulseSoft: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(58,92,255,0.45)" },
          "50%": { boxShadow: "0 0 0 14px rgba(58,92,255,0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
