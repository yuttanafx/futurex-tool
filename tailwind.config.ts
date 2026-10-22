import type { Config } from 'tailwindcss'
export default { content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'], theme: { extend: { colors: { ink: 'rgb(var(--ink) / <alpha-value>)', mist: 'rgb(var(--mist) / <alpha-value>)', brand:'#0E7C66', sun:'#E8B04A' } } } } satisfies Config
