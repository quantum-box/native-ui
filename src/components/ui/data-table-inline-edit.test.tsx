// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { DataTableDateCell } from './data-table-date-cell'
import {
	DataTableInlineEditFailureSummary,
	DataTableInlineEditFailuresProvider,
} from './data-table-inline-edit'
import { DataTableMultiSelectCell } from './data-table-multi-select-cell'
import {
	DataTableNumberCell,
	formatDataTableNumber,
	parseDataTableNumber,
} from './data-table-number-cell'
import { DataTableTextCell } from './data-table-text-cell'
import { DataTableToggleCell } from './data-table-toggle-cell'

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
function input() {
	const match = document.querySelector('input')
	if (!match) throw new Error('Missing input')
	return match
}
async function type(value: string) {
	const field = input()
	await act(async () => {
		Object.getOwnPropertyDescriptor(
			HTMLInputElement.prototype,
			'value',
		)?.set?.call(field, value)
		field.dispatchEvent(new Event('input', { bubbles: true }))
	})
}
async function press(key: string) {
	await act(async () => {
		input().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
	})
}
function alertText() {
	return document.querySelector('[role=alert]')?.textContent ?? null
}

/** 使う側が値を持つ形を真似る。 */
function Owned<T>({
	initial,
	save,
	children,
}: {
	initial: T
	save: (value: T) => Promise<void>
	children: (value: T, onSave: (value: T) => Promise<void>) => ReactNode
}) {
	const [value, setValue] = useState(initial)
	return (
		<>
			{children(value, async next => {
				await save(next)
				setValue(next)
			})}
		</>
	)
}

describe('数の読み取り', () => {
	it('全角の数字・桁区切り・通貨の記号を受け付ける', () => {
		expect(parseDataTableNumber('１，２００')).toEqual({ value: 1200 })
		expect(parseDataTableNumber('¥1,200円')).toEqual({ value: 1200 })
		expect(parseDataTableNumber(' －３５ ')).toEqual({ value: -35 })
		expect(parseDataTableNumber('12.5', { fractionDigits: 1 })).toEqual({
			value: 12.5,
		})
	})
	it('小数の桁・最小・最大・空を確かめる', () => {
		expect(parseDataTableNumber('12.5')).toEqual({
			error: '整数で入れてください。',
		})
		expect(parseDataTableNumber('1.234', { fractionDigits: 2 })).toEqual({
			error: '小数は 2 桁までです。',
		})
		expect(parseDataTableNumber('-1', { min: 0, prefix: '¥' })).toEqual({
			error: '¥0 以上で入れてください。',
		})
		expect(parseDataTableNumber('2000', { max: 1000 })).toEqual({
			error: '1,000 以下で入れてください。',
		})
		expect(parseDataTableNumber('')).toEqual({ error: '数を入れてください。' })
		expect(parseDataTableNumber('', { allowEmpty: true })).toEqual({
			value: null,
		})
		expect(parseDataTableNumber('1.2.3')).toEqual({
			error: '数を入れてください。',
		})
	})
	it('長い入力でもすぐに確かめ終える', () => {
		const started = Date.now()
		expect(parseDataTableNumber(`9${'99'.repeat(50000)}x`)).toEqual({
			error: '数を入れてください。',
		})
		expect(parseDataTableNumber('1.')).toEqual({ value: 1 })
		expect(parseDataTableNumber('.5', { fractionDigits: 1 })).toEqual({
			value: 0.5,
		})
		expect(Date.now() - started).toBeLessThan(1000)
	})
	it('桁区切りと前後の文字を付けて表示する', () => {
		expect(formatDataTableNumber(1234567, { prefix: '¥' })).toBe('¥1,234,567')
		expect(
			formatDataTableNumber(12.5, { suffix: '%', fractionDigits: 1 }),
		).toBe('12.5%')
		expect(formatDataTableNumber(null)).toBe('')
	})
})

