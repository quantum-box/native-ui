// @vitest-environment jsdom
import type { ColumnDef } from '@tanstack/react-table'
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { DataTable } from './data-table'
import {
	DataTableComputedCell,
	type DataTableFormula,
	DataTableReadOnlyCell,
	evaluateDataTableFormula,
	roundDataTableNumber,
} from './data-table-computed-cell'
import { DataTableNumberCell } from './data-table-number-cell'

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
	if (!globalThis.CSS?.escape)
		vi.stubGlobal('CSS', { escape: (value: string) => value })
})
afterEach(async () => {
	await act(async () => root?.unmount())
	root = undefined
	document.body.innerHTML = ''
})
async function render(node: ReactNode) {
	const host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	await act(async () => root?.render(node))
}
const wait = (ms = 30) =>
	act(async () => new Promise(resolve => setTimeout(resolve, ms)))
function byLabel(label: string) {
	const node = document.querySelector<HTMLElement>(`[aria-label="${label}"]`)
	if (!node) throw new Error(`Missing ${label}`)
	return node
}
function described(node: HTMLElement) {
	return (
		document.getElementById(node.getAttribute('aria-describedby') ?? '')
			?.textContent ?? ''
	)
}
async function key(node: Element | null, name: string) {
	await act(async () => {
		node?.dispatchEvent(
			new KeyboardEvent('keydown', { key: name, bubbles: true }),
		)
	})
	await wait()
}
async function type(value: string) {
	const field = document.querySelector('input') as HTMLInputElement
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			'value',
		)?.set?.call(field, value)
		field.dispatchEvent(new Event('input', { bubbles: true }))
	})
}

const formula = (price: number, quantity: number): DataTableFormula => [
	{
		label: '単価',
		value: price,
		format: { prefix: '¥' },
		cellLabel: '単価を変更',
	},
	'×',
	{ label: '数量', value: quantity, format: { suffix: '個' } },
]

describe('式の計算', () => {
	it('× ÷ を先に計算し、端数の扱いを選べる', () => {
		expect(evaluateDataTableFormula(formula(380, 24))).toBe(9120)
		expect(
			evaluateDataTableFormula([
				{ label: 'a', value: 2 },
				'+',
				{ label: 'b', value: 3 },
				'×',
				{ label: 'c', value: 4 },
			]),
		).toBe(14)
		expect(roundDataTableNumber(400.04, 0, 'floor')).toBe(400)
		expect(roundDataTableNumber(400.04, 0, 'ceil')).toBe(401)
		expect(roundDataTableNumber(1.005, 2, 'round')).toBe(1.01)
	})
})

describe('計算した値のセル（読むだけ）', () => {
	it('式を読み上げに伝え、触れても押せる形にならない', async () => {
		await render(
			<DataTableComputedCell
				ariaLabel='金額'
				label='金額'
				value={9120}
				format={{ prefix: '¥' }}
				formula={formula(380, 24)}
				note='1 円未満は切り捨てています。'
			/>,
		)
		const cell = byLabel('金額（計算した値・直せません）')
		expect(cell.tagName).toBe('SPAN')
		expect(cell.className).toContain('cursor-default')
		expect(cell.className).not.toContain('hover:bg-muted')
		expect(described(cell)).toContain('単価 ¥380 × 数量 24個 = ¥9,120')
		expect(described(cell)).toContain('1 円未満は切り捨てています。')
	})
	it('式の中の項目を押すと、そのセルへ移る', async () => {
		await render(
			<table>
				<tbody>
					<tr>
						<td>
							<DataTableNumberCell
								ariaLabel='単価を変更'
								prefix='¥'
								value={380}
								onSave={vi.fn()}
							/>
						</td>
						<td>
							<DataTableComputedCell
								ariaLabel='金額'
								value={9120}
								format={{ prefix: '¥' }}
								formula={formula(380, 24)}
							/>
						</td>
					</tr>
				</tbody>
			</table>,
		)
		await key(byLabel('金額（計算した値・直せません）'), 'ArrowDown')
		const dialog = document.querySelector('[role=dialog]')
		expect(dialog?.textContent).toContain('単価¥380×数量24個=¥9,120')
		await act(async () => byLabel('単価 ¥380（そのセルへ移る）').click())
		expect(document.activeElement).toBe(byLabel('単価を変更'))
	})
})

