/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./main.jsx",
    "./App.jsx",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./layouts/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        industrial: {
          bg: "#0F172A",
          panel: "#111C34",
          border: "#1E293B",
          blue: "#3B82F6",
          cyan: "#22D3EE",
          orange: "#F97316",
        },
      },
    },
  },
  plugins: [],
};
