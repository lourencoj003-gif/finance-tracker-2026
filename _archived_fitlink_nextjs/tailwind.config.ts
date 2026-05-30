import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  '#0a0a0a',
        secondary:   '#1a1a1a',
        primary:     '#a3f510',
        'primary-dark': '#8ad40e',
        muted:       '#888888',
        border:      'rgba(255,255,255,0.08)',
      },
      fontFamily: {
        heading: ['Barlow Condensed', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'ring-fill': 'ring-fill 1s ease-out forwards',
        'slide-up':  'slide-up 0.4s ease-out',
      },
      keyframes: {
        'ring-fill': {
          from: { 'stroke-dashoffset': '251' },
          to:   {},
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
