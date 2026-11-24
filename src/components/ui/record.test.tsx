// @vitest-environment jsdom
import { Building2, Store } from 'lucide-react'
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { RecordKindProvider, RecordMention, defineRecordKind } from './record'
import { RecordList } from './record-list'
import { RecordPicker } from './record-picker'

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

type Customer = { id: string; name: string; code: string }
type Shop = { id: string; name: string }
const ACME: Customer = { id: 'c1', name: '山田商店', code: 'C-001' }
const BETA: Customer = { id: 'c2', name: '鈴木食品', code: 'C-002' }
const UMEDA: Shop = { id: 's1', name: '梅田店' }

const KINDS = {
	customer: defineRecordKind<Customer>({
		name: '取引先',
		system: 'crm',
		icon: Building2,
		getId: customer => customer.id,
		getLabel: customer => customer.name,
		getDescription: customer => customer.code,
		getHref: customer => `/customers/${customer.id}`,
		useCandidates: () => ({ records: [ACME, BETA] }),
		pickerActions: [{ label: '顧客管理で新しく作る', href: '/customers/new' }],
	}),
	shop: defineRecordKind<Shop>({
		name: '店',
		icon: Store,
		getId: shop => shop.id,
		getLabel: shop => shop.name,
	}),
}
const SYSTEMS = { crm: { name: '顧客管理', tone: 'blue' as const } }

async function render(node: ReactNode, currentSystem?: string) {
	const host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	await act(async () =>
		root?.render(
			<RecordKindProvider
				kinds={KINDS}
				systems={SYSTEMS}
				currentSystem={currentSystem}
			>
				{node}
			</RecordKindProvider>,
		),
	)
}
const wait = () =>
	act(async () => new Promise(resolve => setTimeout(resolve, 30)))

describe('文の中の記録', () => {
	it('まわりの文字の大きさのまま点線の下線で出し、↓ で表と同じ要点のカードへ移れる', async () => {
		await render(
			<p>
				<RecordMention kind='customer' record={ACME} /> から注文がありました。
			</p>,
		)
		const link = document.querySelector('a')
		expect(link?.textContent).toBe('山田商店')
		expect(link?.className).toContain('decoration-dotted')
		expect(link?.className).not.toContain('text-sm')
		await act(async () =>
			link?.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
			),
		)
		await wait()
		expect(document.querySelector('[role=dialog]')?.textContent).toContain(
			'顧客管理',
		)
		expect(document.activeElement?.textContent).toBe('顧客管理で開く')
	})
})

describe('フォームで記録を選ぶ', () => {
	it('項目名と結び付き、別のシステムの帯と下の道筋を出し、選ぶと知らせる。未設定にも戻せる', async () => {
		const changes: (Customer | null)[] = []
		function Field() {
			const [value, setValue] = useState<Customer | null>(ACME)
			return (
				<>
					<label htmlFor='customer'>取引先</label>
					<RecordPicker<Customer>
						id='customer'
						kind='customer'
						value={value}
						allowEmpty
						onChange={next => {
							changes.push(next)
							setValue(next)
						}}
					/>
				</>
			)
		}
		await render(<Field />)
		const field = document.getElementById('customer') as HTMLButtonElement
		expect(field.labels?.[0]?.textContent).toBe('取引先')
		expect(field.textContent).toContain('山田商店')
		await act(async () => field.click())
		const picker = document.querySelector('[role=dialog]')
		expect(picker?.textContent).toContain('顧客管理· 取引先から選ぶ')
		expect(picker?.querySelector('input')?.getAttribute('placeholder')).toBe(
			'顧客管理の取引先を検索…',
		)
		expect(
			Array.from(picker?.querySelectorAll('a') ?? []).map(a => a.textContent),
		).toContain('顧客管理で新しく作る')
		const option = (text: string) =>
			Array.from(document.querySelectorAll<HTMLElement>('[role=option]')).find(
				node => node.textContent?.includes(text),
			)
		await act(async () => option('鈴木食品')?.click())
		expect(changes).toEqual([BETA])
		expect(field.textContent).toContain('鈴木食品')
		await act(async () => field.click())
		await act(async () => option('未設定')?.click())
		expect(changes[1]).toBeNull()
		expect(field.textContent).toContain('取引先を選ぶ')
	})
	it('選んでいる記録があっても、矢印キーで候補を動かして Enter で選べる', async () => {
		const onChange = vi.fn()
		await render(
			<RecordPicker<Customer>
				aria-label='取引先'
				kind='customer'
				value={ACME}
				onChange={onChange}
			/>,
		)
		await act(async () =>
			document.querySelector<HTMLButtonElement>('[aria-label=取引先]')?.click(),
		)
		const search = document.querySelector(
			'[role=dialog] input',
		) as HTMLInputElement
		const press = (key: string) =>
			act(async () => {
				search.dispatchEvent(
					new KeyboardEvent('keydown', { key, bubbles: true }),
				)
			})
		// 開いたときは、選んでいる記録にあたっている。
		expect(
			document.querySelector('[role=option][aria-selected=true]')?.textContent,
		).toContain('山田商店')
		await press('ArrowDown')
		expect(
			document.querySelector('[role=option][aria-selected=true]')?.textContent,
		).toContain('鈴木食品')
		await press('Enter')
		expect(onChange).toHaveBeenCalledWith(BETA)
	})
	it('今の画面と同じシステムなら、ふつうの候補の枠', async () => {
		await render(
			<RecordPicker<Customer>
				aria-label='取引先'
				kind='customer'
				value={null}
				onChange={vi.fn()}
			/>,
			'crm',
		)
		await act(async () =>
			document.querySelector<HTMLButtonElement>('[aria-label=取引先]')?.click(),
		)
		const picker = document.querySelector('[role=dialog]')
		expect(picker?.textContent).not.toContain('から選ぶ')
		expect(picker?.querySelector('input')?.getAttribute('placeholder')).toBe(
			'取引先を検索…',
		)
	})
})

describe('記録の一覧', () => {
	it('種類ごとにまとめ、多いときは「ほか N 件」で残りを出す', async () => {
		await render(
			<RecordList
				title='関係する記録'
				groupByKind
				max={2}
				items={[
					{ key: '1', kind: 'customer', record: ACME, meta: '注文元' },
					{ key: '2', kind: 'shop', record: UMEDA },
					{ key: '3', kind: 'customer', status: 'forbidden', meta: '請求先' },
				]}
			/>,
		)
		const text = () => document.body.textContent ?? ''
		expect(text()).toContain('関係する記録3 件')
		expect(text()).toContain('取引先1 件')
		expect(text()).not.toContain('見る権限がありません')
		const more = Array.from(document.querySelectorAll('button')).find(
			node => node.textContent === 'ほか 1 件',
		)
		await act(async () => more?.click())
		expect(text()).toContain('取引先2 件')
		expect(text()).toContain('取引先（見る権限がありません）')
	})
})
