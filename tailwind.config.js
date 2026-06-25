/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: {
          DEFAULT: "var(--surface)",
          hover: "var(--surface-hover)",
          active: "var(--surface-active)",
        },
        border: {
          DEFAULT: "var(--border)",
          accent: "var(--border-accent)",
          strong: "var(--border-strong)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          faint: "var(--text-faint)",
          dim: "var(--text-dim)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          muted: "var(--accent-muted)",
          soft: "var(--accent-soft)",
          glow: "var(--accent-glow)",
        },
        sidebar: "var(--sidebar-bg)",
        log: "var(--log-bg)",
        status: {
          green: "#5EBE78",
          "green-bg": "rgba(94,190,120,0.12)",
          orange: "#E9A84F",
          "orange-bg": "rgba(233,168,79,0.12)",
          red: "#C74D42",
          "red-bg": "rgba(199,77,66,0.12)",
          blue: "#58B7A3",
          "blue-bg": "rgba(88,183,163,0.12)",
        },
        nav: {
          DEFAULT: "var(--nav)",
          active: "var(--nav-active)",
          icon: "var(--nav-icon)",
          "icon-active": "var(--nav-icon-active)",
        },
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
        serif: ["'Fraunces'", "Georgia", "serif"],
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
        safe: "env(safe-area-inset-bottom, 0px)",
      },
      backdropBlur: {
        xs: "2px",
        glass: "12px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
        "slide-in-right": "slideInRight 0.25s ease-out",
        "shrink-x": "shrinkX 5s linear forwards",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
        "progress-bar": "progressBar 1.5s ease-in-out infinite",
        "progress-segment": "progressSegment 0.4s cubic-bezier(0.22,1,0.36,1) forwards",
        "shimmer": "shimmer 2s linear infinite",
        "count-up": "countUp 0.2s ease-out forwards",
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
        progressSegment: {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "5%": { opacity: "1" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 50%" },
          "100%": { backgroundPosition: "-200% 50%" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
