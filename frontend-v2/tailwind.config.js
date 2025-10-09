/** @type {import('tailwindcss').Config} */
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '1.25rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    },
    extend: {
      colors: {
        'bb-primary': '#7C3AED',
        'bb-primary-dark': '#5B21B6',
        'bb-secondary': '#F59E0B',
        'bb-accent': '#10B981',
        'bb-bg-primary': '#0F172A'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(124, 58, 237, 0.45)'
      }
    },
  },
  plugins: [forms, typography],
}
