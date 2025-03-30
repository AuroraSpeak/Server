import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
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
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // AuraSpeak theme colors
        aura: {
          bg: "hsl(var(--aura-bg))",
          channels: "hsl(var(--aura-channels))",
          chat: "hsl(var(--aura-chat))",
          members: "hsl(var(--aura-members))",
          "text-normal": "hsl(var(--aura-text-normal))",
          "text-muted": "hsl(var(--aura-text-muted))",
          interactive: "hsl(var(--aura-interactive))",
          "interactive-hover": "hsl(var(--aura-interactive-hover))",
          primary: "hsl(var(--aura-primary))",
          secondary: "hsl(var(--aura-secondary))",
          success: "hsl(var(--aura-success))",
          warning: "hsl(var(--aura-warning))",
          danger: "hsl(var(--aura-danger))",
          special: "hsl(var(--aura-special))",
        },
      },
      borderRadius: {
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
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(5px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "50%": { transform: "scale(1.1)", opacity: "0.4" },
          "100%": { transform: "scale(0.8)", opacity: "0.8" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(124, 77, 255, 0.5)" },
          "50%": { boxShadow: "0 0 20px rgba(124, 77, 255, 0.8)" },
          "100%": { boxShadow: "0 0 5px rgba(124, 77, 255, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-ring": "pulse-ring 3s infinite",
        glow: "glow 2s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config

