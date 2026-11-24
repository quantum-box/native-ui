import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		// 本物のブラウザで動かす検査は vitest.browser.config.ts で別に動かす
		exclude: ['**/node_modules/**', '**/dist/**', 'src/**/*.browser.test.tsx'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'lcov', 'html', 'json-summary'],
			reportsDirectory: './coverage',
			include: ['src/**/*.{ts,tsx}'],
			exclude: ['src/**/*.stories.tsx', 'src/**/*.test.{ts,tsx}', 'src/index.ts'],
		},
	},
})
