// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from './command'

// 検索して選ぶ一覧（Command）が、cmdk のときと同じ使い方・同じ動きになることを確かめる。
// （同じテストを cmdk の Command でも走らせ、すべて通ることを確かめた）

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
beforeAll(() => {
	vi.stubGlobal(
		'ResizeObserver',
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	)
	Element.prototype.scrollIntoView = vi.fn()
})
afterEach(async () => {
	await act(async () => root?.unmount())
	root = undefined
	document.body.innerHTML = ''
})
async function render(node: ReactNode) {
	const el = document.createElement('div')
	document.body.appendChild(el)
	root = createRoot(el)
	await act(async () => root?.render(node))
	await act(async () => new Promise(r => setTimeout(r, 0)))
	return el
}
const input = () => document.querySelector('[cmdk-input]') as HTMLInputElement
async function type(text: string) {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		'value',
	)?.set
	await act(async () => {
		setter?.call(input(), text)
		input().dispatchEvent(new Event('input', { bubbles: true }))
	})
	await act(async () => new Promise(r => setTimeout(r, 0)))
}
async function key(name: string, init: KeyboardEventInit = {}) {
	await act(async () => {
		input().dispatchEvent(
			new KeyboardEvent('keydown', {
				key: name,
				bubbles: true,
				cancelable: true,
				...init,
			}),
		)
	})
}
/** 見えている項目の文字 */
const shown = () =>
	Array.from(document.querySelectorAll('[cmdk-item]')).map(el => el.textContent)
/** 選んでいる項目の文字 */
const selected = () =>
	document.querySelector('[cmdk-item][data-selected="true"]')?.textContent

function Fruits({
	onSelect = () => {},
	loop,
}: {
	onSelect?: (value: string) => void
	loop?: boolean
}) {
	return (
		<Command loop={loop}>
			<CommandInput placeholder='探す' />
			<CommandList>
				<CommandEmpty>見つかりません</CommandEmpty>
				<CommandGroup heading='果物'>
					<CommandItem value='apple pie' onSelect={onSelect}>
						Apple pie
					</CommandItem>
					<CommandItem value='banana' disabled onSelect={onSelect}>
						Banana
					</CommandItem>
					<CommandItem value='pineapple' onSelect={onSelect}>
						Pineapple
					</CommandItem>
					<CommandItem value='grape' keywords={['ぶどう']} onSelect={onSelect}>
						Grape
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading='野菜'>
					<CommandItem value='carrot' onSelect={onSelect}>
						Carrot
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	)
}

