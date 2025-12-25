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
        // LandGuard AI Light Green Theme
        'lg-green': '#22C55E',
        'lg-green-dark': '#16A34A',
        'lg-green-light': '#86EFAC',
        'lg-red': '#EF4444',
        'lg-amber': '#F59E0B',
        'lg-safe': '#22C55E',
        'lg-bg': '#FFFFFF',
        'lg-bg-alt': '#F0FDF4',
        'lg-card': '#FFFFFF',
        'lg-text': '#1F2937',
        'lg-text-muted': '#6B7280',
        'lg-border': '#E5E7EB',
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
