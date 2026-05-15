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
        // Brand accent (single saturated red, the only loud color in the system)
        brand: {
          DEFAULT: "#800020",
          pressed: "#cc001f"
        },

        // Ink + text tones
        ink: "#000000",
        "ink-soft": "#211922",
        body: "#33332e",
        charcoal: "#262622",
        mute: "#62625b",
        ash: "#91918c",
        stone: "#c8c8c1",

        // Surfaces (warm cream chrome)
        canvas: "#ffffff",
        "surface-soft": "#fbfbf9",
        "surface-card": "#f6f6f3",
        "surface-deep": "#e5e5e0",
        "surface-dark": "#262622",

        // Lines
        hairline: "#dadad3",
        "hairline-soft": "#e5e5e0",

        // Semantic
        success: "#103c25",
        "success-pale": "#c7f0da",
        danger: "#9e0a0a",
        "focus-ring": "#435ee5",

        // Legacy aliases retained so we don't break tailwind classes elsewhere
        primary: "#000000",
        "primary-container": "#262622",
        secondary: "#62625b",
        "secondary-fixed": "#e5e5e0",
        surface: "#fbfbf9",
        "surface-low": "#f6f6f3",
        "surface-card-legacy": "#f6f6f3",
        muted: "#62625b",
        outline: "#dadad3"
      },
      fontFamily: {
        serif: ["Iowan Old Style", "Palatino Linotype", "Book Antiqua", "Georgia", "serif"],
        sans: ["Avenir Next", "Segoe UI", "Helvetica Neue", "Arial", "sans-serif"]
      },
      borderRadius: {
        none: "0px",
        sm: "8px",
        md: "16px",
        lg: "32px",
        full: "9999px"
      },
      boxShadow: {
        ambient: "0 16px 40px rgba(38, 38, 34, 0.08)",
        scrim: "0 24px 60px rgba(38, 38, 34, 0.18)"
      },
      letterSpacing: {
        tightest: "-0.04em",
        "display-xl": "-1.2px",
        "display-lg": "-0.8px"
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        slowSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        sway: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" }
        }
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        float: "float 7s ease-in-out infinite",
        "spin-slow": "slowSpin 28s linear infinite",
        marquee: "marquee 40s linear infinite",
        sway: "sway 5s ease-in-out infinite"
      },
      backgroundImage: {
        sunwash:
          "radial-gradient(circle at 20% 0%, rgba(230, 0, 35, 0.06), transparent 35%), radial-gradient(circle at 90% 30%, rgba(255, 195, 100, 0.18), transparent 40%)"
      }
    }
  },
  plugins: []
};

export default config;
