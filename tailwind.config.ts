import type { Config } from 'tailwindcss'
import preset from './src/tailwind-preset'

// Storybook-only Tailwind config. Consumer apps use `src/tailwind-preset.ts`
// directly — see that file for integration notes.
const config = {
	presets: [preset],
	content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
} satisfies Config

export default config
