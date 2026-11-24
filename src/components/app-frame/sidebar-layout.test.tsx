// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import {
	SidebarPanel,
	SidebarToggle,
	clampSidebarWidth,
	isSidebarToggleShortcut,
	readSidebarLayoutPreference,
	useSidebarLayout,
	writeSidebarLayoutPreference,
} from './sidebar-layout'

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map<string, string>()
	for (const name of Object.keys(initial)) data.set(name, initial[name])
	return {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		data,
	}
}

const key = 'test.sidebar'
const shortcut = {
	altKey: false,
	code: 'KeyB',
	ctrlKey: false,
	key: 'b',
	metaKey: true,
	shiftKey: false,
}

describe('sidebar layout preference', () => {
	it('falls back to open at the default width', () => {
		expect(readSidebarLayoutPreference(key, {}, memoryStorage())).toEqual({
			open: true,
			width: 240,
		})
	})

	it('keeps a hidden sidebar hidden when the old collapsed shape is stored', () => {
		const storage = memoryStorage({
			[key]: JSON.stringify({ collapsed: true, width: 300 }),
		})
		expect(readSidebarLayoutPreference(key, {}, storage)).toEqual({
			open: false,
			width: 300,
		})
	})

	it('round-trips and clamps the width', () => {
		const storage = memoryStorage()
		writeSidebarLayoutPreference(key, { open: false, width: 999 }, {}, storage)
		expect(readSidebarLayoutPreference(key, {}, storage)).toEqual({
			open: false,
			width: 360,
		})
		expect(clampSidebarWidth(10)).toBe(180)
		expect(clampSidebarWidth(Number.NaN)).toBe(240)
	})

	it('ignores broken values', () => {
		const storage = memoryStorage({ [key]: '{not json' })
		expect(readSidebarLayoutPreference(key, {}, storage).open).toBe(true)
	})
})

describe('isSidebarToggleShortcut', () => {
	it('matches ⌘B and Ctrl+B only', () => {
		expect(isSidebarToggleShortcut(shortcut)).toBe(true)
		expect(
			isSidebarToggleShortcut({ ...shortcut, ctrlKey: true, metaKey: false }),
		).toBe(true)
		expect(isSidebarToggleShortcut({ ...shortcut, shiftKey: true })).toBe(false)
		expect(isSidebarToggleShortcut({ ...shortcut, metaKey: false })).toBe(false)
	})
})

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
	act(() => root?.unmount())
	container?.remove()
	root = undefined
	container = undefined
})

function mount(node: ReactNode) {
	container = document.createElement('div')
	document.body.append(container)
	root = createRoot(container)
	act(() => root?.render(node))
}

function button(name: string) {
	const found = document.querySelector<HTMLButtonElement>(
		`button[aria-label="${name}"][aria-keyshortcuts]:not([inert] *)`,
	)
	if (!found) throw new Error(`no button ${name}`)
	return found
}

function Harness() {
	const layout = useSidebarLayout()
	return (
		<>
			<SidebarPanel data-testid='panel' layout={layout}>
				<SidebarToggle layout={layout} />
			</SidebarPanel>
			{layout.open ? null : <SidebarToggle layout={layout} />}
			<input aria-label='field' />
		</>
	)
}

const panel = () =>
	document.querySelector<HTMLDivElement>(
		'[data-testid="panel"]',
	) as HTMLDivElement

describe('SidebarPanel + SidebarToggle', () => {
	it('hides fully and comes back from the outside toggle', () => {
		mount(<Harness />)
		expect(panel().style.width).toBe('240px')

		act(() => button('サイドバーを隠す').click())
		expect(panel().style.width).toBe('0px')
		expect(panel().dataset.state).toBe('closed')
		expect(panel().firstElementChild?.hasAttribute('inert')).toBe(true)

		act(() => button('サイドバーを開く').click())
		expect(panel().style.width).toBe('240px')
	})

	it('toggles with ⌘B but not while typing', () => {
		mount(<Harness />)
		act(() => {
			window.dispatchEvent(new KeyboardEvent('keydown', shortcut))
		})
		expect(panel().dataset.state).toBe('closed')
		const input = document.querySelector('input') as HTMLInputElement
		act(() => {
			input.dispatchEvent(
				new KeyboardEvent('keydown', { ...shortcut, bubbles: true }),
			)
		})
		expect(panel().dataset.state).toBe('closed')
	})
})
