// @vitest-environment jsdom
import { type ReactNode, act, createRef } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Bubble, BubbleContent } from '../ai-chat/bubble'
import { SidebarItem } from '../app-frame/sidebar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

// base-ui に移した HoverCard と、Radix の Slot をやめた asChild（Bubble・SidebarItem）が、
// Radix のときと同じ使い方で動くことを確かめる。

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

describe('HoverCard', () => {
	it('Trigger は既定で <a> を描き、href と data-state が付く', async () => {
		const el = await render(
			<HoverCard>
				<HoverCardTrigger href='#c'>山田商店</HoverCardTrigger>
				<HoverCardContent>中身</HoverCardContent>
			</HoverCard>,
		)
		const trigger = el.querySelector('a') as HTMLAnchorElement
		expect(trigger.getAttribute('href')).toBe('#c')
		expect(trigger.textContent).toBe('山田商店')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		expect(document.body.textContent).not.toContain('中身')
	})

	it('asChild で子の要素を Trigger にし、開いていれば中身に data-state=open と位置が付く', async () => {
		const ref = createRef<HTMLDivElement>()
		const el = await render(
			<HoverCard open>
				<HoverCardTrigger asChild>
					<button type='button'>押せる名前</button>
				</HoverCardTrigger>
				<HoverCardContent ref={ref} side='top' className='w-60'>
					中身
				</HoverCardContent>
			</HoverCard>,
		)
		const trigger = el.querySelector('button') as HTMLButtonElement
		expect(trigger.textContent).toBe('押せる名前')
		expect(trigger.getAttribute('data-state')).toBe('open')
		expect(el.querySelector('a')).toBeNull()

		const content = ref.current as HTMLDivElement
		expect(content.textContent).toBe('中身')
		expect(content.getAttribute('data-state')).toBe('open')
		expect(content.getAttribute('data-side')).toBe('top')
		expect(content.className).toContain('w-60')
		// Radix のときの CSS 変数の名前も使える
		expect(
			content.style.getPropertyValue('--radix-hover-card-trigger-width'),
		).toBe('var(--anchor-width)')
	})

	it('外で開け閉めを持てる（onOpenChange）', async () => {
		const onOpenChange = vi.fn()
		await render(
			<HoverCard open={false} onOpenChange={onOpenChange}>
				<HoverCardTrigger href='#c'>名前</HoverCardTrigger>
				<HoverCardContent>中身</HoverCardContent>
			</HoverCard>,
		)
		expect(document.body.textContent).not.toContain('中身')
		await act(async () =>
			root?.render(
				<HoverCard open onOpenChange={onOpenChange}>
					<HoverCardTrigger href='#c'>名前</HoverCardTrigger>
					<HoverCardContent>中身</HoverCardContent>
				</HoverCard>,
			),
		)
		expect(document.body.textContent).toContain('中身')
	})
})

describe('asChild（Radix の Slot をやめた後）', () => {
	it('SidebarItem asChild は子のリンクを使い、class・選んだ印・ref を足す', async () => {
		const ref = createRef<HTMLButtonElement>()
		const onClick = vi.fn()
		const el = await render(
			<SidebarItem asChild active ref={ref} onClick={onClick}>
				<a href='/inbox' className='extra'>
					受信箱
				</a>
			</SidebarItem>,
		)
		const link = el.querySelector('a') as HTMLAnchorElement
		expect(el.querySelector('button')).toBeNull()
		expect(link.getAttribute('href')).toBe('/inbox')
		expect(link.getAttribute('aria-current')).toBe('page')
		expect(link.hasAttribute('data-active')).toBe(true)
		expect(link.className).toContain('extra')
		expect(link.className).toContain('h-8')
		expect(ref.current).toBe(link)
		await act(async () => link.click())
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('BubbleContent asChild は子のボタンを吹き出しの箱にする', async () => {
		const el = await render(
			<Bubble>
				<BubbleContent asChild>
					<button type='button'>押せる吹き出し</button>
				</BubbleContent>
			</Bubble>,
		)
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.getAttribute('data-slot')).toBe('bubble-content')
		expect(button.className).toContain('rounded-xl')
		expect(el.querySelector('[data-slot="bubble-content"]')).toBe(button)
	})
})
