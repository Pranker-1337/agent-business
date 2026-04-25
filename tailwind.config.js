/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0a0a0a",
        secondary: "#f5f5f7",
        accent: "#0071e3",
        success: "#34c759",
        warning: "#ff9500",
        danger: "#ff3b30",
        surface: "#ffffff",
        "surface-secondary": "#f5f5f7",
        text: "#1d1d1f",
        "text-secondary": "#86868b",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
      },
    },
  },
  plugins: [],
};