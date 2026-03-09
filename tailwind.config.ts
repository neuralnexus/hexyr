import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        surface: {
          950: '#07090d',
          900: '#0d1117',
          800: '#121a23',
          700: '#182334',
        },
        accent: {
          cyan: '#34d6ff',
          violet: '#7a7dff',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(52, 214, 255, 0.25), 0 12px 45px rgba(52, 214, 255, 0.16)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 280ms ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
