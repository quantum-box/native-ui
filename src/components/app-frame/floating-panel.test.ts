import { describe, expect, it } from 'vitest'
import { clampFloatingPanelSize } from './floating-panel'

describe('clampFloatingPanelSize', () => {
	const viewport = { width: 1200, height: 800 }

	it('keeps the panel above its minimum size', () => {
		expect(clampFloatingPanelSize({ width: 10, height: 10 }, viewport)).toEqual(
			{
				width: 320,
				height: 240,
			},
		)
	})

	it('keeps the panel inside the viewport', () => {
		expect(
			clampFloatingPanelSize({ width: 5000, height: 5000 }, viewport),
		).toEqual({ width: 1184, height: 752 })
	})

	it('rounds a dragged size', () => {
		expect(
			clampFloatingPanelSize({ width: 400.6, height: 300.2 }, viewport),
		).toEqual({ width: 401, height: 300 })
	})
})
