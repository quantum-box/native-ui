// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import type { ColumnDef } from '@tanstack/react-table'

import { DataTable } from './data-table'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableSelectCell } from './data-table-select-cell'
import { DataTableViewNotice } from './data-table-view-notice'

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
	const host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	await act(async () => root?.render(node))
}
function button(label: string) {
	const match = Array.from(document.querySelectorAll('button')).find(
		node =>
			node.getAttribute('aria-label') === label || node.textContent === label,
	)
	if (!match) throw new Error(`Missing button ${label}`)
	return match
}
async function click(label: string) {
	await act(async () => button(label).click())
}
async function type(value: string) {
	const input = document.querySelector('input')!
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			'value',
		)!.set!.call(input, value)
		input.dispatchEvent(new Event('input', { bubbles: true }))
	})
}

describe('列の見出し（アプリの仕組みを使わずに動く）', () => {
	it('並び替えと固定を知らせ、閉じたことも知らせる', async () => {
		const sort = vi.fn()
		const pin = vi.fn()
		const open = vi.fn()
		await render(
			<DataTableColumnHeader
				label='商品名'
				sort={{ direction: 'desc', onChange: sort }}
				pin={{ pinned: false, onChange: pin }}
				onOpenChange={open}
			/>,
		)
		await click('商品名列のメニュー')
		await click('昇順に並び替え')
		expect(sort).toHaveBeenCalledWith('asc')
		expect(open).toHaveBeenLastCalledWith(false)
		await click('商品名列のメニュー')
		await click('並び替えを解除')
		expect(sort).toHaveBeenLastCalledWith(null)
		await click('商品名列のメニュー')
		await click('左に固定')
		expect(pin).toHaveBeenCalledWith(true)
		expect(document.querySelector('form')).toBeNull()
	})
	it('閉じたら書きかけを捨て、適用の前に確かめ、自分の項目だけを渡す', async () => {
		const apply = vi.fn()
		const clear = vi.fn()
		await render(
			<DataTableColumnHeader
				label='商品名'
				filter={{
					active: true,
					values: { title: '元の条件', unrelated: 'hidden' },
					fields: [{ key: 'title', label: '商品名' }],
					validate: values => (values.title === 'NG' ? '使用できません' : null),
					onApply: apply,
					onClear: clear,
				}}
			/>,
		)
		await click('商品名列のメニュー')
		await type('未適用')
		await act(async () =>
			document.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
			),
		)
		await click('商品名列のメニュー')
		expect(document.querySelector('input')?.value).toBe('元の条件')
		await type('NG')
		await click('適用')
		expect(apply).not.toHaveBeenCalled()
		expect(document.querySelector('[role=alert]')?.textContent).toBe(
			'使用できません',
		)
		await type('  新条件  ')
		await click('適用')
		expect(apply).toHaveBeenCalledExactlyOnceWith({ title: '新条件' })
		await click('商品名列のメニュー')
		await click('条件をクリア')
		expect(clear).toHaveBeenCalledOnce()
	})
})

