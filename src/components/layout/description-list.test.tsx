// @vitest-environment jsdom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'

import { AiValue } from '../ai/ai-suggestion'
import { DescriptionItem, DescriptionList } from './description-list'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

function render(node: React.ReactNode) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	act(() => root.render(node))
	return { container, unmount: () => act(() => root.unmount()) }
}

describe('DescriptionList', () => {
	it('名前と値の組を dl・dt・dd で出す', () => {
		const view = render(
			<DescriptionList>
				<DescriptionItem label='取引先'>読取文具店</DescriptionItem>
				<DescriptionItem label='合計' numeric emphasis>
					￥1,200
				</DescriptionItem>
			</DescriptionList>,
		)
		const list = view.container.querySelector('dl')
		expect(list?.querySelectorAll('dt')).toHaveLength(2)
		const [name, total] = Array.from(list?.querySelectorAll('dd') ?? [])
		expect(name?.previousElementSibling?.textContent).toBe('取引先')
		expect(name?.textContent).toBe('読取文具店')
		expect(total?.className).toContain('tabular-nums')
		expect(total?.className).toContain('font-medium')
		view.unmount()
	})

	it('値が無いときは「—」を出し、0 はそのまま出す', () => {
		const view = render(
			<DescriptionList>
				<DescriptionItem label='メモ'>{null}</DescriptionItem>
				<DescriptionItem label='宛名'>{''}</DescriptionItem>
				<DescriptionItem label='件数'>{0}</DescriptionItem>
			</DescriptionList>,
		)
		const values = Array.from(view.container.querySelectorAll('dd')).map(
			value => value.textContent,
		)
		expect(values).toEqual(['—', '—', '0'])
		expect(
			view.container.querySelectorAll(
				'[data-slot=description-item][data-empty]',
			),
		).toHaveLength(2)
		view.unmount()
	})

	it('値が無いときの文は、並び全体でも 1 組だけでも変えられる', () => {
		const view = render(
			<DescriptionList empty='未設定'>
				<DescriptionItem label='比重' />
				<DescriptionItem empty='未読取' label='登録番号' />
			</DescriptionList>,
		)
		const values = Array.from(view.container.querySelectorAll('dd')).map(
			value => value.textContent,
		)
		expect(values).toEqual(['未設定', '未読取'])
		view.unmount()
	})

	it('値に AI の値の印などの部品を置ける', () => {
		const view = render(
			<DescriptionList>
				<DescriptionItem label='取引日'>
					<AiValue kind='AI の読み取り'>2026-11-23</AiValue>
				</DescriptionItem>
			</DescriptionList>,
		)
		expect(view.container.querySelector('dd')?.textContent).toContain(
			'2026-11-23',
		)
		expect(view.container.querySelector('dd')?.textContent).toContain(
			'AI の読み取り',
		)
		view.unmount()
	})

	it('横に並べる行（inline）は、名前の列の幅を並びで決める', () => {
		const view = render(
			<DescriptionList labelWidth='10rem' layout='inline'>
				<DescriptionItem label='種類'>問い合わせ</DescriptionItem>
			</DescriptionList>,
		)
		const list = view.container.querySelector('dl') as HTMLElement
		expect(list.dataset.layout).toBe('inline')
		expect(list.style.getPropertyValue('--description-label')).toBe('10rem')
		view.unmount()
	})

	it('列の数を決めずに 1 列のいちばん狭い幅だけ渡しても、その幅が効く', () => {
		const view = render(
			<DescriptionList minColumnWidth='24rem'>
				<DescriptionItem label='メモ'>長い文</DescriptionItem>
			</DescriptionList>,
		)
		const list = view.container.querySelector('dl') as HTMLElement
		expect(list.style.gridTemplateColumns).toContain('24rem')
		view.unmount()
	})
})
