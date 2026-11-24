// @vitest-environment jsdom
import { type ReactNode, act, createRef } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button } from './button'
import { Label } from './label'
import { Separator } from './separator'

// 土台の部品（Button の asChild・Separator・Label）が、
// Radix のときと同じ DOM と動きになることを確かめる。

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
let root: Root | undefined
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

describe('Button', () => {
	it('ふつうは <button> を描き、type の指定が無ければフォームを送る', async () => {
		const onSubmit = vi.fn((e: Event) => e.preventDefault())
		const el = await render(
			<form onSubmit={e => onSubmit(e.nativeEvent)}>
				<Button>送る</Button>
			</form>,
		)
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.type).toBe('submit')
		await act(async () => button.click())
		expect(onSubmit).toHaveBeenCalledTimes(1)
	})

	it('type="button" ならフォームを送らない', async () => {
		const onSubmit = vi.fn((e: Event) => e.preventDefault())
		const el = await render(
			<form onSubmit={e => onSubmit(e.nativeEvent)}>
				<Button type='button'>押す</Button>
			</form>,
		)
		await act(async () => (el.querySelector('button') as HTMLElement).click())
		expect(onSubmit).not.toHaveBeenCalled()
	})

	it('disabled なら押せず、disabled 属性が付く', async () => {
		const onClick = vi.fn()
		const el = await render(
			<Button disabled onClick={onClick}>
				押す
			</Button>,
		)
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.disabled).toBe(true)
		await act(async () => button.click())
		expect(onClick).not.toHaveBeenCalled()
	})

	it('ref は <button> を指す', async () => {
		const ref = createRef<HTMLButtonElement>()
		await render(<Button ref={ref}>押す</Button>)
		expect(ref.current?.tagName).toBe('BUTTON')
	})

	it('asChild なら子の要素を使い、class・イベント・ref を渡す', async () => {
		const ref = createRef<HTMLButtonElement>()
		const order: string[] = []
		const el = await render(
			<Button
				asChild
				variant='ghost'
				ref={ref}
				onClick={() => order.push('button')}
			>
				{/* biome-ignore lint/a11y/useValidAnchor: Link の代わりに a で確かめる */}
				<a
					href='#next'
					className='child-class'
					onClick={e => {
						e.preventDefault()
						order.push('child')
					}}
				>
					次へ
				</a>
			</Button>,
		)
		const link = el.querySelector('a') as HTMLAnchorElement
		expect(el.querySelector('button')).toBeNull()
		expect(link.textContent).toBe('次へ')
		expect(link.getAttribute('href')).toBe('#next')
		// role や type は足さない（リンクのまま読み上げられる）
		expect(link.hasAttribute('role')).toBe(false)
		expect(link.hasAttribute('type')).toBe(false)
		expect(link.classList.contains('child-class')).toBe(true)
		expect(link.classList.contains('h-7')).toBe(true)
		expect(ref.current).toBe(link)
		await act(async () => link.click())
		// Radix と同じく子が先、Button 側が後
		expect(order).toEqual(['child', 'button'])
	})

	it('asChild で子の props が Button の物に勝つ', async () => {
		const el = await render(
			<Button asChild id='from-button' title='button'>
				<a href='#x' id='from-child'>
					x
				</a>
			</Button>,
		)
		const link = el.querySelector('a') as HTMLAnchorElement
		expect(link.id).toBe('from-child')
		expect(link.title).toBe('button')
	})
})

describe('Separator', () => {
	it('既定は見た目だけの線（role="none"）', async () => {
		const el = await render(<Separator />)
		const line = el.firstElementChild as HTMLElement
		expect(line.getAttribute('role')).toBe('none')
		expect(line.hasAttribute('aria-orientation')).toBe(false)
		expect(line.getAttribute('data-orientation')).toBe('horizontal')
	})

	it('decorative={false} なら role="separator"。縦のときだけ aria-orientation', async () => {
		const el = await render(
			<>
				<Separator decorative={false} />
				<Separator decorative={false} orientation='vertical' />
			</>,
		)
		const [h, v] = Array.from(el.children) as HTMLElement[]
		expect(h.getAttribute('role')).toBe('separator')
		expect(h.hasAttribute('aria-orientation')).toBe(false)
		expect(v.getAttribute('role')).toBe('separator')
		expect(v.getAttribute('aria-orientation')).toBe('vertical')
		expect(v.getAttribute('data-orientation')).toBe('vertical')
		expect(v.classList.contains('w-px')).toBe(true)
	})
})

describe('Label', () => {
	it('<label> を描き、htmlFor で入力欄とつながる', async () => {
		const el = await render(
			<>
				<Label htmlFor='name'>名前</Label>
				<input id='name' />
			</>,
		)
		const label = el.querySelector('label') as HTMLLabelElement
		expect(label.htmlFor).toBe('name')
		expect(label.control).toBe(el.querySelector('input'))
	})

	it('2 回押しでは文字を選ばない（mousedown の既定の動きを止める）', async () => {
		const onMouseDown = vi.fn()
		const el = await render(<Label onMouseDown={onMouseDown}>名前</Label>)
		const label = el.querySelector('label') as HTMLLabelElement
		const once = new MouseEvent('mousedown', {
			bubbles: true,
			cancelable: true,
			detail: 1,
		})
		const twice = new MouseEvent('mousedown', {
			bubbles: true,
			cancelable: true,
			detail: 2,
		})
		await act(async () => {
			label.dispatchEvent(once)
			label.dispatchEvent(twice)
		})
		expect(onMouseDown).toHaveBeenCalledTimes(2)
		expect(once.defaultPrevented).toBe(false)
		expect(twice.defaultPrevented).toBe(true)
	})
})
