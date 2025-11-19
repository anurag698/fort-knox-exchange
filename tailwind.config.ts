import type {Config} from 'tailwindcss';

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sora: ["Sora", "sans-serif"],
        outfit: ["Outfit", "sans-serif"],
      },
      colors: {
        // BRAND
        fort: {
          gold: "#CDA349",
          goldLight: "#E8C987",
          blue: "#20AFFF",
          blueRoyal: "#1B4B9C",
        },

        // LIGHT MODE PALETTE
        light: {
          bg: "#F7F9FC",
          card: "#FFFFFF",
          text: "#1A1F2C",
          textSecondary: "#4A5568",
          border: "#E2E8F0",
        },

        // DARK MODE PALETTE
        dark: {
          bg: "#0D111A",
          card: "#131A24",
          text: "#E6EDF3",
          textSecondary: "#A7B3C2",
          border: "#1E2735",
        },
      },
      boxShadow: {
        "fort-glow": "0 0 20px rgba(32, 175, 255, 0.35)",
        "fort-gold": "0 0 18px rgba(205,163,73,0.35)",
      },
      transitionDuration: {
        400: "400ms",
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
