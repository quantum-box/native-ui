// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Checkbox } from './checkbox'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../layout/collapsible'
import { Label } from '../basics/label'
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from './select'
import { Switch } from './switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../layout/tabs'

// 入力の部品（Checkbox・Switch・Select・Tabs・Collapsible）が、
// Radix のときと同じ使い方・同じ動きになることを確かめる。

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
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
	Element.prototype.setPointerCapture = vi.fn()
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
	return el
}
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms))
async function press(el: Element) {
	const Pointer = (globalThis.PointerEvent ?? MouseEvent) as typeof MouseEvent
	const init = {
		bubbles: true,
		cancelable: true,
		button: 0,
		pointerType: 'mouse',
	}
	await act(async () => {
		el.dispatchEvent(new Pointer('pointerdown', init))
		el.dispatchEvent(new MouseEvent('mousedown', init))
		;(el as HTMLElement).focus?.()
		el.dispatchEvent(new Pointer('pointerup', init))
		el.dispatchEvent(new MouseEvent('mouseup', init))
		el.dispatchEvent(new MouseEvent('click', init))
		await wait()
	})
}
async function key(
	key: string,
	target: Element | null = document.activeElement,
) {
	await act(async () => {
		;(target ?? document.body).dispatchEvent(
			new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
		)
		await wait()
	})
}

describe('Checkbox', () => {
	it('<button role="checkbox"> を描き、押すと onCheckedChange(true) を呼ぶ', async () => {
		const onCheckedChange = vi.fn()
		const el = await render(
			<Checkbox
				id='agree'
				aria-label='同意する'
				checked={false}
				onCheckedChange={onCheckedChange}
			/>,
		)
		const box = el.querySelector('[role="checkbox"]') as HTMLButtonElement
		expect(box.tagName).toBe('BUTTON')
		expect(box.type).toBe('button')
		expect(box.id).toBe('agree')
		expect(box.getAttribute('aria-checked')).toBe('false')
		expect(box.getAttribute('data-state')).toBe('unchecked')
		await press(box)
		expect(onCheckedChange).toHaveBeenCalledWith(true)
	})

	it('checked と indeterminate で aria-checked と data-state が変わり、印が出る', async () => {
		const el = await render(
			<>
				<Checkbox aria-label='a' checked />
				<Checkbox aria-label='b' checked='indeterminate' />
			</>,
		)
		const [a, b] = Array.from(
			el.querySelectorAll('[role="checkbox"]'),
		) as HTMLElement[]
		expect(a.getAttribute('aria-checked')).toBe('true')
		expect(a.getAttribute('data-state')).toBe('checked')
		expect(a.querySelector('svg')).not.toBeNull()
		expect(b.getAttribute('aria-checked')).toBe('mixed')
		expect(b.getAttribute('data-state')).toBe('indeterminate')
	})

	it('<Label htmlFor> を押しても切り替わる', async () => {
		function Demo() {
			const [checked, setChecked] = useState(false)
			return (
				<>
					<Checkbox
						id='c1'
						checked={checked}
						onCheckedChange={v => setChecked(v === true)}
					/>
					<Label htmlFor='c1'>同意する</Label>
				</>
			)
		}
		const el = await render(<Demo />)
		await act(async () => {
			;(el.querySelector('label') as HTMLLabelElement).click()
			await wait()
		})
		expect(
			el.querySelector('[role="checkbox"]')?.getAttribute('aria-checked'),
		).toBe('true')
	})

	it('disabled なら押せず、disabled 属性が付く', async () => {
		const onCheckedChange = vi.fn()
		const el = await render(
			<Checkbox aria-label='x' disabled onCheckedChange={onCheckedChange} />,
		)
		const box = el.querySelector('[role="checkbox"]') as HTMLButtonElement
		expect(box.disabled).toBe(true)
		await press(box)
		expect(onCheckedChange).not.toHaveBeenCalled()
	})
})

