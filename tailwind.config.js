/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070d",
          900: "#0a0e17",
          850: "#0d1220",
          800: "#111827",
          700: "#1a2235",
          600: "#252f45",
          500: "#3a4560",
        },
        signal: {
          blue: "#3b6bf5",
          cyan: "#22d3ee",
          green: "#34d399",
          amber: "#f5b942",
          red: "#f5555e",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(59,107,245,0.35), 0 0 24px -4px rgba(59,107,245,0.45)",
      },
      backgroundImage: {
        grid: "linear-gradient(rgba(58,69,96,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(58,69,96,0.18) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "28px 28px",
      },
    },
  },
  plugins: [],
};
