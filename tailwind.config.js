/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Branding
        primary: "#FF7A51",
        secondary: "#FFC56E",
        // Theme-aware colors
        background: "var(--color-background)",
        card: "var(--color-card)",
        text: "var(--color-text)",
      },
    },
  },
  plugins: [],
}