describe('計算した値を直す', () => {
	it('逆算: 金額を直すと、単価を計算し直して端数を切り捨て、何が変わるかを先に見せる', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		function Row() {
			const [price, setPrice] = useState(380)
			return (
				<DataTableComputedCell
					ariaLabel='金額'
					label='金額'
					value={price * 24}
					format={{ prefix: '¥' }}
					formula={formula(price, 24)}
					reverse={{
						term: 0,
						solve: total => total / 24,
						rounding: 'floor',
						onSave: async next => {
							await save(next)
							setPrice(next)
						},
					}}
				/>
			)
		}
		await render(<Row />)
		await act(async () => byLabel('金額').click())
		await type('9620')
		await wait()
		const field = document.querySelector('input') as HTMLInputElement
		expect(described(field)).toBe(
			'単価が ¥380 → ¥400 になります。 割り切れないため切り捨てて、金額は ¥9,600 になります。',
		)
		await key(field, 'Enter')
		expect(save).toHaveBeenCalledExactlyOnceWith(400)
		expect(byLabel('金額').textContent).toContain('¥9,600')
	})
	it('上書き: 手で決めた値に「手入力」を付け、「計算に戻す」で戻せる', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		function Row() {
			const [manual, setManual] = useState<number | null>(null)
			return (
				<DataTableComputedCell
					ariaLabel='金額'
					value={9120}
					format={{ prefix: '¥' }}
					formula={formula(380, 24)}
					override={{
						value: manual,
						onSave: async next => {
							await save(next)
							setManual(next)
						},
					}}
				/>
			)
		}
		await render(<Row />)
		await act(async () => byLabel('金額').click())
		await type('9500')
		await wait()
		const field = document.querySelector('input') as HTMLInputElement
		expect(described(field)).toBe(
			'計算（¥9,120）をやめて、¥9,500 を手で決めます。',
		)
		await key(field, 'Enter')
		expect(save).toHaveBeenLastCalledWith(9500)
		expect(byLabel('金額').textContent).toContain('手入力')
		await key(byLabel('金額'), 'ArrowDown')
		const revert = Array.from(document.querySelectorAll('button')).find(
			node => node.textContent === '計算に戻す',
		)
		await act(async () => revert?.click())
		expect(save).toHaveBeenLastCalledWith(null)
		expect(byLabel('金額').textContent).not.toContain('手入力')
		expect(byLabel('金額').textContent).toContain('¥9,120')
	})
})

describe('直せないセル', () => {
	it('鍵の印を出し、理由を読み上げに伝え、押せる形にならない', async () => {
		await render(
			<DataTableReadOnlyCell ariaLabel='単価' reason='直す権限がありません。'>
				¥380
			</DataTableReadOnlyCell>,
		)
		const cell = byLabel('単価（直せません）')
		expect(cell.className).toContain('cursor-default')
		expect(cell.querySelector('svg')).not.toBeNull()
		expect(described(cell)).toBe('直す権限がありません。')
	})
})

describe('表の密度と行の高さ', () => {
	type Row = { id: string; name: string }
	const columns: ColumnDef<Row>[] = [
		{ accessorKey: 'name', header: '名前', meta: { maxWidth: 120 } },
		{
			id: 'price',
			header: '単価',
			cell: () => (
				<DataTableNumberCell
					ariaLabel='単価を変更'
					value={1}
					onSave={vi.fn()}
				/>
			),
			meta: { cellClassName: 'p-0' },
		},
	]
	const items = [
		{ id: '1', name: 'とても長い名前の商品（業務用・大容量パック）' },
	]
	it('コンパクトでは、見出し・セル・その場で直すセルが詰めた寸法になる', async () => {
		await render(
			<DataTable
				columns={columns}
				items={items}
				total={1}
				page={1}
				pageSize={20}
				onPageChange={vi.fn()}
				density='compact'
				hidePagination
			/>,
		)
		expect(document.querySelector('th')?.className).toContain('h-8')
		expect(document.querySelector('th')?.className).toContain('px-2')
		const cell = document.querySelector('td')
		expect(cell?.className).toContain('h-8')
		expect(cell?.firstElementChild?.className).toContain('max-h-8')
		expect(byLabel('単価を変更').className).toContain('h-[31px]')
		expect(byLabel('単価を変更').className).toContain('px-2')
	})
	it('既定は、中身を 1 行に収めて同じ高さにする。中身に合わせる形も選べる', async () => {
		await render(
			<DataTable
				columns={columns}
				items={items}
				total={1}
				page={1}
				pageSize={20}
				onPageChange={vi.fn()}
				hidePagination
			/>,
		)
		const content = document.querySelector('td')
			?.firstElementChild as HTMLElement
		expect(content.className).toContain('truncate')
		expect(content.className).toContain('max-h-10')
		expect(content.style.maxWidth).toBe('120px')
		await act(async () =>
			root?.render(
				<DataTable
					columns={columns}
					items={items}
					total={1}
					page={1}
					pageSize={20}
					onPageChange={vi.fn()}
					rowHeight='auto'
					hidePagination
				/>,
			),
		)
		expect(
			document.querySelector('td')?.firstElementChild?.className ?? '',
		).not.toContain('truncate')
	})
})
