/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ground: '#eef2f7',
        surface: '#f4f7fb',
        raised: '#ffffff',
        border: 'rgba(255, 255, 255, 0.7)',
        rule: 'rgba(166, 178, 198, 0.25)',
        control: '#dce4ef',
        ink: {
          DEFAULT: '#1e293b',
          muted: '#475569',
          subtle: '#64748b',
        },
        accent: {
          DEFAULT: '#0d9488',
          hover: '#0f766e',
          light: '#ccfbf1',
          border: '#99f6e4',
        },
        indigo: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          light: '#e0e7ff',
        },
        positive: {
          DEFAULT: '#059669',
          bg: '#d1fae5',
          ink: '#064e3b',
        },
        negative: {
          DEFAULT: '#e11d48',
          bg: '#ffe4e6',
          ink: '#881337',
        },
        warning: {
          DEFAULT: '#d97706',
          bg: '#fef3c7',
          ink: '#78350f',
        },
      },
      boxShadow: {
        'clay': '8px 8px 18px rgba(166, 178, 198, 0.45), -8px -8px 18px rgba(255, 255, 255, 0.95), inset 1px 1px 2px rgba(255, 255, 255, 0.9), inset -1px -1px 2px rgba(166, 178, 198, 0.2)',
        'clay-sm': '4px 4px 10px rgba(166, 178, 198, 0.4), -4px -4px 10px rgba(255, 255, 255, 0.9), inset 1px 1px 1.5px rgba(255, 255, 255, 0.8), inset -1px -1px 1.5px rgba(166, 178, 198, 0.15)',
        'clay-lg': '12px 12px 28px rgba(166, 178, 198, 0.5), -12px -12px 28px rgba(255, 255, 255, 0.95), inset 2px 2px 3px rgba(255, 255, 255, 0.9), inset -2px -2px 3px rgba(166, 178, 198, 0.2)',
        'clay-inset': 'inset 4px 4px 8px rgba(166, 178, 198, 0.5), inset -4px -4px 8px rgba(255, 255, 255, 0.85)',
        'clay-inset-sm': 'inset 2px 2px 5px rgba(166, 178, 198, 0.45), inset -2px -2px 5px rgba(255, 255, 255, 0.8)',
        'clay-btn': '5px 5px 12px rgba(13, 148, 136, 0.35), -4px -4px 10px rgba(255, 255, 255, 0.8), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.4), inset -1.5px -1.5px 3px rgba(0, 0, 0, 0.15)',
        'clay-btn-active': '2px 2px 5px rgba(13, 148, 136, 0.3), inset 2px 2px 5px rgba(0, 0, 0, 0.25)',
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        card: '24px',
        control: '999px',
      },
      screens: {
        xs: '420px',
      },
    },
  },
  plugins: [],
}
