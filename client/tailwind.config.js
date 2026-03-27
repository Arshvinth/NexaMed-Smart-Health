import colors from "tailwindcss/colors";

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Keep Tailwind neutrals available for UI backgrounds
        neutral: colors.slate, // Slate is cleaner for tech/transit than pure neutral

        // Brand Colors
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae2fd',
          300: '#7ccbfd',
          400: '#38acf8',
          500: '#0ea5e9', // Trustworthy Sky Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Electric Indigo - Great for "Current Route" or "Active"
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Optimized for traffic status (Go/Ready)
        success: {
          50: '#f0fdf4',
          500: '#22c55e', // Traffic Green
          900: '#14532d',
        },
        // Optimized for caution/congestion
        warning: {
          50: '#fffbeb',
          500: '#f59e0b', // Amber/Yellow
          900: '#78350f',
        },
        // Optimized for road closures/errors
        danger: {
          50: '#fef2f2',
          500: '#ef4444', // Stop Red
          900: '#7f1d1d',
        },
        // Useful for road networks/dark mode
        transit: {
          dark: '#1e293b',
          muted: '#64748b',
          accent: '#334155',
        }
      },
      fontFamily: {
        // 'Inter' is excellent for legibility in small sizes (ETA, speed, distance)
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        // Floating Action Button (FAB) shadow for map interactions
        'fab': '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}