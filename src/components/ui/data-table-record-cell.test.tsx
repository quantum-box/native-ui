// @vitest-environment jsdom
import type { ColumnDef } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { DataTable } from './data-table'
import {
	DataTableRecordCell,
	DataTableRecordSelectCell,
	dataTableRecordColumn,
	recordPlaceholder,
} from './data-table-record-cell'
import {
	RecordChip,
	type RecordKindDefinition,
	RecordKindProvider,
	defineRecordKind,
} from './record'

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
const ACME: Customer = { id: 'c1', name: '山田商店', code: 'C-001' }
const BETA: Customer = { id: 'c2', name: '鈴木食品', code: 'C-002' }
const GAMMA: Customer = { id: 'c3', name: 'みどり青果', code: 'C-003' }

const customerKind = defineRecordKind<Customer>({
	name: '取引先',
	icon: Building2,
	getId: customer => customer.id,
	getLabel: customer => customer.name,
	getDescription: customer => customer.code,
	getHref: customer => `/customers/${customer.id}`,
	useCandidates: () => ({ records: [ACME, BETA, GAMMA] }),
})

async function render(
	node: ReactNode,
	{
		navigate,
		kinds = { customer: customerKind },
	}: {
		navigate?: (href: string) => void
		kinds?: Record<string, RecordKindDefinition<Customer>>
	} = {},
) {
	const host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	await act(async () =>
		root?.render(
			<RecordKindProvider kinds={kinds} navigate={navigate}>
				{node}
			</RecordKindProvider>,
		),
	)
}
function button(label: string) {
	const match = Array.from(document.querySelectorAll('button')).find(
		node =>
			node.getAttribute('aria-label') === label || node.textContent === label,
	)
	if (!match) throw new Error(`Missing button ${label}`)
	return match
}

describe('記録を 1 つ出す', () => {
	it('種類の決まりどおりにリンクを出し、ふつうに押すとアプリの方法で移る', async () => {
		const navigate = vi.fn()
		await render(<RecordChip kind='customer' record={ACME} />, { navigate })
		const link = document.querySelector('a')
		expect(link?.getAttribute('href')).toBe('/customers/c1')
		expect(link?.textContent).toBe('山田商店')
		expect(link?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
		await act(async () => link?.click())
		expect(navigate).toHaveBeenCalledExactlyOnceWith('/customers/c1')
		await act(async () =>
			link?.dispatchEvent(
				new MouseEvent('click', {
					bubbles: true,
					cancelable: true,
					metaKey: true,
				}),
			),
		)
		expect(navigate).toHaveBeenCalledOnce()
	})
	it('読み込み中・消えた・見る権限が無いときを決まりどおりに出す', async () => {
		await render(
			<>
				<RecordChip kind='customer' status='loading' />
				<RecordChip kind='customer' record={null} />
				<RecordChip kind='customer' status='forbidden' />
				<RecordChip kind='customer' status='unavailable' />
			</>,
		)
		expect(document.querySelector('[aria-busy=true]')?.textContent).toBe(
			'取引先を読み込んでいます',
		)
		expect(document.body.textContent).toContain('削除された取引先')
		expect(document.body.textContent).toContain(
			'取引先（見る権限がありません）',
		)
		expect(document.querySelector('a')).toBeNull()
	})
	it('種類ごとに文言を変えられる', async () => {
		await render(<RecordChip kind='customer' status='missing' />, {
			kinds: {
				customer: { ...customerKind, missingText: '取引をやめた取引先' },
			},
		})
		expect(document.body.textContent).toBe('取引をやめた取引先')
	})
	it('登録していない種類は理由を出して止まる', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		await expect(
			render(<RecordChip kind='product' record={ACME} />),
		).rejects.toThrow('記録の種類「product」が登録されていません')
		error.mockRestore()
	})
})

describe('表のセルに記録を出す', () => {
	it('記録が無ければ「未設定」、あれば記録を出す', async () => {
		await render(
			<>
				<DataTableRecordCell kind='customer' record={null} />
				<DataTableRecordCell kind='customer' record={BETA} showDescription />
			</>,
		)
		expect(document.body.textContent).toBe('未設定鈴木食品C-002')
	})
	it('複数の記録は並べ、多いときは「+N」で残りを出す', async () => {
		await render(
			<DataTableRecordCell
				kind='customer'
				records={[ACME, recordPlaceholder('forbidden', 'c9'), BETA]}
			/>,
		)
		expect(document.querySelectorAll('a')).toHaveLength(1)
		expect(document.body.textContent).toContain('見る権限がありません')
		await act(async () => button('ほかの取引先 1件を見る').click())
		const dialog = document.querySelector('[role=dialog]')
		expect(dialog?.textContent).toContain('取引先（3件）')
		expect(dialog?.querySelectorAll('li')).toHaveLength(3)
	})
	it('列を作る関数で、表ごとにセルを書かずに出せる', async () => {
		type Invoice = { id: string; customer: Customer | null }
		const columns: ColumnDef<Invoice>[] = [
			{ accessorKey: 'id', header: '番号' },
			dataTableRecordColumn<Invoice, Customer>({
				id: 'customer',
				header: '取引先',
				kind: 'customer',
				get: invoice => invoice.customer,
			}),
		]
		await render(
			<DataTable
				columns={columns}
				items={[
					{ id: 'INV-1', customer: ACME },
					{ id: 'INV-2', customer: null },
				]}
				total={2}
				page={1}
				pageSize={20}
				onPageChange={() => {}}
			/>,
		)
		const cells = Array.from(document.querySelectorAll('tbody td')).map(
			cell => cell.textContent,
		)
		expect(cells).toEqual(['INV-1', '山田商店', 'INV-2', '未設定'])
	})
})

describe('別の記録に付け替える', () => {
	it('候補を種類の決まりから出し、選んだ記録で保存する。未設定にも戻せる', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		function Row() {
			const [customer, setCustomer] = useState<Customer | null>(ACME)
			return (
				<DataTableRecordSelectCell<Customer>
					kind='customer'
					ariaLabel='請求書の取引先を変更'
					record={customer}
					allowEmpty
					validate={next =>
						next?.id === 'c3' ? '取引を止めている取引先です。' : null
					}
					onSave={async next => {
						await save(next)
						setCustomer(next)
					}}
				/>
			)
		}
		await render(<Row />)
		expect(button('請求書の取引先を変更').textContent).toContain('山田商店')
		expect(document.querySelector('a')).toBeNull()
		const pick = async (text: string) => {
			await act(async () => button('請求書の取引先を変更').click())
			const option = Array.from(
				document.querySelectorAll<HTMLElement>('[role=option]'),
			).find(node => node.textContent?.includes(text))
			await act(async () => option?.click())
		}
		await pick('鈴木食品')
		expect(save).toHaveBeenLastCalledWith(BETA)
		expect(button('請求書の取引先を変更').textContent).toContain('鈴木食品')
		await pick('みどり青果')
		expect(save).toHaveBeenCalledOnce()
		expect(document.querySelector('[role=alert]')?.textContent).toBe(
			'取引を止めている取引先です。',
		)
		// 確かめで止まったら候補は開いたままなので、そのまま選び直せる。
		const empty = Array.from(
			document.querySelectorAll<HTMLElement>('[role=option]'),
		).find(node => node.textContent?.includes('未設定'))
		await act(async () => empty?.click())
		expect(save).toHaveBeenLastCalledWith(null)
		expect(button('請求書の取引先を変更').textContent).toContain('未設定')
	})
})