describe('文字をその場で直すセル', () => {
	it('押して編集し、Enter で保存して、セルにフォーカスを戻す', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		await render(
			<Owned initial='りんご' save={save}>
				{(value, onSave) => (
					<DataTableTextCell
						ariaLabel='品目名を変更'
						value={value}
						onSave={onSave}
					/>
				)}
			</Owned>,
		)
		await click('品目名を変更')
		expect(document.activeElement).toBe(input())
		expect(input().value).toBe('りんご')
		await type('  みかん ')
		await press('Enter')
		expect(save).toHaveBeenCalledExactlyOnceWith('みかん')
		expect(button('品目名を変更').textContent).toContain('みかん')
		expect(document.querySelector('[role=status]')?.textContent).toBe(
			'保存済み',
		)
		expect(document.activeElement).toBe(button('品目名を変更'))
	})
	it('Esc でやめると保存しない', async () => {
		const save = vi.fn()
		await render(
			<DataTableTextCell ariaLabel='メモを変更' value='元' onSave={save} />,
		)
		await click('メモを変更')
		await type('書きかけ')
		await press('Escape')
		expect(save).not.toHaveBeenCalled()
		expect(button('メモを変更').textContent).toContain('元')
		expect(document.activeElement).toBe(button('メモを変更'))
	})
	it('確かめで止まったら編集を続け、ほかへ移ったら元の値のまま理由を出す', async () => {
		const save = vi.fn()
		await render(
			<DataTableTextCell
				ariaLabel='品目名を変更'
				value='りんご'
				required
				validate={value => (value === 'NG' ? '使えない名前です。' : null)}
				onSave={save}
			/>,
		)
		await click('品目名を変更')
		await type('')
		await press('Enter')
		expect(alertText()).toBe('入力してください。')
		expect(input().getAttribute('aria-invalid')).toBe('true')
		await type('NG')
		await press('Enter')
		expect(alertText()).toBe('使えない名前です。')
		await act(async () => input().blur())
		expect(document.querySelector('input')).toBeNull()
		expect(button('品目名を変更').textContent).toContain('りんご')
		expect(alertText()).toBe('使えない名前です。')
		expect(save).not.toHaveBeenCalled()
	})
	it('ほかへ移ると保存し、失敗したら元に戻して理由を出す', async () => {
		let reject: (error: Error) => void = () => {}
		const save = vi.fn(
			() =>
				new Promise<void>((_, fail) => {
					reject = fail
				}),
		)
		await render(
			<DataTableTextCell
				ariaLabel='メモを変更'
				value='元'
				onSave={save}
				formatError={() => 'メモを保存できませんでした。'}
			/>,
		)
		await click('メモを変更')
		await type('新しいメモ')
		await act(async () => input().blur())
		expect(save).toHaveBeenCalledWith('新しいメモ')
		expect(button('メモを変更').getAttribute('aria-busy')).toBe('true')
		expect(button('メモを変更').textContent).toContain('新しいメモ')
		await click('メモを変更')
		expect(document.querySelector('input')).toBeNull()
		await act(async () => reject(new Error('failed')))
		expect(button('メモを変更').textContent).toContain('元')
		expect(alertText()).toBe(
			'「新しいメモ」を保存できませんでした。 メモを保存できませんでした。 「元」のままです。',
		)
	})
	it('Tab などでほかへ移ったときは、フォーカスを元のセルに戻さない', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		await render(
			<>
				<DataTableTextCell ariaLabel='品目名を変更' value='元' onSave={save} />
				<button type='button'>次のセル</button>
			</>,
		)
		await click('品目名を変更')
		await type('新')
		await act(async () => button('次のセル').focus())
		expect(save).toHaveBeenCalledWith('新')
		expect(document.activeElement).toBe(button('次のセル'))
	})
	it('編集中はセルそのものが入力欄になり、箱の大きさと文字の位置が変わらない', async () => {
		await render(
			<DataTableTextCell
				ariaLabel='品目名を変更'
				value='りんご'
				onSave={vi.fn()}
			/>,
		)
		const box = (node: Element | null) =>
			(node?.className.match(/min-h-\[52px\]|px-5|py-2/g) ?? []).join(' ')
		const display = button('品目名を変更')
		expect(box(display)).toBe('min-h-[52px] px-5 py-2')
		await click('品目名を変更')
		const field = input()
		const cell = field.closest('div')
		expect(box(cell)).toBe('min-h-[52px] px-5 py-2')
		expect(cell?.className).toContain('ring-inset')
		// 入力欄に枠と余白は無い。
		expect(field.className).toContain('border-0')
		expect(field.className).toContain('p-0')
		// 右端の印の場所は、編集中も空けておく。
		expect(cell?.querySelector('[role=status]')).not.toBeNull()
	})
	it('失敗の理由は、セルの下に行を足さずに出す（赤い線・印・読み上げ）', async () => {
		await render(
			<DataTableTextCell
				ariaLabel='メモを変更'
				value='元'
				onSave={() => Promise.reject(new Error('failed'))}
				formatError={() => 'メモを保存できませんでした。'}
			/>,
		)
		await click('メモを変更')
		await type('新')
		await press('Enter')
		const cell = button('メモを変更')
		expect(cell.className).toContain('ring-destructive')
		expect(cell.querySelector('.text-destructive')).not.toBeNull()
		const reason = document.getElementById(
			cell.getAttribute('aria-describedby') ?? '',
		)
		expect(reason?.textContent).toContain('メモを保存できませんでした。')
		expect(reason?.textContent).toContain('「元」のままです。')
		expect(reason?.className).toContain('sr-only')
		// セルの中には行を足さない（理由は吹き出しに出る）。
		expect(cell.parentElement?.querySelector('p')).toBeNull()
	})
	it('失敗した直後は吹き出しが開き、何が失敗したか・理由・元の値と、もう一度・直すを出す', async () => {
		const save = vi
			.fn()
			.mockRejectedValueOnce(new Error('conflict'))
			.mockResolvedValueOnce(undefined)
		await render(
			<Owned initial='りんご' save={save}>
				{(value, onSave) => (
					<DataTableTextCell
						ariaLabel='品目名を変更'
						label='品目名'
						value={value}
						onSave={onSave}
						formatError={() => 'ほかの人が先に変えました。'}
					/>
				)}
			</Owned>,
		)
		await click('品目名を変更')
		await type('みかん')
		await press('Enter')
		const dialog = document.querySelector('[role=dialog]')
		expect(dialog?.textContent).toContain(
			'品目名を「みかん」にできませんでした',
		)
		expect(dialog?.textContent).toContain('ほかの人が先に変えました。')
		expect(dialog?.textContent).toContain('「りんご」のままです。')
		// キーボードでは ↓ で「もう一度」へ移れる。
		await act(async () => {
			button('品目名を変更').dispatchEvent(
				new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
			)
		})
		expect(document.activeElement?.textContent).toBe('もう一度')
		await click('もう一度')
		expect(save).toHaveBeenLastCalledWith('みかん')
		expect(button('品目名を変更').textContent).toContain('みかん')
		expect(document.querySelector('[role=dialog]')).toBeNull()
	})
	it('「直す」で、失敗した値を入れたまま編集に戻る', async () => {
		await render(
			<DataTableTextCell
				ariaLabel='品目名を変更'
				label='品目名'
				value='りんご'
				onSave={() => Promise.reject(new Error('failed'))}
			/>,
		)
		await click('品目名を変更')
		await type('みかん')
		await press('Enter')
		await click('直す')
		expect(input().value).toBe('みかん')
		expect(document.activeElement).toBe(input())
	})
	it('表の側で、失敗したセルの数を出し、押すとそのセルへ移る', async () => {
		const fail = () => Promise.reject(new Error('failed'))
		await render(
			<DataTableInlineEditFailuresProvider>
				<DataTableInlineEditFailureSummary />
				<DataTableTextCell
					ariaLabel='1行目を変更'
					label='品目名'
					value='a'
					onSave={fail}
				/>
				<DataTableToggleCell
					ariaLabel='2行目を公開する'
					label='公開'
					value={false}
					onSave={fail}
				/>
			</DataTableInlineEditFailuresProvider>,
		)
		expect(document.querySelector('[role=region]')).toBeNull()
		await click('1行目を変更')
		await type('b')
		await press('Enter')
		await act(async () =>
			document.querySelector<HTMLButtonElement>('[role=switch]')?.click(),
		)
		const summary = document.querySelector('[role=region]')
		expect(summary?.textContent).toContain('2件を保存できませんでした')
		const links = Array.from(summary?.querySelectorAll('button') ?? [])
		expect(links.map(link => link.textContent)).toEqual([
			'1. 品目名を「b」にできませんでした',
			'2. 公開を「オン」に切り替えられませんでした',
		])
		await act(async () => links[1].click())
		expect(document.activeElement?.getAttribute('role')).toBe('switch')
	})
	it('使えないときは編集を始めない', async () => {
		await render(
			<DataTableTextCell
				ariaLabel='メモを変更'
				value='元'
				disabled
				onSave={vi.fn()}
			/>,
		)
		expect(button('メモを変更').disabled).toBe(true)
		await click('メモを変更')
		expect(document.querySelector('input')).toBeNull()
	})
})

