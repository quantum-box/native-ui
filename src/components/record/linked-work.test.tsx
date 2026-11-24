// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
	type LinkedWork,
	LinkWorkDialog,
	LinkedWorkItem,
	LinkedWorkList,
	type LinkedWorkRecord,
	WorkOrigin,
	defineLinkedWorkKind,
} from './linked-work'
import { RecordKindProvider } from './record'

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

const KINDS = {
	'linear.issue': defineLinkedWorkKind({
		name: 'Issue',
		system: 'linear',
		openLabel: 'Linear で開く',
	}),
	'field.inquiry': defineLinkedWorkKind({
		name: '問い合わせ',
		system: 'field',
	}),
}
const SYSTEMS = {
	linear: { name: 'Linear', tone: 'violet' as const },
	field: { name: 'Field', tone: 'teal' as const },
}
const COM929: LinkedWorkRecord = {
	id: 'com-929',
	publicId: 'COM-929',
	title: 'レジの入れ替え先を決める',
	progress: 'open',
	url: 'https://linear.app/x/issue/COM-929',
}
const COM931: LinkedWorkRecord = {
	id: 'com-931',
	publicId: 'COM-931',
	title: '研修の日程を組む',
	progress: 'done',
}

async function render(node: ReactNode) {
	const host = document.createElement('div')
	document.body.append(host)
	root = createRoot(host)
	await act(async () =>
		root?.render(
			<RecordKindProvider kinds={KINDS} systems={SYSTEMS} currentSystem='field'>
				{node}
			</RecordKindProvider>,
		),
	)
}
const text = () => document.body.textContent ?? ''
function button(label: string) {
	const match = Array.from(document.querySelectorAll('button')).find(
		node =>
			node.textContent?.trim() === label ||
			node.getAttribute('aria-label') === label,
	)
	if (!match) throw new Error(`Missing button ${label}`)
	return match
}
const work = (patch: Partial<LinkedWork>): LinkedWork => ({
	id: 'l1',
	kind: 'linear.issue',
	relation: 'executes',
	record: COM929,
	...patch,
})

describe('結んだ仕事 1 つ', () => {
	it('番号と題名、進み具合と結び方の札、外へ出る「Linear で開く」を出す', async () => {
		await render(
			<ul>
				<LinkedWorkItem work={work({})} onUnlink={vi.fn()} />
			</ul>,
		)
		expect(text()).toContain('COM-929 レジの入れ替え先を決める')
		expect(text()).toContain('進行中')
		expect(text()).toContain('進める仕事')
		const open = Array.from(document.querySelectorAll('a')).find(
			a => a.textContent === 'Linear で開く',
		)
		expect(open?.getAttribute('target')).toBe('_blank')
		expect(open?.getAttribute('href')).toBe(COM929.url)
	})
	it('読めない様子ごとに、理由と次の一手を出し、分かっている番号は添える', async () => {
		const onConnect = vi.fn()
		const onReload = vi.fn()
		await render(
			<ul>
				<LinkedWorkItem
					work={work({ id: 'a', read: 'stale' })}
					onReload={onReload}
					onConnect={onConnect}
				/>
				<LinkedWorkItem
					work={work({ id: 'b', read: 'unconnected' })}
					onReload={onReload}
					onConnect={onConnect}
				/>
				<LinkedWorkItem
					work={work({
						id: 'c',
						read: 'revoked',
						record: { id: 'x', publicId: 'COM-800' },
					})}
					onReload={onReload}
					onConnect={onConnect}
				/>
				<LinkedWorkItem
					work={work({
						id: 'd',
						read: 'forbidden',
						record: { id: 'y', publicId: 'PLT-7001' },
					})}
					onReload={onReload}
					onConnect={onConnect}
				/>
			</ul>,
		)
		expect(text()).toContain(
			'Linear の内容が変わりました。読み直してください。',
		)
		expect(text()).toContain('古い')
		expect(text()).toContain('Linear とつないでいないため、状態を読めません。')
		expect(text()).toContain('COM-800')
		expect(text()).toContain('Issue（見る権限がありません）')
		expect(text()).toContain('PLT-7001')
		await act(async () => button('Linear をつなぐ').click())
		await act(async () => button('Linear をつなぎ直す').click())
		await act(async () => button('読み直す').click())
		expect(onConnect).toHaveBeenCalledTimes(2)
		expect(onReload).toHaveBeenCalledOnce()
	})
	it('「外す」は理由を書かせてから外す', async () => {
		const onUnlink = vi.fn().mockResolvedValue(undefined)
		await render(
			<ul>
				<LinkedWorkItem work={work({})} onUnlink={onUnlink} />
			</ul>,
		)
		await act(async () => button('外す').click())
		const submit = () =>
			Array.from(
				document.querySelectorAll<HTMLButtonElement>('[role=dialog] button'),
			).find(node => node.textContent === '外す')
		await act(async () => submit()?.click())
		expect(
			document.querySelector('[role=dialog] [role=alert]')?.textContent,
		).toBe('外す理由を書いてください。')
		expect(onUnlink).not.toHaveBeenCalled()
		const field = document.querySelector('textarea') as HTMLTextAreaElement
		await act(async () => {
			Object.getOwnPropertyDescriptor(
				HTMLTextAreaElement.prototype,
				'value',
			)?.set?.call(field, '別の行動で進める')
			field.dispatchEvent(new Event('input', { bubbles: true }))
		})
		await act(async () => submit()?.click())
		expect(onUnlink).toHaveBeenCalledWith(
			expect.objectContaining({ id: 'l1' }),
			'別の行動で進める',
		)
	})
})

