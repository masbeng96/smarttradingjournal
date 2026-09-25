/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#0F0F0F",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#F0F0ED",
          foreground: "#0F0F0F",
        },
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F4F4F1",
          foreground: "#737373",
        },
        accent: {
          DEFAULT: "#0F0F0F",
          foreground: "#FFFFFF",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#0F0F0F",
        },
        // 60-30-10 Explicit Design Tokens
        base: {
          neutral: "#F7F7F5",
          surface: "#FFFFFF",
          subtle: "#F2F2EF",
          border: "#E5E5E2",
          card: "#FFFFFF",
        },
        support: {
          secondary: "#A3A3A3",
          muted: "#737373",
          darker: "#525252",
          light: "#EBEBE8",
        },
        highlight: {
          accent: "#0F0F0F",
          card: "#121212",
          black: "#0A0A0A",
        },
        emerald: {
          DEFAULT: "#10b981",
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        rose: {
          DEFAULT: "#f43f5e",
          50: "#fff1f2",
          100: "#ffe4e6",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
        },
        amber: {
          DEFAULT: "#f59e0b",
          50: "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        cyan: {
          DEFAULT: "#06b6d4",
          50: "#ecfeff",
          100: "#cffafe",
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        }
      },
      borderRadius: {
        '3xl': '24px',
        '4xl': '32px',
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-3px)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 3s ease-in-out infinite",
      },
      boxShadow: {
        'card-soft': '0 2px 14px 0 rgba(0, 0, 0, 0.03)',
        'card-hover': '0 6px 20px 0 rgba(0, 0, 0, 0.06)',
        'hero-dark': '0 12px 36px -6px rgba(15, 15, 15, 0.25)',
        'pill': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'nav-floating': '0 10px 32px 0 rgba(0, 0, 0, 0.08)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.4)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
