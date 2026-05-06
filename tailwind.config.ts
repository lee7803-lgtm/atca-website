import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#080808',
        charcoal: '#121212',
        gold: '#d4af37',
        amber: '#f5d67b'
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"PingFang SC"', '"Helvetica Neue"', 'Arial', 'sans-serif']
      },
      boxShadow: {
        glow: '0 0 40px rgba(212, 175, 55, 0.2)'
      }
    }
  },
  plugins: []
};

export default config;
