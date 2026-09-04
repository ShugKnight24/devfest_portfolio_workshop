/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        background: "var(--color-background)",
        dark: "var(--color-dark)",
        text: "var(--color-text)",
        textDark: "var(--color-textDark)",
      },
    },
  },
  plugins: [],
};
