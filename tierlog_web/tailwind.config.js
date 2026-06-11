/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        tierlog: {
          bg: "#030303",
          "bg-deep": "#020617",
          panel: "#0F172A",
          indigo: "#6366F1",
          "indigo-deep": "#4F46E5",
          rose: "#F43F5E",
          violet: "#8B5CF6",
          cyan: "#06B6D4",
          amber: "#F59E0B",
        },
      },
    },
  },
  plugins: [],
};
