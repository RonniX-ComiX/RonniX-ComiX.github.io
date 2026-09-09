/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./context/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./locales/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        red: {
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        }
      },
      fontFamily: {
        // *-fb = metrisch angepasste local()-Fallbacks (siehe @font-face in index.css):
        // Swap ohne Layout-Shift, danach Systemschrift ohne Webfont-Download.
        'retro': ['Bangers', "'Bangers-fb'", '"Arial Black"', 'Impact', 'sans-serif'],
        'gaming': ['"Press Start 2P"', "'PS2P-fb'", '"Courier New"', 'monospace'],
        'sans': ['Roboto', "'Roboto-fb'", 'Arial', '"Helvetica Neue"', 'sans-serif'],
        'serif': ['Georgia', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 1s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        }
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}