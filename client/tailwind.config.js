/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#04070d",
        abyss: "#070c15",
        panel: "#0c1424",
        raise: "#111c31",
        line: "#1b2a44",
        cloud: "#e8eff8",
        mist: "#8ca4c8",
        fade: "#56688c",
        signal: {
          300: "#9be8ff",
          400: "#5ad8ff",
          500: "#2fc3ef",
          600: "#1ba3d6",
          700: "#1782ad",
        },
        brass: {
          300: "#ffd699",
          400: "#f7b85e",
          500: "#e79a3c",
          600: "#c97f2c",
        },
        go: "#3dd68c",
        warn: "#f7b85e",
        stop: "#f06a5c",
      },
      fontFamily: {
        display: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
        xl3: "1.75rem",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(47,195,239,0.25), 0 0 24px rgba(47,195,239,0.14)",
        "glow-soft": "0 8px 40px rgba(4,7,13,0.6)",
        card: "0 1px 0 rgba(255,255,255,0.03) inset, 0 12px 32px rgba(4,7,13,0.5)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.25" },
        },
        "pulse-dot": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(0.7)", opacity: "0.5" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "fade-in": "fade-in 0.6s ease both",
        blink: "blink 1.4s ease-in-out infinite",
        "pulse-dot": "pulse-dot 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};