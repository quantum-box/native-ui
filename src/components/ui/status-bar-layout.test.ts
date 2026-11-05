import { describe, expect, it } from 'vitest'
import {
	type StatusBarLayoutItem,
	parseStatusBarLayout,
	reorderStatusBarLayout,
} from './status-bar-layout'

const DEFAULTS: StatusBarLayoutItem[] = [
	{ id: 'agent', visible: true, side: 'left' },
	{ id: 'connection', visible: true, side: 'left' },
	{ id: 'help', visible: true, side: 'right' },
	{ id: 'account', visible: true, side: 'right' },
]

describe('status bar layout', () => {
	it('restores defaults for missing, malformed, or non-array data', () => {
		for (const value of [null, '{', 'null', '{}']) {
			expect(parseStatusBarLayout(value, DEFAULTS)).toEqual(DEFAULTS)
		}
	})

	it('keeps saved order and placement, appends new defaults, and shows required items', () => {
		const items = parseStatusBarLayout(
			JSON.stringify([
				{ id: 'help', visible: false, side: 'left' },
				{ id: 'shortcut:/settings', visible: true, side: 'right' },
				{ id: 'account', visible: false, side: 'left' },
				{ id: 'help', visible: true, side: 'right' },
				{ id: 'broken', visible: 'yes', side: 'left' },
			]),
			DEFAULTS,
			['account'],
		)
		expect(items).toEqual([
			{ id: 'help', visible: false, side: 'left' },
			{ id: 'shortcut:/settings', visible: true, side: 'right' },
			{ id: 'account', visible: true, side: 'left' },
			{ id: 'agent', visible: true, side: 'left' },
			{ id: 'connection', visible: true, side: 'left' },
		])
	})

	it('moves an item next to the target and onto its side', () => {
		const items = reorderStatusBarLayout(DEFAULTS, 'agent', 'help', true)
		expect(items.map(item => [item.id, item.side])).toEqual([
			['connection', 'left'],
			['help', 'right'],
			['agent', 'right'],
			['account', 'right'],
		])
		expect(reorderStatusBarLayout(DEFAULTS, 'agent', 'agent', false)).toBe(
			DEFAULTS,
		)
		expect(reorderStatusBarLayout(DEFAULTS, 'missing', 'help', false)).toBe(
			DEFAULTS,
		)
	})
})