describe('数・金額をその場で直すセル', () => {
	it('全角と桁区切りで入れても数で保存し、通貨を付けて表示する', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		await render(
			<Owned<number | null> initial={980} save={save}>
				{(value, onSave) => (
					<DataTableNumberCell
						ariaLabel='単価を変更'
						prefix='¥'
						min={0}
						value={value}
						onSave={onSave}
					/>
				)}
			</Owned>,
		)
		expect(button('単価を変更').textContent).toContain('¥980')
		await click('単価を変更')
		// 表示と同じ文字で始まる（直し始めても文字が変わらない）。
		expect(input().value).toBe('¥980')
		await type('－５')
		await press('Enter')
		expect(alertText()).toBe('¥0 以上で入れてください。')
		await type('１，２００')
		await press('Enter')
		expect(save).toHaveBeenCalledExactlyOnceWith(1200)
		expect(button('単価を変更').textContent).toContain('¥1,200')
	})
})

describe('日付をその場で直すセル', () => {
	it('範囲の外を止め、範囲の中なら保存する', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		await render(
			<Owned initial='2026-11-24' save={save}>
				{(value, onSave) => (
					<DataTableDateCell
						ariaLabel='納期を変更'
						min='2026-11-01'
						value={value}
						onSave={onSave}
					/>
				)}
			</Owned>,
		)
		expect(button('納期を変更').textContent).toContain('2026/11/24')
		await click('納期を変更')
		await type('2026-10-31')
		await press('Enter')
		expect(alertText()).toBe('2026/11/01 以降で入れてください。')
		await type('2026-12-05')
		await press('Enter')
		expect(save).toHaveBeenCalledExactlyOnceWith('2026-12-05')
		expect(button('納期を変更').textContent).toContain('2026/12/05')
	})
})

