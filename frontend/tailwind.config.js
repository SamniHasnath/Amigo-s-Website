/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Colours come from CSS variables (src/index.css), so the light cream theme and the
        // dark "kraft" panels (.theme-dark) share the same class names.
        espresso: { DEFAULT: 'rgb(var(--surface) / <alpha-value>)', 800: 'rgb(var(--page) / <alpha-value>)', 700: 'rgb(var(--surface-2) / <alpha-value>)', 600: 'rgb(var(--surface-3) / <alpha-value>)' },
        crema: { DEFAULT: 'rgb(var(--ink) / <alpha-value>)', 200: 'rgb(var(--ink-2) / <alpha-value>)', 400: 'rgb(var(--ink-3) / <alpha-value>)' },
        caramel: { DEFAULT: 'rgb(var(--accent) / <alpha-value>)', 600: 'rgb(var(--accent-2) / <alpha-value>)' },
        orange: { DEFAULT: '#C77A35' },
        mint: 'rgb(var(--ok) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        script: ['Caveat', 'cursive'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: { glow: '0 0 60px -10px rgba(199,122,53,.55)', 'glow-sm': '0 0 24px -4px rgba(199,122,53,.6)' },
    },
  },
  plugins: [],
}
