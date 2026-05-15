/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./data/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2F51A1",
          hover: "#254278",
          foreground: "#FFFFFF",
        },
        brand: {
          primary: "#2F51A1",
          navStart: "#2F51A1",
          navEnd: "#1B2745",
        },
        background: {
          app: "#F9F9FF",
          surface: "#FFFFFF",
          muted: "#ECECEC",
          successTint: "#D6F5DD",
        },
        text: {
          primary: "#1C1C1C",
          secondary: "#B1B1C2",
          label: "#9C9CA3",
          heading: "#101010",
        },
        state: {
          success: "#0F8E13",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
      },
      boxShadow: {
        invo: "19px 1px 8px rgba(48, 57, 115, 0.1)",
        sidebar: "3px 5px 15px 0px rgba(48, 57, 115, 0.05)",
      },
      backgroundImage: {
        "sidebar-gradient":
          "linear-gradient(-4.397deg, #1B2745 0.69%, #2F51A1 97.19%)",
      },
    },
  },
  plugins: [],
};
