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
	RecordCard,
	RecordChip,
	type RecordKindDefinition,
	RecordKindProvider,
	defineRecordKind,
	recordActions,
} from '../record/record'

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
	system: '顧客管理',
	renderPreview: customer => <p>コード {customer.code}</p>,
	getActions: customer => [
		recordActions.newTab(`/customers/${customer.id}`),
		recordActions.copy(customer.id),
	],
	useCandidates: () => ({ records: [ACME, BETA, GAMMA] }),
	pickerActions: [{ label: '顧客管理で新しく作る', href: '/customers/new' }],
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
/** 読み上げだけの文字（操作の案内）を除いた、目に見える文字。 */
function visibleText() {
	const copy = document.body.cloneNode(true) as HTMLElement
	for (const node of Array.from(copy.querySelectorAll('.sr-only')))
		node.remove()
	return copy.textContent
}
async function key(target: Element | null, name: string) {
	await act(async () => {
		target?.dispatchEvent(
			new KeyboardEvent('keydown', { key: name, bubbles: true }),
		)
		await new Promise(resolve => setTimeout(resolve, 30))
	})
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
		expect(link?.querySelector('[aria-hidden=true] svg')).not.toBeNull()
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
		expect(visibleText()).toBe('取引をやめた取引先')
	})
	it('登録していない種類は理由を出して止まる', async () => {
		const error = vi.spyOn(console, 'error').mockImplementation(() => {})
		await expect(
			render(<RecordChip kind='product' record={ACME} />),
		).rejects.toThrow('記録の種類「product」が登録されていません')
		error.mockRestore()
	})
})

