import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000e24",
        "primary-container": "#00234b",
        secondary: "#775a19",
        "secondary-fixed": "#ffdea5",
        surface: "#f8f9fa",
        "surface-low": "#f3f4f5",
        "surface-card": "#ffffff",
        ink: "#191c1d",
        muted: "#43474e",
        outline: "#c4c6d0",
        success: "#14532d",
        danger: "#8a1c1c"
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      boxShadow: {
        ambient: "0 20px 40px rgba(0, 14, 36, 0.06)"
      },
      backgroundImage: {
        silk: "linear-gradient(135deg, #000e24 0%, #00234b 100%)",
        aurora:
          "radial-gradient(circle at top left, rgba(255, 222, 165, 0.45), transparent 38%), radial-gradient(circle at bottom right, rgba(0, 35, 75, 0.22), transparent 32%)"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 7s ease-in-out infinite",
        "fade-up": "fadeUp 0.7s ease forwards"
      }
    }
  },
  plugins: []
};

export default config;