describe('Command（cmdk と同じ動き）', () => {
	it('はじめは全部を出し、先頭を選ぶ。読み上げの役割が付く', async () => {
		await render(<Fruits />)
		expect(shown()).toEqual([
			'Apple pie',
			'Banana',
			'Pineapple',
			'Grape',
			'Carrot',
		])
		expect(selected()).toBe('Apple pie')
		expect(input().getAttribute('role')).toBe('combobox')
		const list = document.querySelector('[cmdk-list]') as HTMLElement
		expect(list.getAttribute('role')).toBe('listbox')
		expect(input().getAttribute('aria-controls')).toBe(list.id)
		const active = document.querySelector(
			'[data-selected="true"]',
		) as HTMLElement
		expect(active.getAttribute('role')).toBe('option')
		expect(input().getAttribute('aria-activedescendant')).toBe(active.id)
		expect(document.querySelector('[cmdk-empty]')).toBeNull()
	})

	it('打つと絞り、合う物を選ぶ。合う物の無い群と区切りは隠す', async () => {
		await render(<Fruits />)
		await type('pine')
		expect(shown()).toEqual(['Pineapple'])
		expect(selected()).toBe('Pineapple')
		const vegetables = Array.from(
			document.querySelectorAll('[cmdk-group]'),
		).find(group => group.textContent?.includes('野菜')) as HTMLElement
		expect(vegetables.hidden).toBe(true)
		expect(document.querySelector('[cmdk-separator]')).toBeNull()
	})

	it('キーワードでも探せる', async () => {
		await render(<Fruits />)
		await type('ぶどう')
		expect(shown()).toEqual(['Grape'])
		expect(selected()).toBe('Grape')
	})

	it('先頭で合う物を、途中で合う物より上に並べて選ぶ', async () => {
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandItem value='green apple'>Green apple</CommandItem>
					<CommandItem value='apple juice'>Apple juice</CommandItem>
				</CommandList>
			</Command>,
		)
		await type('apple')
		expect(selected()).toBe('Apple juice')
		await key('ArrowDown')
		expect(selected()).toBe('Green apple')
	})

	it('合う物が無ければ Empty を出す', async () => {
		await render(<Fruits />)
		await type('zzz')
		expect(shown()).toEqual([])
		expect(document.querySelector('[cmdk-empty]')?.textContent).toBe(
			'見つかりません',
		)
	})

	it('↓↑・End・Home で動き、使えない項目は飛ばす', async () => {
		await render(<Fruits />)
		await key('ArrowDown')
		expect(selected()).toBe('Pineapple')
		await key('ArrowDown')
		expect(selected()).toBe('Grape')
		await key('End')
		expect(selected()).toBe('Carrot')
		// 端では止まる（loop が無いとき）
		await key('ArrowDown')
		expect(selected()).toBe('Carrot')
		await key('Home')
		expect(selected()).toBe('Apple pie')
		await key('ArrowUp')
		expect(selected()).toBe('Apple pie')
		await key('n', { ctrlKey: true })
		expect(selected()).toBe('Pineapple')
		await key('k', { ctrlKey: true })
		expect(selected()).toBe('Apple pie')
	})

	it('loop なら、端で反対の端へ回る', async () => {
		await render(<Fruits loop />)
		await key('ArrowUp')
		expect(selected()).toBe('Carrot')
		await key('ArrowDown')
		expect(selected()).toBe('Apple pie')
	})

	it('Enter と押すで、選んだ項目の onSelect を値と一緒に呼ぶ', async () => {
		const onSelect = vi.fn()
		await render(<Fruits onSelect={onSelect} />)
		await key('ArrowDown')
		await key('Enter')
		expect(onSelect).toHaveBeenLastCalledWith('pineapple')
		const carrot = Array.from(document.querySelectorAll('[cmdk-item]')).find(
			el => el.textContent === 'Carrot',
		) as HTMLElement
		await act(async () => carrot.click())
		expect(onSelect).toHaveBeenLastCalledWith('carrot')
		// 使えない項目は押しても呼ばない
		const banana = Array.from(document.querySelectorAll('[cmdk-item]')).find(
			el => el.textContent === 'Banana',
		) as HTMLElement
		expect(banana.getAttribute('data-disabled')).toBe('true')
		await act(async () => banana.click())
		expect(onSelect).toHaveBeenCalledTimes(2)
	})

	it('選んでいる項目を外で持てる（value・onValueChange）', async () => {
		function Controlled() {
			const [value, setValue] = useState('grape')
			return (
				<>
					<output>{value}</output>
					<Command value={value} onValueChange={setValue}>
						<CommandInput />
						<CommandList>
							<CommandItem value='apple'>Apple</CommandItem>
							<CommandItem value='grape'>Grape</CommandItem>
							<CommandItem value='lemon'>Lemon</CommandItem>
						</CommandList>
					</Command>
				</>
			)
		}
		const el = await render(<Controlled />)
		expect(selected()).toBe('Grape')
		await key('ArrowDown')
		expect(el.querySelector('output')?.textContent).toBe('lemon')
		expect(selected()).toBe('Lemon')
	})

	it('shouldFilter={false} なら絞らず、検索の文字は onValueChange で受け取る', async () => {
		const onSearch = vi.fn()
		await render(
			<Command shouldFilter={false}>
				<CommandInput onValueChange={onSearch} />
				<CommandList>
					<CommandItem onSelect={() => {}}>甲</CommandItem>
					<CommandItem onSelect={() => {}}>乙</CommandItem>
				</CommandList>
			</Command>,
		)
		await type('丙')
		expect(onSearch).toHaveBeenLastCalledWith('丙')
		expect(shown()).toEqual(['甲', '乙'])
		expect(selected()).toBe('甲')
	})

	it('値を省くと中の文字が値になり、onSelect に渡る', async () => {
		const onSelect = vi.fn()
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandItem onSelect={onSelect}>山田商店</CommandItem>
					<CommandItem onSelect={onSelect}>田中商会</CommandItem>
				</CommandList>
			</Command>,
		)
		await type('田中')
		expect(shown()).toEqual(['田中商会'])
		await key('Enter')
		expect(onSelect).toHaveBeenLastCalledWith('田中商会')
	})

	it('群の中の forceMount の項目は、ほかが合わなくても群ごと出す', async () => {
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandGroup heading='候補'>
						<CommandItem value='a'>Alpha</CommandItem>
						<CommandItem value='__more' forceMount>
							続きを読む
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>,
		)
		await type('zzz')
		const group = document.querySelector('[cmdk-group]') as HTMLElement
		expect(group.hidden).toBe(false)
		expect(shown()).toEqual(['続きを読む'])
	})

	it('項目に id を渡しても、↓ で移れて、読み上げはその id を指す', async () => {
		const onSelect = vi.fn()
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandItem value='a'>Alpha</CommandItem>
					<CommandItem id='custom-beta' value='b' onSelect={onSelect}>
						Beta
					</CommandItem>
				</CommandList>
			</Command>,
		)
		await key('ArrowDown')
		expect(selected()).toBe('Beta')
		expect(input().getAttribute('aria-activedescendant')).toBe('custom-beta')
		await key('Enter')
		expect(onSelect).toHaveBeenCalledWith('b')
	})

	it('群に forceMount を付けると、合わなくても群の中の項目を出す', async () => {
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandGroup heading='いつも出す' forceMount>
						<CommandItem value='new'>新しく作る</CommandItem>
					</CommandGroup>
					<CommandGroup heading='候補'>
						<CommandItem value='alpha'>Alpha</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>,
		)
		await type('zzz')
		expect(shown()).toEqual(['新しく作る'])
	})

	it('検索で全部が隠れたら、読み上げは何も指さない', async () => {
		await render(<Fruits />)
		expect(input().getAttribute('aria-activedescendant')).toBeTruthy()
		await type('zzz')
		expect(shown()).toEqual([])
		expect(input().hasAttribute('aria-activedescendant')).toBe(false)
		// 戻すと、また先頭を指す
		await type('')
		const active = document.querySelector(
			'[data-selected="true"]',
		) as HTMLElement
		expect(input().getAttribute('aria-activedescendant')).toBe(active.id)
	})

	it('値を中の文字から取る項目でも、はじめに選んでいる値を変えない', async () => {
		await render(
			<Command defaultValue='Beta'>
				<CommandInput />
				<CommandList>
					<CommandItem>Alpha</CommandItem>
					<CommandItem>Beta</CommandItem>
				</CommandList>
			</Command>,
		)
		expect(selected()).toBe('Beta')

		await act(async () => root?.unmount())
		const onValueChange = vi.fn()
		await render(
			<Command value='Beta' onValueChange={onValueChange}>
				<CommandInput />
				<CommandList>
					<CommandItem>Alpha</CommandItem>
					<CommandItem>Beta</CommandItem>
				</CommandList>
			</Command>,
		)
		expect(selected()).toBe('Beta')
		expect(onValueChange).not.toHaveBeenCalled()
	})

	it('指を動かさずに押しても（指で触れる・読み上げ）、押した項目を選んでから知らせる', async () => {
		let activeAtSelect: string | null | undefined
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandItem value='a'>Alpha</CommandItem>
					<CommandItem
						value='b'
						onSelect={() => {
							activeAtSelect = selected()
						}}
					>
						Beta
					</CommandItem>
				</CommandList>
			</Command>,
		)
		expect(selected()).toBe('Alpha')
		const beta = Array.from(document.querySelectorAll('[cmdk-item]')).find(
			el => el.textContent === 'Beta',
		) as HTMLElement
		await act(async () => beta.click())
		expect(selected()).toBe('Beta')
		expect(input().getAttribute('aria-activedescendant')).toBe(beta.id)
		// ↓ は押した項目から動く
		await key('ArrowUp')
		expect(selected()).toBe('Alpha')
		expect(activeAtSelect).toBeDefined()
	})

	it('forceMount の項目は、合わなくても出す', async () => {
		await render(
			<Command>
				<CommandInput />
				<CommandList>
					<CommandItem value='a'>Alpha</CommandItem>
					<CommandItem value='__more' forceMount>
						続きを読む
					</CommandItem>
				</CommandList>
			</Command>,
		)
		await type('zzz')
		expect(shown()).toEqual(['続きを読む'])
	})
})
