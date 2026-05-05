import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
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
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        warm: {
          bg: "#faf9f7",
          panel: "#ffffff",
          subtle: "#f4f2ed",
          muted: "#ece9e2",
          border: "#ebe8e1",
          "border-strong": "#d8d4cb",
          "border-soft": "#f1eee7",
          text: "#1a1916",
          "text-strong": "#0d0c0a",
          "text-muted": "#74716b",
          "text-soft": "#989590",
          "text-faint": "#b3b0a8",
        },
        status: {
          success: "#1f7a3a",
          "success-bg": "#e8f7ee",
          "success-border": "#c6ead2",
          error: "#9c2a25",
          "error-bg": "#fdecea",
          "error-border": "#f5c6c2",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Noto Sans SC", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Noto Serif SC", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        "warm-xs": "0 1px 0 rgba(28, 27, 26, 0.04)",
        "warm-sm": "0 1px 2px rgba(28, 27, 26, 0.05), 0 1px 3px rgba(28, 27, 26, 0.04)",
        "warm-md": "0 6px 24px rgba(28, 27, 26, 0.07), 0 2px 6px rgba(28, 27, 26, 0.04)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-dot": "pulse-dot 3s ease-in-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
