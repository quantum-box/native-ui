import type { Config } from 'tailwindcss'

import nativeUiPreset from '../../src/tailwind-preset'

const config = {
	presets: [nativeUiPreset],
	content: ['./index.html', './src/**/*.{ts,tsx}', '../../src/**/*.{ts,tsx}'],
} satisfies Config

export default config
