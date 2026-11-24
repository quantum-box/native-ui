// @vitest-environment jsdom
import { act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

import { KeyboardShortcutsDialog, splitShortcut } from './keyboard-shortcuts'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
let container: HTMLDivElement | undefined

afterEach(() => {
	act(() => root?.unmount())
	container?.remove()
})

describe('splitShortcut', () => {
	it('splits modifiers from the key', () => {
		expect(splitShortcut('⌘B')).toEqual(['⌘', 'B'])
		expect(splitShortcut('⌘⇧J')).toEqual(['⌘', '⇧', 'J'])
		expect(splitShortcut('⌥1')).toEqual(['⌥', '1'])
		expect(splitShortcut('Esc')).toEqual(['Esc'])
		expect(splitShortcut('⌘/')).toEqual(['⌘', '/'])
	})
})

describe('KeyboardShortcutsDialog', () => {
	it('lists every group, label and key', () => {
		container = document.createElement('div')
		document.body.append(container)
		root = createRoot(container)
		act(() =>
			root?.render(
				<KeyboardShortcutsDialog
					groups={[
						{
							title: '画面の移動',
							items: [
								{ label: 'メニューを検索', shortcuts: ['⌘K'] },
								{
									label: '業務システムへ移る',
									separator: '〜',
									shortcuts: ['⌥1', '⌥9'],
								},
							],
						},
					]}
					onOpenChange={() => {}}
					open
				/>,
			),
		)
		const text = document.body.textContent ?? ''
		expect(text).toContain('キーボードショートカット')
		expect(text).toContain('画面の移動')
		expect(text).toContain('メニューを検索')
		expect(text).toContain('〜')
		const keys = Array.from(document.body.querySelectorAll('kbd')).map(
			node => node.textContent,
		)
		expect(keys).toEqual(['⌘', 'K', '⌥', '1', '⌥', '9'])
	})
})
