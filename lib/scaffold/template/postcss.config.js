export default {
  plugins: {
    tailwindcss: {
      content: ["./index.html", "./src/**/*.{ts,tsx}"],
      theme: {
        extend: {
          colors: {
            bg: "var(--color-background)",
            fg: "var(--color-foreground)",
            background: "var(--color-background)",
            foreground: "var(--color-foreground)",
            primary: "var(--color-primary)",
            accent: "var(--color-accent)",
            neutral: "var(--color-neutral)",
            success: "var(--color-success)",
            error: "var(--color-error)",
            warning: "var(--color-warning)",
          },
          borderColor: {
            subtle: "var(--border-subtle)",
            default: "var(--border-default)",
          },
          fontFamily: {
            display: "var(--font-display)",
            body: "var(--font-body)",
          },
          transitionDuration: {
            fast: "150ms",
          },
          transitionTimingFunction: {
            out: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          },
        },
      },
      plugins: [],
    },
    autoprefixer: {},
  },
};
