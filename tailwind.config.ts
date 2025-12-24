import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'lg-blue': '#0A5CFF',
        'lg-green': '#2ECC71',
        'lg-red': '#E74C3C',
        'lg-amber': '#F39C12',
        'lg-safe': '#27AE60',
        'lg-dark': '#0B1220',
        'lg-darker': '#060d17',
        'lg-light': '#F5F7FA',
        'lg-silver': '#C9D1D9',
        'lg-muted': '#8b949e',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config

