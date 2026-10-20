/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: '#ffffff',
        surface: '#f9f9f9',
        raised: '#ffffff',
        border: '#eaeaea',
        rule: '#f3f3f3',
        control: '#d9d9d6',
        ink: {
          DEFAULT: '#1f201d',
          muted: '#52524e',
          subtle: '#595956',
        },
        accent: {
          DEFAULT: '#1b6e66',
          hover: '#15554f',
          light: '#e8f3f1',
          border: '#b8ded9',
        },
        positive: {
          DEFAULT: '#2e7d32',
          bg: '#dcfae5',
          ink: '#04250e',
        },
        negative: {
          DEFAULT: '#b42318',
          bg: '#fdecea',
          ink: '#7a1d14',
        },
        warning: {
          DEFAULT: '#92400e',
          bg: '#fffbeb',
          ink: '#92400e',
        },
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '22px',
        control: '999px',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
}
