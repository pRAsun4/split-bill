/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // 2. Enable class-based dark mode
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // --- Branding Colors (Stay the same in both modes) ---
        primary: "#FF7A51",
        secondary: "#FFC56E",

        // --- Theme-Aware Colors (Change based on mode) ---
        // Usage: className="bg-card-bg"
        "card-bg": {
          light: "#FFFFFF",        // Light Mode White
          dark: "#1A1A1A",         // Dark Mode Charcoal/Black
        },
        "text-main": {
          light: "#000000",
          dark: "#FFFFFF",
        },
        "text-muted": {
          light: "rgba(0,0,0,0.6)",
          dark: "rgba(255,255,255,0.6)",
        },

        // --- Specific UI Elements ---
        darkTab: "#1A1A1A", // The floating dock color
        statusGreen: "#4ADE80",
        statusRed: "#F87171",
      },
    },
  },
  plugins: [],
}

