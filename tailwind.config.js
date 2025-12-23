/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Brand colors
        pb: {
          white: "#FFFFFF",
          black: "#010409",
          purple: "#7B5CB8",
          mint: "#5ECD8A",
          lightBlue: "#F2F7FD",
          darkGrey: "#464A50",
        },

        // Neutral greys – light theme
        slate: {
          50:  "#F5F5F6",
          100: "#E5E6E8",
          200: "#C6C8CC",
          300: "#A7AAB1",
          400: "#888C96",
          500: "#6A6E7A",
          600: "#4F525B",
          700: "#3A3D45",
          800: "#25272F",
          900: "#1A1C23",
          950: "#111217",
        },

        purple: {
          50:  "#F5F3FA",
          100: "#EAE6F5",
          200: "#D5CCEB",
          300: "#BFB3E0",
          400: "#AA99D6",
          500: "#7B5CB8",
          600: "#634A96",
          700: "#4A3874",
          800: "#322652",
          900: "#191430",
        },

        emerald: {
          50:  "#F0FBF5",
          100: "#E1F7EA",
          200: "#C3EFD5",
          300: "#A5E7C0",
          400: "#87DFAB",
          500: "#5ECD8A",
          600: "#4BA46E",
          700: "#387B53",
          800: "#255237",
          900: "#13291C",
        },

        blue: {
          50:  "#F7FAFF",
          100: "#F2F7FD",
          200: "#D4E2F9",
          300: "#B6CDF5",
          400: "#98B8F1",
          500: "#7AA3ED",
          600: "#5C8EE9",
          700: "#3E79E5",
          800: "#2064E1",
          900: "#0A4ECC",
        },

        orange: {
          400: "#fb923c",
          500: "#f97316",
        },
        red: {
          400: "#f87171",
          500: "#ef4444",
        },
        yellow: {
          400: "#facc15",
          500: "#eab308",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
        },
      },

      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
      boxShadow: {
        pb: "0 4px 20px rgba(1, 4, 9, 0.08)",
        "pb-lg": "0 10px 40px rgba(1, 4, 9, 0.12)",
      },
    },
  },
  plugins: [],
};
