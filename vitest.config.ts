import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html', 'json-summary'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/index.ts'],
		},
	},
})
