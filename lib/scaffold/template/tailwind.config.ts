import type { Config } from "tailwindcss";

// Design tokens are defined as CSS variables in src/index.css and mapped here.
// The generation agent overwrites both files per the selected design direction.
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        neutral: "var(--neutral)",
        success: "var(--success)",
        error: "var(--error)",
        warning: "var(--warning)",
      },
      borderRadius: { token: "var(--radius)" },
      boxShadow: { token: "var(--shadow)" },
    },
  },
  plugins: [],
} satisfies Config;
