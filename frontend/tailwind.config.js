/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#09090B",
          panel: "#111318",
          border: "#252833",
          violet: "#8B5CF6",
          cyan: "#22D3EE",
        },
      },
      boxShadow: {
        glow: "0 0 30px rgba(139, 92, 246, 0.12)",
      },
    },
  },
  plugins: [],
};