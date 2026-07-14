import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const host = process.env.TAURI_DEV_HOST
const tauriPlatform = process.env.TAURI_ENV_PLATFORM
const isTauriBuild = Boolean(tauriPlatform)

export default defineConfig({
	base: isTauriBuild ? './' : '/',
	build: {
		minify: process.env.TAURI_ENV_DEBUG ? false : 'esbuild',
		sourcemap: Boolean(process.env.TAURI_ENV_DEBUG),
		target: isTauriBuild
			? tauriPlatform === 'windows'
				? 'chrome105'
				: 'safari13'
			: 'es2022',
	},
	clearScreen: false,
	envPrefix: ['VITE_', 'TAURI_ENV_*'],
	plugins: [react()],
	server: {
		hmr: host
			? {
					host,
					port: 1421,
					protocol: 'ws',
				}
			: undefined,
		host: host || false,
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ['**/src-tauri/**'],
		},
	},
})