describe('要点の枠', () => {
	it('↓ で枠を開き、種類とシステムを出して「顧客管理で開く」へ移る。Esc で記録に戻る', async () => {
		const navigate = vi.fn()
		await render(<RecordChip kind='customer' record={ACME} />, { navigate })
		const link = document.querySelector('a')
		expect(link?.getAttribute('aria-haspopup')).toBe('dialog')
		expect(
			document.getElementById(link?.getAttribute('aria-describedby') ?? '')
				?.textContent,
		).toContain('下矢印キー')
		await act(async () => link?.focus())
		await key(link, 'ArrowDown')
		const dialog = document.querySelector('[role=dialog]')
		expect(dialog?.getAttribute('aria-label')).toBe('取引先「山田商店」の要点')
		expect(dialog?.textContent).toContain('顧客管理· 取引先別のシステムの記録')
		expect(dialog?.querySelector('[data-external]')).not.toBeNull()
		expect(dialog?.textContent).toContain('コード C-001')
		const open = document.activeElement as HTMLAnchorElement
		expect(open.textContent).toBe('顧客管理で開く')
		expect(open.getAttribute('href')).toBe('/customers/c1')
		await key(open, 'Escape')
		expect(document.activeElement).toBe(link)
		// 記録へ戻ったフォーカスで、枠が開き直さない。
		await act(async () => new Promise(resolve => setTimeout(resolve, 500)))
		expect(document.querySelector('[role=dialog]')).toBeNull()
		await key(link, 'ArrowDown')
		await act(async () => (document.activeElement as HTMLElement).click())
		expect(navigate).toHaveBeenCalledExactlyOnceWith('/customers/c1')
	})
	it('今の画面と同じシステムの記録は、ふつうの枠で出す', async () => {
		const host = document.createElement('div')
		document.body.append(host)
		root = createRoot(host)
		await act(async () =>
			root?.render(
				<RecordKindProvider
					kinds={{ customer: customerKind }}
					systems={{ 顧客管理: { name: '顧客管理', tone: 'blue' } }}
					currentSystem='顧客管理'
				>
					<RecordCard kind='customer' record={ACME} />
				</RecordKindProvider>,
			),
		)
		expect(document.querySelector('[data-external]')).toBeNull()
		expect(document.body.textContent).not.toContain('別のシステムの記録')
		expect(document.querySelector('a')?.textContent).toBe('取引先を開く')
	})
	it('種類の決まりの操作を出す（新しいタブで開く・ID をコピー）', async () => {
		const writeText = vi.fn().mockResolvedValue(undefined)
		Object.assign(navigator, { clipboard: { writeText } })
		await render(<RecordChip kind='customer' record={ACME} />)
		const link = document.querySelector('a')
		await key(link, 'ArrowDown')
		const dialog = document.querySelector('[role=dialog]')
		const newTab = Array.from(dialog?.querySelectorAll('a') ?? []).find(
			node => node.textContent === '新しいタブで開く',
		)
		expect(newTab?.getAttribute('target')).toBe('_blank')
		await act(async () => button('ID をコピー').click())
		expect(writeText).toHaveBeenCalledWith('c1')
		expect(button('コピーしました')).toBeTruthy()
	})
	it('見る権限が無い記録では、開けないことと理由を出す', async () => {
		await render(<RecordChip kind='customer' status='forbidden' />)
		const chip = document.querySelector<HTMLElement>('[role=button]')
		await key(chip, 'ArrowDown')
		const open = button('顧客管理で開く')
		expect(document.activeElement).toBe(open)
		expect(open.getAttribute('aria-disabled')).toBe('true')
		expect(
			document.getElementById(open.getAttribute('aria-describedby') ?? '')
				?.textContent,
		).toBe('見る権限が無いので開けません。')
		expect(document.querySelectorAll('[role=dialog] a')).toHaveLength(0)
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
		expect(visibleText()).toBe('未設定鈴木食品C-002')
	})
	it('複数の記録は並べ、多いときは「+N」で残りを出す', async () => {
		await render(
			<DataTableRecordCell
				kind='customer'
				records={[ACME, recordPlaceholder('forbidden', 'c9'), BETA]}
				max={2}
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
			cell => {
				const copy = cell.cloneNode(true) as HTMLElement
				for (const node of Array.from(copy.querySelectorAll('.sr-only')))
					node.remove()
				return copy.textContent
			},
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

describe('付け替えの候補の枠', () => {
	async function openPicker(currentSystem?: string) {
		const host = document.createElement('div')
		document.body.append(host)
		root = createRoot(host)
		await act(async () =>
			root?.render(
				<RecordKindProvider
					kinds={{ customer: customerKind }}
					systems={{ 顧客管理: { name: '顧客管理', tone: 'blue' } }}
					currentSystem={currentSystem}
				>
					<DataTableRecordSelectCell<Customer>
						kind='customer'
						ariaLabel='取引先を変更'
						record={ACME}
						onSave={vi.fn()}
					/>
				</RecordKindProvider>,
			),
		)
		await act(async () => button('取引先を変更').click())
		return document.querySelector<HTMLElement>('[role=dialog]')
	}
	it('別のシステムから選ぶときは、帯・検索欄・下の道筋で分かるようにする', async () => {
		const picker = await openPicker()
		expect(picker?.textContent).toContain('顧客管理· 取引先から選ぶ')
		expect(picker?.textContent).toContain('別のシステムから選ぶ')
		expect(picker?.style.getPropertyValue('--record-tone')).toBe(
			'var(--nui-tone-blue)',
		)
		expect(picker?.querySelector('input')?.getAttribute('placeholder')).toBe(
			'顧客管理の取引先を検索…',
		)
		const create = Array.from(picker?.querySelectorAll('a') ?? []).find(
			node => node.textContent === '顧客管理で新しく作る',
		)
		expect(create?.getAttribute('href')).toBe('/customers/new')
	})
	it('同じシステムから選ぶときは、ふつうの枠のまま', async () => {
		const picker = await openPicker('顧客管理')
		expect(picker?.textContent).not.toContain('別のシステムから選ぶ')
		expect(picker?.style.getPropertyValue('--record-tone')).toBe('')
		expect(picker?.querySelector('input')?.getAttribute('placeholder')).toBe(
			'取引先を検索…',
		)
	})
})
