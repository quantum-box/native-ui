import { defineConfig } from 'tsup'

/**
 * Library build (`pnpm build:lib`).
 *
 * Emits ESM + CJS with bundled .d.ts into `dist/`, so consumers no longer
 * transpile our sources — which also stops React 19 consumers from
 * type-checking our React 18-typed source files. `pnpm build` remains the
 * Storybook build that the Cloud App deployment consumes.
 */
export default defineConfig({
	entry: ['src/index.ts', 'src/tailwind-preset.ts'],
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: true,
	clean: true,
	outDir: 'dist',
})
