/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["JetBrains Mono", "monospace"],
        sans: ["DM Sans", "sans-serif"],
      },
      colors: {
        // Background layers
        bg0: "#0d0f12",
        bg1: "#13161b",
        bg2: "#1a1e25",
        bg3: "#21262f",
        bg4: "#2a3040",
        // Accent
        accent: "#00d4ff",
        // Status
        "status-green": "#00e676",
        "status-red": "#ff5252",
        "status-amber": "#ffab40",
        "status-purple": "#b388ff",
      },
      fontSize: {
        "2xs": "9px",
        // xs: "10px",
        // sm: "11px",
        // base: "12px",
        // md: "13px",
        // lg: "14px",
        xs: "12px",
        sm: "13px",
        base: "14px",
        md: "15px",
        lg: "16px",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.07)",
        lit: "rgba(255,255,255,0.13)",
      },
      animation: {
        "pulse-slow": "pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
