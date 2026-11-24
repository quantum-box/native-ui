import { defineConfig, devices } from '@playwright/test'

// 本物のブラウザ（Chromium）で、組み上げた Storybook の部品を動かして確かめる。
// jsdom では分からない、閉じる動きや画面に残る物を見る。`pnpm test:browser` で動かす
const port = 6017

export default defineConfig({
	testDir: './e2e',
	outputDir: './e2e/.results',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: `http://127.0.0.1:${port}`,
		...devices['Desktop Chrome'],
	},
	webServer: {
		// Storybook を組み上げてから、その中身をそのまま配る
		command: `pnpm build --quiet && pnpm exec vite preview --outDir storybook-static --host 127.0.0.1 --port ${port} --strictPort`,
		url: `http://127.0.0.1:${port}/iframe.html`,
		reuseExistingServer: !process.env.CI,
		timeout: 240_000,
	},
})
