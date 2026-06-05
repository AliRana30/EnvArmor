import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        "neo-bg": "#FFFDF5",
        "neo-ink": "#000000",
        "neo-accent": "#FF6B6B",
        "neo-secondary": "#FFD93D",
        "neo-muted": "#C4B5FD",
        "neo-white": "#FFFFFF",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      boxShadow: {
        "neo-sm": "4px 4px 0px 0px #000",
        "neo-md": "8px 8px 0px 0px #000",
        "neo-lg": "12px 12px 0px 0px #000",
        "neo-xl": "16px 16px 0px 0px #000",
        "neo-inv": "8px 8px 0px 0px #fff",
        "neo-accent": "6px 6px 0px 0px #FF6B6B",
        "neo-yellow": "6px 6px 0px 0px #FFD93D"
      },
      fontFamily: {
        sans: ["var(--font-space)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        display: ["var(--font-space)", "sans-serif"]
      },
      animation: {
        "spin-slow": "spin-slow 12s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
