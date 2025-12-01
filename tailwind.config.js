/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          500: "#004aad",
          600: "#004aad",
          700: "#003a8a",
        },
        blue: {
          50: "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d6ff",
          300: "#a5b8ff",
          400: "#8190ff",
          500: "#6366ff",
          600: "#004aad",
          700: "#003a8a",
          800: "#002d6b",
          900: "#001f4d",
        },
      },
    },
  },
  plugins: [],
};
