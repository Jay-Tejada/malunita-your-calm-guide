import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: {
          DEFAULT: "hsl(var(--foreground))",
          soft: "hsl(var(--foreground-soft))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          strong: "hsl(var(--card-strong))",
          foreground: "hsl(var(--card-foreground))",
        },
        orb: {
          listening: "hsl(var(--orb-listening))",
          responding: "hsl(var(--orb-responding))",
          waveform: "hsl(var(--orb-waveform))",
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        card: "16px",
        modal: "24px",
        button: "12px",
        dropdown: "14px",
        pill: "50px",
      },
      boxShadow: {
        'malunita-card': '0px 1px 3px rgba(0,0,0,0.05), 0px 2px 6px rgba(0,0,0,0.04)',
        'malunita-modal': '0px 4px 12px rgba(0,0,0,0.08)',
        'malunita-card-hover': '0px 2px 4px rgba(0,0,0,0.06), 0px 3px 8px rgba(0,0,0,0.05)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(circle, var(--tw-gradient-stops))',
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "slide-in-left": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "100%": {
            transform: "translateX(0)",
            opacity: "1",
          },
        },
        "slide-out-left": {
          "0%": {
            transform: "translateX(0)",
            opacity: "1",
          },
          "100%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
        },
        "float-idle": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-6px)",
          },
        },
        "bounce-excited": {
          "0%, 100%": {
            transform: "translateY(0px) scale(1) rotate(0deg)",
          },
          "25%": {
            transform: "translateY(-12px) scale(1.05) rotate(-5deg)",
          },
          "75%": {
            transform: "translateY(-6px) scale(1.02) rotate(5deg)",
          },
        },
        "sway-curious": {
          "0%, 100%": {
            transform: "translateY(0px) rotate(-3deg)",
          },
          "33%": {
            transform: "translateY(-4px) rotate(3deg)",
          },
          "66%": {
            transform: "translateY(0px) rotate(-3deg)",
          },
        },
        "float-sleepy": {
          "0%, 100%": {
            transform: "translateY(0px)",
            opacity: "1",
          },
          "50%": {
            transform: "translateY(2px)",
            opacity: "0.95",
          },
        },
        "fade-in": {
          "0%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-out": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(10px)",
          },
        },
        "scale-in": {
          "0%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
          "100%": {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "scale-out": {
          "0%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "scale(0.95)",
          },
        },
        "slide-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-down": {
          "0%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
        },
        "pulse-opacity": {
          "0%, 100%": {
            opacity: "0.4",
          },
          "50%": {
            opacity: "1",
          },
        },
        "typing-dot": {
          "0%, 100%": {
            opacity: "0.3",
            transform: "translateY(0)",
          },
          "50%": {
            opacity: "1",
            transform: "translateY(-8px)",
          },
        },
        "spin-continuous": {
          "0%": {
            transform: "rotate(0deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        "pulse-scale": {
          "0%, 100%": {
            transform: "scale(1)",
          },
          "50%": {
            transform: "scale(1.05)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "slide-out-left": "slide-out-left 0.3s ease-out",
        "float-idle": "float-idle 2.5s ease-in-out infinite",
        "bounce-excited": "bounce-excited 0.8s ease-in-out infinite",
        "sway-curious": "sway-curious 2s ease-in-out infinite",
        "float-sleepy": "float-sleepy 3s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "scale-out": "scale-out 0.2s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "slide-down": "slide-down 0.3s ease-out",
        "pulse-opacity": "pulse-opacity 2s ease-in-out infinite",
        "pulse-scale": "pulse-scale 2s ease-in-out infinite",
        "typing-dot": "typing-dot 0.6s ease-in-out infinite",
        "spin-continuous": "spin-continuous 20s linear infinite",
      },
      transitionDuration: {
        '2000': '2000ms',
        '3000': '3000ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