const options = [
	{ value: 'draft', label: '下書き' },
	{ value: 'published', label: '公開中' },
]
async function selectPublished() {
	await click('商品Aの公開状態を変更')
	const option = Array.from(
		document.querySelectorAll<HTMLElement>('[role=option]'),
	).find(node => node.textContent?.includes('公開中'))!
	await act(async () => option.click())
}
describe('表の中で値を選ぶセル', () => {
	it('保存中は操作できず、失敗したら元に戻し、もう一度保存できる', async () => {
		let reject: (error: Error) => void = () => {}
		const save = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<void>((_, fail) => {
						reject = fail
					}),
			)
			.mockResolvedValueOnce(undefined)
		function Product() {
			const [value, setValue] = useState('draft')
			return (
				<DataTableSelectCell
					label='公開状態'
					ariaLabel='商品Aの公開状態を変更'
					value={value}
					options={options}
					onSave={async next => {
						await save(next)
						setValue(next)
					}}
					formatError={() => '再試行してください'}
				/>
			)
		}
		await render(<Product />)
		await selectPublished()
		expect(button('商品Aの公開状態を変更').textContent).toContain('公開中')
		expect(button('商品Aの公開状態を変更').getAttribute('aria-busy')).toBe(
			'true',
		)
		await click('商品Aの公開状態を変更')
		expect(document.querySelector('[role=dialog]')).toBeNull()
		expect(save).toHaveBeenCalledOnce()
		await act(async () => reject(new Error('save failed')))
		expect(button('商品Aの公開状態を変更').textContent).toContain('下書き')
		expect(document.querySelector('[role=alert]')?.textContent).toBe(
			'公開状態を「公開中」にできませんでした。 再試行してください 「下書き」のままです。',
		)
		await selectPublished()
		expect(save).toHaveBeenCalledTimes(2)
		expect(button('商品Aの公開状態を変更').textContent).toContain('公開中')
		expect(document.querySelector('[role=status]')?.textContent).toBe(
			'保存済み',
		)
		expect(document.querySelector('[role=alert]')).toBeNull()
	})
	it('選択肢が無いときは値だけを出し、操作できないときは設定への案内も出さない', async () => {
		const save = vi.fn()
		await render(
			<DataTableSelectCell
				label='公開状態'
				ariaLabel='商品Aの公開状態を変更'
				value='legacy'
				options={[]}
				disabled
				onSave={save}
				emptyOptionsAction={<a href='/settings'>設定</a>}
			/>,
		)
		expect(document.body.textContent).toContain('legacy')
		expect(document.querySelector('button, a')).toBeNull()
		expect(save).not.toHaveBeenCalled()
	})
})

type Row = { id: string; name: string }
const columns: ColumnDef<Row>[] = [
	{
		accessorKey: 'name',
		header: '名前',
		meta: { cellClassName: 'name-cell', headerClassName: 'name-head' },
	},
]
describe('一覧の表', () => {
	it('列ごとの class を付け、ページ送りを知らせる', async () => {
		const change = vi.fn()
		await render(
			<DataTable
				columns={columns}
				items={[{ id: '1', name: '商品A' }]}
				total={45}
				page={2}
				pageSize={20}
				onPageChange={change}
			/>,
		)
		expect(document.querySelector('th.name-head')?.textContent).toBe('名前')
		expect(document.querySelector('td.name-cell')?.textContent).toBe('商品A')
		expect(document.querySelector('nav')?.textContent).toContain(
			'45件 · 2 / 3ページ',
		)
		await click('前へ')
		expect(change).toHaveBeenLastCalledWith(1)
		await click('次へ')
		expect(change).toHaveBeenLastCalledWith(3)
	})
	it('最後のページでは次へ進めず、読み込み中は両方とも止める', async () => {
		await render(
			<DataTable
				columns={columns}
				items={[{ id: '1', name: '商品A' }]}
				total={40}
				page={2}
				pageSize={20}
				onPageChange={vi.fn()}
			/>,
		)
		expect(button('前へ').disabled).toBe(false)
		expect(button('次へ').disabled).toBe(true)
		await act(async () =>
			root?.render(
				<DataTable
					columns={columns}
					items={[]}
					total={40}
					page={1}
					pageSize={20}
					onPageChange={vi.fn()}
					busy
				/>,
			),
		)
		expect(document.querySelector('td')?.textContent).toBe('読み込んでいます…')
		expect(button('前へ').disabled).toBe(true)
		expect(button('次へ').disabled).toBe(true)
		expect(document.querySelector('[aria-busy=true]')).not.toBeNull()
	})
	it('行が無いときの文言を出し、ページ送りを隠せる', async () => {
		await render(
			<DataTable
				columns={columns}
				items={[]}
				total={0}
				page={1}
				pageSize={20}
				onPageChange={vi.fn()}
				emptyMessage='商品はまだありません。'
				hidePagination
			/>,
		)
		const cell = document.querySelector('td')
		expect(cell?.textContent).toBe('商品はまだありません。')
		expect(cell?.getAttribute('colspan')).toBe('1')
		expect(document.querySelector('nav')).toBeNull()
	})
})

describe('並び替え・絞り込みの案内', () => {
	it('効いているときだけ「すべて解除」を出す', async () => {
		const clear = vi.fn()
		await render(<DataTableViewNotice active={false} onClear={clear} />)
		expect(document.querySelector('button')).toBeNull()
		await act(async () =>
			root?.render(<DataTableViewNotice active onClear={clear} />),
		)
		await click('すべて解除')
		expect(clear).toHaveBeenCalledOnce()
	})
})
