import path from 'node:path'
import type { Config } from 'tailwindcss'
import preset from '../src/tailwind-preset'

// design-sync build config: mirrors the consumer-app setup documented in
// README.md (preset + scan the package source), plus the authored preview
// files so their layout glue classes compile too.
const config = {
	presets: [preset],
	content: [
		path.join(__dirname, '../src/**/*.{ts,tsx}'),
		path.join(__dirname, 'previews/**/*.tsx'),
	],
} satisfies Config

export default config
