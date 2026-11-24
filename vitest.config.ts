import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// e2e/ は本物のブラウザで動かす検査（playwright test で動かす）
		exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html', 'json-summary'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/index.ts'],
		},
	},
})
