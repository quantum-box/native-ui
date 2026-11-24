// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Bubble, BubbleContent } from '../ai-chat/bubble'
import {
	SidebarAccount,
	SidebarItem,
	SidebarItemAction,
} from '../app-frame/sidebar'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card'

// 残りの部品（HoverCard・Bubble と Sidebar の asChild）が、Radix のときと同じ使い方・
// 同じ DOM になることを確かめる。

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
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms))

describe('HoverCard', () => {
	it('Trigger は <a> を描き、data-state が付く。開いていれば中身をポータルに出す', async () => {
		const el = await render(
			<HoverCard open>
				<HoverCardTrigger href='#user'>山田</HoverCardTrigger>
				<HoverCardContent side='bottom'>山田さんの要点</HoverCardContent>
			</HoverCard>,
		)
		await act(async () => wait())
		const trigger = el.querySelector('a') as HTMLAnchorElement
		expect(trigger.getAttribute('href')).toBe('#user')
		expect(trigger.getAttribute('data-state')).toBe('open')
		const content = document.querySelector(
			'[data-side="bottom"][data-state="open"]',
		) as HTMLElement
		expect(content?.textContent).toBe('山田さんの要点')
		expect(el.contains(content)).toBe(false)
	})

	it('asChild の Trigger は子の要素を使い、閉じていれば中身を出さない', async () => {
		const el = await render(
			<HoverCard>
				<HoverCardTrigger asChild>
					<a href='#x' className='mine'>
						記録
					</a>
				</HoverCardTrigger>
				<HoverCardContent>要点</HoverCardContent>
			</HoverCard>,
		)
		const trigger = el.querySelector('a.mine') as HTMLAnchorElement
		expect(trigger.textContent).toBe('記録')
		expect(trigger.getAttribute('data-state')).toBe('closed')
		expect(document.body.textContent).not.toContain('要点')
	})

	it('閉じた HoverCard は静的な描画でも描ける', () => {
		const html = renderToStaticMarkup(
			<HoverCard>
				<HoverCardTrigger href='#u'>山田</HoverCardTrigger>
				<HoverCardContent>要点</HoverCardContent>
			</HoverCard>,
		)
		expect(html).toContain('山田')
	})
})

describe('asChild（Bubble・Sidebar）', () => {
	it('BubbleContent の asChild は、子のボタンを吹き出しの箱にする', async () => {
		const onClick = vi.fn()
		const el = await render(
			<Bubble>
				<BubbleContent asChild>
					<button type='button' onClick={onClick}>
						押せる吹き出し
					</button>
				</BubbleContent>
			</Bubble>,
		)
		const button = el.querySelector('button') as HTMLButtonElement
		expect(button.getAttribute('data-slot')).toBe('bubble-content')
		expect(button.className).toContain('rounded-xl')
		await act(async () => button.click())
		expect(onClick).toHaveBeenCalledTimes(1)
	})

	it('SidebarItem・SidebarItemAction・SidebarAccount の asChild は子の要素を使う', async () => {
		const el = await render(
			<>
				<SidebarItem asChild>
					<a href='#home'>ホーム</a>
				</SidebarItem>
				<SidebarItemAction asChild>
					<a href='#more' aria-label='ほか'>
						…
					</a>
				</SidebarItemAction>
				<SidebarAccount asChild>
					<a href='#me'>自分</a>
				</SidebarAccount>
			</>,
		)
		const links = Array.from(el.querySelectorAll('a'))
		expect(links.map(a => a.getAttribute('href'))).toEqual([
			'#home',
			'#more',
			'#me',
		])
		expect(el.querySelector('button')).toBeNull()
		for (const link of links) expect(link.className.length).toBeGreaterThan(0)
	})
})