describe('結んだ仕事の一覧', () => {
	it('まとめ・発生元・外した仕事・つないでいないときの次の一手を出す', async () => {
		const onConnect = vi.fn()
		await render(
			<>
				<LinkedWorkList
					title='Linear の Issue'
					origin={{ kind: 'linear.issue', record: COM929, receivedCount: 3 }}
					links={[
						work({}),
						work({ id: 'l2', relation: 'references', record: COM931 }),
						work({
							id: 'l3',
							record: COM931,
							withdrawn: { at: '2026/11/20', reason: '重複' },
						}),
					]}
				/>
				<LinkedWorkList
					title='Linear の Issue'
					links={[]}
					canLink={false}
					cannotLinkReason='Linear とつないでいないため、結べません。'
					connectAction={{ label: 'Linear をつなぐ', onSelect: onConnect }}
				/>
			</>,
		)
		expect(text()).toContain('進行中 1 件 · 完了 1 件')
		expect(text()).toContain('この行動は Linear の')
		expect(text()).toContain('（3 回受けました）')
		expect(text()).toContain('外した仕事 1 件')
		expect(text()).not.toContain('重複')
		await act(async () => button('外した仕事 1 件').click())
		expect(text()).toContain('2026/11/20 に外しました（理由: 重複）')
		expect(text()).toContain('Linear とつないでいないため、結べません。')
		await act(async () => button('Linear をつなぐ').click())
		expect(onConnect).toHaveBeenCalledOnce()
	})
})

describe('結ぶ手順', () => {
	it('種類が 1 つなら種類の段を出さず、チーム → 選ぶ → 結び方 → 結ぶ の順に進む', async () => {
		const onSubmit = vi
			.fn()
			.mockRejectedValueOnce(new Error('同じ仕事をすでに結んでいます。'))
			.mockResolvedValueOnce(undefined)
		const onSelectionChange = vi.fn()
		const onLoadMore = vi.fn()
		await render(
			<LinkWorkDialog
				open
				onOpenChange={vi.fn()}
				kinds={[
					{
						kind: 'linear.issue',
						label: 'Linear の Issue',
						sourceLabel: 'チーム',
						sources: [
							{ id: 'com', label: 'COM' },
							{ id: 'plt', label: 'PLT' },
						],
					},
				]}
				candidates={[COM929, COM931]}
				hasMore
				onLoadMore={onLoadMore}
				onSelectionChange={onSelectionChange}
				onSubmit={onSubmit}
				formatError={error => (error as Error).message}
			/>,
		)
		const dialog = () => document.querySelector('[role=dialog]')
		expect(dialog()?.textContent).not.toContain('何を結ぶか')
		expect(dialog()?.textContent).toContain('どのチームから')
		expect(dialog()?.textContent).toContain('Linear の Issue を選ぶ')
		expect(dialog()?.textContent).not.toContain('結び方')
		expect(onSelectionChange).toHaveBeenLastCalledWith({
			kind: 'linear.issue',
			source: 'com',
		})
		const plt = Array.from(document.querySelectorAll('label')).find(
			label => label.textContent === 'PLT',
		)
		await act(async () => plt?.click())
		expect(onSelectionChange).toHaveBeenLastCalledWith({
			kind: 'linear.issue',
			source: 'plt',
		})
		await act(async () => button('Linear の Issue を選ぶ').click())
		const option = (label: string) =>
			Array.from(document.querySelectorAll<HTMLElement>('[role=option]')).find(
				node => node.textContent?.includes(label),
			)
		await act(async () => option('続きを読む')?.click())
		expect(onLoadMore).toHaveBeenCalledOnce()
		await act(async () => option('COM-931')?.click())
		expect(dialog()?.textContent).toContain('結び方')
		const reference = Array.from(document.querySelectorAll('label')).find(
			label => label.textContent?.startsWith('参考にするだけ'),
		)
		await act(async () => reference?.click())
		await act(async () => button('結ぶ').click())
		expect(
			document.querySelector('[role=dialog] [role=alert]')?.textContent,
		).toBe('同じ仕事をすでに結んでいます。')
		await act(async () => button('結ぶ').click())
		expect(onSubmit).toHaveBeenLastCalledWith({
			kind: 'linear.issue',
			source: 'plt',
			record: COM931,
			relation: 'references',
		})
	})
})

