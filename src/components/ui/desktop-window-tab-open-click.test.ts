import { describe, expect, it } from 'vitest'

import { isDesktopWindowTabOpenClick } from './desktop-window-tab-open-click'

describe('isDesktopWindowTabOpenClick', () => {
	it('accepts Command+click and Control+click on the primary button', () => {
		expect(
			isDesktopWindowTabOpenClick({
				button: 0,
				metaKey: true,
				ctrlKey: false,
			}),
		).toBe(true)
		expect(
			isDesktopWindowTabOpenClick({
				button: 0,
				metaKey: false,
				ctrlKey: true,
			}),
		).toBe(true)
	})

	it('ignores normal, secondary, and Alt-modified clicks', () => {
		expect(
			isDesktopWindowTabOpenClick({
				button: 0,
				metaKey: false,
				ctrlKey: false,
			}),
		).toBe(false)
		expect(
			isDesktopWindowTabOpenClick({
				button: 1,
				metaKey: true,
				ctrlKey: false,
			}),
		).toBe(false)
		expect(
			isDesktopWindowTabOpenClick({
				button: 0,
				metaKey: true,
				ctrlKey: false,
				altKey: true,
			}),
		).toBe(false)
	})
})
