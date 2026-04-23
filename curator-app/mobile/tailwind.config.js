/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // M3 Surface hierarchy
        surface: {
          DEFAULT: "#fbf9f3",
          dim: "#d9dbcd",
          bright: "#fbf9f3",
          "container-lowest": "#ffffff",
          "container-low": "#f5f4ec",
          container: "#efeee5",
          "container-high": "#e9e9de",
          "container-highest": "#e2e3d6",
          variant: "#e2e3d6",
        },
        // M3 Primary
        primary: {
          DEFAULT: "#5f5e5e",
          dim: "#535252",
          foreground: "#faf7f6",
          container: "#e5e2e1",
          "fixed-dim": "#d6d4d3",
        },
        // M3 Secondary
        secondary: {
          DEFAULT: "#625f56",
          dim: "#55534b",
          foreground: "#fef8ed",
          container: "#e7e2d7",
        },
        // M3 Tertiary
        tertiary: {
          DEFAULT: "#5e5f60",
          dim: "#525354",
          foreground: "#f9f9f9",
          container: "#f3f3f4",
        },
        // M3 On-colors
        "on-surface": "#31332b",
        "on-surface-variant": "#5e6056",
        "on-primary": "#faf7f6",
        "on-primary-container": "#525151",
        "on-secondary": "#fef8ed",
        "on-secondary-container": "#545249",
        "on-tertiary": "#f9f9f9",
        "on-tertiary-container": "#5a5c5c",
        "on-background": "#31332b",
        // M3 Inverse
        "inverse-surface": "#0e0e0b",
        "inverse-on-surface": "#9e9d98",
        "inverse-primary": "#ffffff",
        // M3 Outline
        outline: {
          DEFAULT: "#7a7c71",
          variant: "#b1b3a7",
        },
        // M3 Error
        error: {
          DEFAULT: "#c78b8b",
          dim: "#a66c6c",
          container: "#f5e0e0",
        },
        "on-error": "#ffffff",
        "on-error-container": "#5c3838",
        // Input
        "input-background": "#f5f4ec",
        // Background
        background: "#fbf9f3",
        foreground: "#31332b",
      },
      fontFamily: {
        serif: ["Newsreader"],
        "serif-italic": ["Newsreader-Italic"],
        sans: ["Manrope"],
      },
      borderRadius: {
        organic: "80px 40px 100px 60px",
        "organic-sm": "40px 20px 50px 30px",
        "organic-player": "40px 30px 50px 35px",
      },
      boxShadow: {
        card: "0px 22px 38px rgba(8, 18, 28, 0.16)",
        pill: "0px 4px 16px rgba(0, 0, 0, 0.12)",
        float: "0px 8px 32px rgba(0, 0, 0, 0.12)",
      },
    },
  },
  plugins: [],
};