describe('結ぶ手順（使う側が描き直したとき）', () => {
	it('kinds や関数が作り直されても、選んだ物を消さず、読み直しも繰り返さない。探している間も「続きを読む」が出る', async () => {
		const loads: string[] = []
		let rerender: () => void = () => {}
		function Owner() {
			const [, setCount] = useState(0)
			rerender = () => setCount(count => count + 1)
			return (
				<LinkWorkDialog
					open
					onOpenChange={vi.fn()}
					// わざと毎回新しい配列と関数を渡す。
					kinds={[
						{
							kind: 'linear.issue',
							label: 'Linear の Issue',
							sources: [
								{ id: 'com', label: 'COM' },
								{ id: 'plt', label: 'PLT' },
							],
						},
					]}
					candidates={[COM929, COM931]}
					hasMore
					onLoadMore={vi.fn()}
					onSelectionChange={selection => {
						loads.push(`${selection.kind}:${selection.source}`)
					}}
					onSubmit={vi.fn()}
				/>
			)
		}
		await render(<Owner />)
		const plt = Array.from(document.querySelectorAll('label')).find(
			label => label.textContent === 'PLT',
		)
		await act(async () => plt?.click())
		await act(async () => button('Linear の Issue を選ぶ').click())
		const search = document.querySelector('[cmdk-input]') as HTMLInputElement
		await act(async () => {
			Object.getOwnPropertyDescriptor(
				HTMLInputElement.prototype,
				'value',
			)?.set?.call(search, 'COM-999')
			search.dispatchEvent(new Event('input', { bubbles: true }))
		})
		expect(
			Array.from(document.querySelectorAll('[role=option]')).map(
				node => node.textContent,
			),
		).toContain('続きを読む')
		const option = Array.from(
			document.querySelectorAll<HTMLElement>('[role=option]'),
		).find(node => node.textContent?.includes('続きを読む'))
		expect(option).toBeTruthy()
		// 候補を選ぶ（探す文字を消してから）。
		await act(async () => {
			Object.getOwnPropertyDescriptor(
				HTMLInputElement.prototype,
				'value',
			)?.set?.call(search, '')
			search.dispatchEvent(new Event('input', { bubbles: true }))
		})
		const com931 = Array.from(
			document.querySelectorAll<HTMLElement>('[role=option]'),
		).find(node => node.textContent?.includes('COM-931'))
		await act(async () => com931?.click())
		expect(loads).toEqual(['linear.issue:com', 'linear.issue:plt'])
		await act(async () => rerender())
		await act(async () => rerender())
		const checked = Array.from(
			document.querySelectorAll<HTMLInputElement>('input[type=radio]'),
		).find(
			input => input.checked && input.closest('label')?.textContent === 'PLT',
		)
		expect(checked).toBeTruthy()
		expect(button('Linear の Issue を選ぶ').textContent).toContain('COM-931')
		expect(loads).toEqual(['linear.issue:com', 'linear.issue:plt'])
	})
})

describe('発生元', () => {
	it('どの外の仕事から生まれたかと、受けた回数を出す', async () => {
		await render(
			<WorkOrigin kind='linear.issue' record={COM929} receivedCount={3} />,
		)
		expect(text()).toBe(
			'この行動は Linear の COM-929 レジの入れ替え先を決める下矢印キーで、要点と開く操作へ移ります から生まれました（3 回受けました）。',
		)
	})
})
