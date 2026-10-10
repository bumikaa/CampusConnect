/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amazon: {
          navy: "#131921",
          dark: "#232F3E",
          orange: "#FF9900",
          amber: "#FEBD69",
          light: "#F3F4F6",
          border: "#D5D9D9",
          green: "#067D62",
          red: "#B12704",
        }
      }
    },
  },
  plugins: [],
}
