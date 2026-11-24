// @vitest-environment jsdom
import { type ReactNode, act, useState } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	nextTypeaheadMatch,
} from './select'

// 閉じたままの Select の Trigger で頭の文字を打つと、合う項目を選ぶ（Radix と同じ）。

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
	vi.useRealTimers()
})
async function render(node: ReactNode) {
	const el = document.createElement('div')
	document.body.appendChild(el)
	root = createRoot(el)
	await act(async () => root?.render(node))
	// 閉じているあいだの項目の写しは、描いた後に作られる
	await act(async () => new Promise(r => setTimeout(r, 0)))
	return el
}
async function type(el: Element, key: string) {
	await act(async () => {
		el.dispatchEvent(
			new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
		)
	})
}

const ITEMS = [
	{ value: 'backlog', text: 'Backlog' },
	{ value: 'blocked', text: 'Blocked' },
	{ value: 'todo', text: 'Todo' },
	{ value: 'done', text: 'Done' },
]

describe('nextTypeaheadMatch（Radix と同じ探し方）', () => {
	it('打った文字で始まる項目を、今の項目の次から探す', () => {
		expect(nextTypeaheadMatch(ITEMS, 'd', undefined)).toBe('done')
		expect(nextTypeaheadMatch(ITEMS, 'T', 'done')).toBe('todo')
	})
	it('同じ文字を続けて打つと、その文字で始まる項目を順に回る', () => {
		expect(nextTypeaheadMatch(ITEMS, 'b', 'backlog')).toBe('blocked')
		expect(nextTypeaheadMatch(ITEMS, 'bb', 'blocked')).toBe('backlog')
	})
	it('続けて打った文字（"bl"）は、まとめて探す', () => {
		expect(nextTypeaheadMatch(ITEMS, 'bl', 'backlog')).toBe('blocked')
	})
	it('合う物が無い・今の項目しか合わないときは、変えない', () => {
		expect(nextTypeaheadMatch(ITEMS, 'x', 'todo')).toBeUndefined()
		expect(nextTypeaheadMatch(ITEMS, 'to', 'todo')).toBeUndefined()
	})
})

function Status({ onChange }: { onChange?: (value: string) => void }) {
	return (
		<Select onValueChange={onChange}>
			<SelectTrigger aria-label='状態'>
				<SelectValue placeholder='選ぶ' />
			</SelectTrigger>
			<SelectContent>
				<SelectItem value='backlog'>Backlog</SelectItem>
				<SelectItem value='blocked' disabled>
					Blocked
				</SelectItem>
				<SelectItem value='todo'>Todo</SelectItem>
				<SelectItem value='done'>Done</SelectItem>
				<SelectItem value='canceled' textValue='Canceled'>
					<span>✕</span> Canceled
				</SelectItem>
			</SelectContent>
		</Select>
	)
}

describe('閉じたままの Trigger で頭の文字を打つ', () => {
	it('合う項目を選び、開かない', async () => {
		const onChange = vi.fn()
		const el = await render(<Status onChange={onChange} />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await type(trigger, 'd')
		expect(onChange).toHaveBeenLastCalledWith('done')
		expect(trigger.textContent).toContain('Done')
		expect(trigger.getAttribute('aria-expanded')).not.toBe('true')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

	it('使えない項目は飛ばし、textValue でも探せる', async () => {
		vi.useFakeTimers({ shouldAdvanceTime: true })
		const onChange = vi.fn()
		const el = await render(<Status onChange={onChange} />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await type(trigger, 'b')
		expect(onChange).toHaveBeenLastCalledWith('backlog')
		await act(async () => vi.advanceTimersByTime(1100))
		// Blocked は使えないので、もう一度 b を打っても Backlog のまま
		await type(trigger, 'b')
		expect(onChange).toHaveBeenCalledTimes(1)
		await act(async () => vi.advanceTimersByTime(1100))
		await type(trigger, 'c')
		expect(onChange).toHaveBeenLastCalledWith('canceled')
	})

	it('外で値を持つ形でも、外の値から次を探す', async () => {
		function Controlled() {
			const [value, setValue] = useState('todo')
			return (
				<>
					<output>{value}</output>
					<Select value={value} onValueChange={setValue}>
						<SelectTrigger aria-label='状態'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='tea'>Tea</SelectItem>
							<SelectItem value='todo'>Todo</SelectItem>
							<SelectItem value='toast'>Toast</SelectItem>
						</SelectContent>
					</Select>
				</>
			)
		}
		const el = await render(<Controlled />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await type(trigger, 't')
		expect(el.querySelector('output')?.textContent).toBe('toast')
	})

	it('打ち始めの空白はこれまでどおり開く（文字として探さない）', async () => {
		const onChange = vi.fn()
		const el = await render(<Status onChange={onChange} />)
		const trigger = el.querySelector('[role="combobox"]') as HTMLElement
		await type(trigger, ' ')
		expect(onChange).not.toHaveBeenCalled()
	})
})