describe('Switch', () => {
	it('<button role="switch"> を描き、押すと切り替わる。つまみにも data-state', async () => {
		function Demo() {
			const [on, setOn] = useState(false)
			return <Switch aria-label='通知' checked={on} onCheckedChange={setOn} />
		}
		const el = await render(<Demo />)
		const sw = el.querySelector('[role="switch"]') as HTMLButtonElement
		expect(sw.tagName).toBe('BUTTON')
		expect(sw.getAttribute('aria-checked')).toBe('false')
		expect(sw.getAttribute('data-state')).toBe('unchecked')
		await press(sw)
		expect(sw.getAttribute('aria-checked')).toBe('true')
		expect(sw.getAttribute('data-state')).toBe('checked')
		expect(sw.querySelector('span')?.getAttribute('data-state')).toBe('checked')
	})
})

describe('Tabs', () => {
	function Demo(props: { onValueChange?: (v: string) => void }) {
		return (
			<Tabs defaultValue='a' onValueChange={props.onValueChange}>
				<TabsList>
					<TabsTrigger value='a'>一つ目</TabsTrigger>
					<TabsTrigger value='b'>二つ目</TabsTrigger>
					<TabsTrigger value='c' disabled>
						三つ目
					</TabsTrigger>
				</TabsList>
				<TabsContent value='a'>中身 A</TabsContent>
				<TabsContent value='b'>中身 B</TabsContent>
			</Tabs>
		)
	}

	it('読み上げの役割と data-state が付き、選んだ中身だけを出す', async () => {
		const el = await render(<Demo />)
		expect(el.querySelector('[role="tablist"]')).not.toBeNull()
		const tabs = Array.from(
			el.querySelectorAll('[role="tab"]'),
		) as HTMLElement[]
		expect(tabs.map(t => t.getAttribute('aria-selected'))).toEqual([
			'true',
			'false',
			'false',
		])
		expect(tabs.map(t => t.getAttribute('data-state'))).toEqual([
			'active',
			'inactive',
			'inactive',
		])
		const panel = el.querySelector(
			'[role="tabpanel"][data-state="active"]',
		) as HTMLElement
		expect(panel.textContent).toBe('中身 A')
		expect(panel.getAttribute('data-state')).toBe('active')
		expect(tabs[0].getAttribute('aria-controls')).toBe(panel.id)
		expect(el.textContent).not.toContain('中身 B')
	})

	it('押すと onValueChange を呼んで中身が替わる', async () => {
		const onValueChange = vi.fn()
		const el = await render(<Demo onValueChange={onValueChange} />)
		const tabs = Array.from(
			el.querySelectorAll('[role="tab"]'),
		) as HTMLElement[]
		await act(async () => tabs[1].focus())
		await key('Enter', tabs[1])
		await press(tabs[1])
		expect(onValueChange).toHaveBeenCalledWith('b')
		const active = el.querySelector('[role="tabpanel"][data-state="active"]')
		expect(active?.textContent).toBe('中身 B')
	})

	it('右の矢印で次のタブへ動いて選ぶ（使えないタブは飛ばし、端で戻る）', async () => {
		const onValueChange = vi.fn()
		const el = await render(<Demo onValueChange={onValueChange} />)
		const tabs = Array.from(
			el.querySelectorAll('[role="tab"]'),
		) as HTMLElement[]
		await act(async () => tabs[0].focus())
		await key('ArrowRight', tabs[0])
		expect(document.activeElement).toBe(tabs[1])
		expect(onValueChange).toHaveBeenLastCalledWith('b')
		await key('ArrowRight', tabs[1])
		expect(document.activeElement).toBe(tabs[0])
	})
})

describe('Collapsible', () => {
	it('押すと開いて閉じる。aria-expanded・aria-controls・data-state が付く', async () => {
		const onOpenChange = vi.fn()
		const el = await render(
			<Collapsible onOpenChange={onOpenChange}>
				<CollapsibleTrigger>詳しく</CollapsibleTrigger>
				<CollapsibleContent>中身</CollapsibleContent>
			</Collapsible>,
		)
		const root = el.firstElementChild as HTMLElement
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(root.getAttribute('data-state')).toBe('closed')
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		expect(el.textContent).not.toContain('中身')
		await press(trigger)
		expect(onOpenChange).toHaveBeenLastCalledWith(true)
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(trigger.getAttribute('data-state')).toBe('open')
		expect(root.getAttribute('data-state')).toBe('open')
		const content = document.getElementById(
			trigger.getAttribute('aria-controls') ?? '',
		)
		expect(content?.textContent).toBe('中身')
		expect(content?.getAttribute('data-state')).toBe('open')
	})

	it('asChild の Trigger でも動く', async () => {
		const el = await render(
			<Collapsible defaultOpen>
				<CollapsibleTrigger asChild>
					<button type='button' className='mine'>
						たたむ
					</button>
				</CollapsibleTrigger>
				<CollapsibleContent>中身</CollapsibleContent>
			</Collapsible>,
		)
		const trigger = el.querySelector('button.mine') as HTMLButtonElement
		expect(trigger.getAttribute('data-state')).toBe('open')
		await press(trigger)
		await act(async () => wait(50))
		expect(trigger.getAttribute('data-state')).toBe('closed')
	})
})