describe('オン・オフを切り替えるセル', () => {
	it('切り替えるとすぐ保存し、失敗したら元に戻す', async () => {
		const save = vi
			.fn()
			.mockRejectedValueOnce(new Error('failed'))
			.mockResolvedValueOnce(undefined)
		await render(
			<Owned initial={false} save={save}>
				{(value, onSave) => (
					<DataTableToggleCell
						ariaLabel='商品Aを公開する'
						onLabel='公開'
						offLabel='非公開'
						value={value}
						onSave={onSave}
						formatError={() => '公開を切り替えられませんでした。'}
					/>
				)}
			</Owned>,
		)
		const toggle = () =>
			document.querySelector<HTMLButtonElement>('[role=switch]')
		await act(async () => toggle()?.click())
		expect(save).toHaveBeenCalledWith(true)
		expect(toggle()?.getAttribute('aria-checked')).toBe('false')
		expect(alertText()).toBe(
			'「公開」に切り替えられませんでした。 公開を切り替えられませんでした。 「非公開」のままです。',
		)
		await act(async () => toggle()?.click())
		expect(toggle()?.getAttribute('aria-checked')).toBe('true')
		expect(document.body.textContent).toContain('公開')
		expect(alertText()).toBeNull()
	})
})

const TAGS = [
	{ value: 'new', label: '新商品' },
	{ value: 'sale', label: 'セール' },
	{ value: 'limited', label: '限定' },
]
function option(text: string) {
	const match = Array.from(
		document.querySelectorAll<HTMLElement>('[role=option]'),
	).find(node => node.textContent?.includes(text))
	if (!match) throw new Error(`Missing option ${text}`)
	return match
}

describe('複数を選ぶセル', () => {
	it('付け外しして「保存」で選択肢の並びのまま保存する', async () => {
		const save = vi.fn().mockResolvedValue(undefined)
		await render(
			<Owned<readonly string[]> initial={['sale']} save={save}>
				{(value, onSave) => (
					<DataTableMultiSelectCell
						ariaLabel='タグを変更'
						label='タグ'
						options={TAGS}
						value={value}
						onSave={onSave}
					/>
				)}
			</Owned>,
		)
		await click('タグを変更')
		await act(async () => option('限定').click())
		await act(async () => option('新商品').click())
		expect(option('新商品').getAttribute('aria-checked')).toBe('true')
		await click('保存')
		expect(save).toHaveBeenCalledExactlyOnceWith(['new', 'sale', 'limited'])
		expect(button('タグを変更').textContent).toBe('新商品セール限定保存済み')
	})
	it('「やめる」と Esc では保存しない', async () => {
		const save = vi.fn()
		await render(
			<DataTableMultiSelectCell
				ariaLabel='タグを変更'
				label='タグ'
				options={TAGS}
				value={[]}
				onSave={save}
			/>,
		)
		await click('タグを変更')
		await act(async () => option('限定').click())
		await click('やめる')
		expect(document.querySelector('[role=dialog]')).toBeNull()
		await click('タグを変更')
		expect(option('限定').getAttribute('aria-checked')).toBe('false')
		await act(async () => option('限定').click())
		await act(async () =>
			document.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
			),
		)
		expect(document.querySelector('[role=dialog]')).toBeNull()
		expect(save).not.toHaveBeenCalled()
		expect(button('タグを変更').textContent).toContain('未設定')
	})
})
