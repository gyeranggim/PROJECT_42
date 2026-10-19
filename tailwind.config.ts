import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: "#006241",      // Starbucks Green
          accent: "#00754A",     // Green Accent (CTA)
          house: "#1E3932",      // House Green (Dark Deep Green)
          uplift: "#2b5148",     // Green Uplift
          light: "#d4e9e2",      // Mint Tint Wash
        },
        canvas: {
          warm: "#f2f0eb",       // Neutral Warm Canvas
          ceramic: "#edebe9",    // Ceramic Section Separator
          cool: "#f9f9f9",       // Subtle cool gray
          white: "#ffffff",      // Card & Modal Surface
        },
        gold: {
          DEFAULT: "#cba258",
          light: "#dfc49d",
          lightest: "#faf6ee",
        },
        status: {
          red: "#c82014",
          "red-tint": "rgba(200, 32, 20, 0.08)",
          yellow: "#fbbc05",
          "yellow-tint": "rgba(251, 188, 5, 0.15)",
        },
        textDark: "rgba(0, 0, 0, 0.87)",
        textMuted: "rgba(0, 0, 0, 0.58)",
      },
      fontFamily: {
        sans: ["Pretendard", "-apple-system", "BlinkMacSystemFont", "system-ui", "Roboto", "sans-serif"],
      },
      letterSpacing: {
        tightest: "-0.01em",
        tighter: "-0.16px",
      },
      borderRadius: {
        card: "12px",
        pill: "50px",
      },
      boxShadow: {
        card: "0px 0px 0.5px 0px rgba(0,0,0,0.14), 0px 1px 1px 0px rgba(0,0,0,0.24)",
        nav: "0 1px 3px rgba(0,0,0,0.1), 0 2px 2px rgba(0,0,0,0.06), 0 0 2px rgba(0,0,0,0.07)",
        frap: "0 0 6px rgba(0,0,0,0.24), 0 8px 12px rgba(0,0,0,0.14)",
      },
    },
  },
  plugins: [],
};
export default config;