describe('Select', () => {
	function Demo(props: {
		value?: string
		onValueChange?: (v: string) => void
	}) {
		return (
			<Select value={props.value} onValueChange={props.onValueChange}>
				<SelectTrigger aria-label='果物'>
					<SelectValue placeholder='選んでください' />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>果物</SelectLabel>
						<SelectItem value='apple'>りんご</SelectItem>
						<SelectItem value='banana'>バナナ</SelectItem>
						<SelectItem value='grape' disabled>
							ぶどう
						</SelectItem>
					</SelectGroup>
				</SelectContent>
			</Select>
		)
	}

	it('閉じたままでも、選んだ項目の文字を出す。無ければ placeholder', async () => {
		const el = await render(
			<>
				<Demo value='banana' />
				<Demo value='' />
			</>,
		)
		const [a, b] = Array.from(
			el.querySelectorAll('[role="combobox"]'),
		) as HTMLElement[]
		expect(a.textContent).toBe('バナナ')
		expect(a.getAttribute('data-state')).toBe('closed')
		expect(a.hasAttribute('data-placeholder')).toBe(false)
		expect(b.textContent).toBe('選んでください')
		expect(b.hasAttribute('data-placeholder')).toBe(true)
		// 閉じているあいだ、項目は DOM に出ない
		expect(document.querySelector('[role="option"]')).toBeNull()
	})

	it('押すと開き、項目を選ぶと onValueChange を呼んで閉じる', async () => {
		function Controlled() {
			const [value, setValue] = useState('')
			return <Demo value={value} onValueChange={setValue} />
		}
		const el = await render(<Controlled />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
		await press(trigger)
		await act(async () => wait(50))
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(trigger.getAttribute('data-state')).toBe('open')
		const options = Array.from(
			document.querySelectorAll('[role="option"]'),
		) as HTMLElement[]
		expect(options.map(o => o.textContent)).toEqual([
			'りんご',
			'バナナ',
			'ぶどう',
		])
		expect(options[2].hasAttribute('data-disabled')).toBe(true)
		// 矢印で動いて Enter で選ぶ（Radix も base-ui も同じ操作で選べる）
		await key('ArrowDown')
		await key('Enter')
		await act(async () => wait(80))
		expect(trigger.textContent).not.toBe('選んでください')
		expect(['りんご', 'バナナ']).toContain(trigger.textContent)
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
	})

	it('開いているあいだも、Trigger に選んだ項目の文字を出し続ける', async () => {
		const el = await render(<Demo value='banana' />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await press(trigger)
		await act(async () => wait(80))
		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(trigger.textContent).toBe('バナナ')
	})

	it('選んでいる項目には aria-selected と data-state="checked" が付く', async () => {
		const el = await render(<Demo value='banana' />)
		await press(el.querySelector('[role="combobox"]') as HTMLElement)
		await act(async () => wait(50))
		const banana = Array.from(
			document.querySelectorAll('[role="option"]'),
		).find(o => o.textContent === 'バナナ') as HTMLElement
		expect(banana.getAttribute('aria-selected')).toBe('true')
		expect(banana.getAttribute('data-state')).toBe('checked')
	})

	it('Esc で閉じ、フォーカスは Trigger へ戻る', async () => {
		const el = await render(<Demo value='apple' />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await press(trigger)
		await act(async () => wait(50))
		await key('Escape')
		await act(async () => wait(80))
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
		expect(document.activeElement).toBe(trigger)
	})
})
