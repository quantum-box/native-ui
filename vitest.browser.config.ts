import { defineConfig } from 'vitest/config'

// 本物のブラウザ（Chromium）で動かす検査。jsdom では分からない、
// 閉じる動きや、画面に残る物を確かめる。`pnpm test:browser` で動かす
export default defineConfig({
	test: {
		include: ['src/**/*.browser.test.tsx'],
		browser: {
			enabled: true,
			provider: 'playwright',
			headless: true,
			screenshotFailures: false,
			instances: [{ browser: 'chromium' }],
		},
	},
})
