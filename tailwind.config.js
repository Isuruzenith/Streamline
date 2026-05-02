/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#141414",
        surface: {
          DEFAULT: "rgba(255,255,255,0.02)",
          hover: "rgba(255,255,255,0.04)",
          active: "rgba(212,196,166,0.08)",
        },
        border: {
          DEFAULT: "rgba(255,255,255,0.06)",
          accent: "rgba(212,196,166,0.18)",
          strong: "rgba(212,196,166,0.25)",
        },
        text: {
          primary: "#e8e3db",
          secondary: "#b8b0a6",
          muted: "#9a9494",
          faint: "#8a8480",
          dim: "#5a5a6a",
        },
        accent: {
          DEFAULT: "#d4c4a6",
          muted: "rgba(212,196,166,0.15)",
          soft: "rgba(212,196,166,0.08)",
          glow: "rgba(212,196,166,0.04)",
        },
        status: {
          green: "#10b981",
          "green-bg": "rgba(16,185,129,0.12)",
          orange: "#f59e0b",
          "orange-bg": "rgba(245,158,11,0.12)",
          red: "#ef4444",
          "red-bg": "rgba(239,68,68,0.12)",
          blue: "#818cf8",
          "blue-bg": "rgba(99,102,241,0.12)",
        },
        nav: {
          DEFAULT: "#6a6a7a",
          active: "#d8d0c8",
          icon: "#5a5a6a",
          "icon-active": "#d4c4a6",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'DM Mono'", "monospace"],
        serif: ["'Crimson Pro'", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["10px", "14px"],
        xs: ["11px", "16px"],
        sm: ["12px", "18px"],
        "sm+": ["12.5px", "20px"],
        base: ["13px", "20px"],
        md: ["14px", "22px"],
        lg: ["15px", "24px"],
        xl: ["20px", "28px"],
        "2xl": ["26px", "32px"],
      },
      borderRadius: {
        "2sm": "3px",
        sm: "4px",
        DEFAULT: "8px",
        md: "10px",
      },
      spacing: {
        4.5: "18px",
        5.5: "22px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "shrink-x": "shrinkX 5s linear forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "progress-bar": "progressBar 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { opacity: "0", transform: "translateX(-4px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(16px) translateY(0)" },
          "100%": { opacity: "1", transform: "translateX(0) translateY(0)" },
        },
        shrinkX: {
          "0%": { width: "100%" },
          "100%": { width: "0%" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        progressBar: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
    },
  },
  plugins: [],
};
