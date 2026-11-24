// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { Calendar, type DateRange } from './calendar'
import { DatePicker, DateRangePicker } from './date-picker'
import { Field } from './field'

// カレンダーと日付の入力欄が、1 日を選ぶ・期間を選ぶ・選べない日・月の移動・
// キーボードの操作をできることを確かめる。「今日」は 2026-11-24（火）に固定する。

const TODAY = '2026-11-24'

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
	Element.prototype.hasPointerCapture = vi.fn(() => false)
	Element.prototype.releasePointerCapture = vi.fn()
	Element.prototype.setPointerCapture = vi.fn()
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

const day = (date: string) => {
	const el = document.querySelector<HTMLButtonElement>(`[data-date="${date}"]`)
	if (!el) throw new Error(`${date} の日が表に無い`)
	return el
}
const button = (name: string) => {
	const el = document.querySelector<HTMLButtonElement>(
		`button[aria-label="${name}"]`,
	)
	if (!el) throw new Error(`「${name}」のボタンが無い`)
	return el
}
const heading = () =>
	document.querySelector('[data-slot="calendar"] [aria-live]')?.textContent
async function click(el: Element) {
	await act(async () => {
		;(el as HTMLElement).click()
	})
}
async function key(el: Element, name: string, init: KeyboardEventInit = {}) {
	await act(async () => {
		el.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: name,
				bubbles: true,
				cancelable: true,
				...init,
			}),
		)
	})
}
const focused = () =>
	(document.activeElement as HTMLElement | null)?.dataset.date
async function type(input: HTMLInputElement, text: string) {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		'value',
	)?.set
	await act(async () => {
		input.focus()
		setter?.call(input, text)
		input.dispatchEvent(new Event('input', { bubbles: true }))
	})
}
async function blur(input: HTMLInputElement) {
	await act(async () => {
		input.blur()
	})
}

describe('Calendar: 1 日を選ぶ', () => {
	it('選んだ日の月を見せ、選んだ日に印を付ける', async () => {
		await render(<Calendar today={TODAY} defaultValue='2026-03-15' />)
		expect(heading()).toBe('2026年3月')
		expect(day('2026-03-15').closest('td')?.getAttribute('aria-selected')).toBe(
			'true',
		)
		expect(day('2026-03-16').closest('td')?.getAttribute('aria-selected')).toBe(
			'false',
		)
		expect(document.querySelectorAll('[role="grid"] tbody tr')).toHaveLength(6)
	})

	it('値が無ければ今日の月を見せ、今日に印を付ける', async () => {
		await render(<Calendar today={TODAY} />)
		expect(heading()).toBe('2026年11月')
		expect(day(TODAY).getAttribute('aria-current')).toBe('date')
		expect(day(TODAY).getAttribute('aria-label')).toBe(
			'2026年11月24日 火曜日 今日',
		)
	})

	it('日を押すと、その日を知らせる', async () => {
		const onValueChange = vi.fn()
		await render(<Calendar today={TODAY} onValueChange={onValueChange} />)
		await click(day('2026-11-18'))
		expect(onValueChange).toHaveBeenCalledWith('2026-11-18')
		expect(day('2026-11-18').closest('td')?.getAttribute('aria-selected')).toBe(
			'true',
		)
	})

	it('外で値を持つときは、渡した値のまま', async () => {
		const onValueChange = vi.fn()
		await render(
			<Calendar
				today={TODAY}
				value='2026-11-10'
				onValueChange={onValueChange}
			/>,
		)
		await click(day('2026-11-18'))
		expect(onValueChange).toHaveBeenCalledWith('2026-11-18')
		expect(day('2026-11-10').closest('td')?.getAttribute('aria-selected')).toBe(
			'true',
		)
	})

	it('前後の月の日を押すと、その月へ動く', async () => {
		await render(<Calendar today={TODAY} />)
		await click(day('2026-12-03'))
		expect(heading()).toBe('2026年12月')
	})
})

describe('Calendar: 月の移動', () => {
	it('左右のボタンで前後の月へ動き、年もまたぐ', async () => {
		const onMonthChange = vi.fn()
		await render(
			<Calendar
				today={TODAY}
				defaultMonth='2026-12'
				onMonthChange={onMonthChange}
			/>,
		)
		await click(button('次の月'))
		expect(heading()).toBe('2027年1月')
		expect(onMonthChange).toHaveBeenLastCalledWith('2027-01')
		await click(button('前の月'))
		await click(button('前の月'))
		expect(heading()).toBe('2026年11月')
	})

	it('月を動かしても、Tab で止まる日は表の中に 1 つだけ', async () => {
		await render(<Calendar today={TODAY} />)
		for (let i = 0; i < 3; i++) await click(button('次の月'))
		expect(
			document.querySelectorAll('[role="grid"] button[tabindex="0"]'),
		).toHaveLength(1)
	})

	it('min・max の外の月へは動けない', async () => {
		await render(
			<Calendar
				today={TODAY}
				min='2026-11-09'
				max='2026-12-11'
				defaultMonth='2026-11'
			/>,
		)
		expect(button('前の月').disabled).toBe(true)
		expect(button('次の月').disabled).toBe(false)
		await click(button('次の月'))
		expect(button('次の月').disabled).toBe(true)
	})

	it('外で月を持つときは、渡した月のまま', async () => {
		const onMonthChange = vi.fn()
		await render(
			<Calendar today={TODAY} month='2026-05' onMonthChange={onMonthChange} />,
		)
		await click(button('次の月'))
		expect(onMonthChange).toHaveBeenCalledWith('2026-06')
		expect(heading()).toBe('2026年5月')
	})
})

describe('Calendar: 選べない日', () => {
	it('min より前・max より後・isDateDisabled の日は、押しても選ばれない', async () => {
		const onValueChange = vi.fn()
		await render(
			<Calendar
				today={TODAY}
				min='2026-11-09'
				max='2026-11-27'
				isDateDisabled={date => date === '2026-11-18'}
				onValueChange={onValueChange}
			/>,
		)
		for (const date of ['2026-11-08', '2026-11-28', '2026-11-18']) {
			expect(day(date).getAttribute('aria-disabled')).toBe('true')
			await click(day(date))
		}
		expect(onValueChange).not.toHaveBeenCalled()
		expect(day('2026-11-09').getAttribute('aria-disabled')).toBeNull()
		await click(day('2026-11-27'))
		expect(onValueChange).toHaveBeenCalledWith('2026-11-27')
	})

	it('選べない日は Enter でも選ばれない', async () => {
		const onValueChange = vi.fn()
		await render(
			<Calendar
				today={TODAY}
				isDateDisabled={date => date === TODAY}
				onValueChange={onValueChange}
			/>,
		)
		await key(day(TODAY), 'Enter')
		expect(onValueChange).not.toHaveBeenCalled()
	})
})

describe('Calendar: キーボード', () => {
	it('矢印で 1 日・1 週ずつ動く', async () => {
		await render(<Calendar today={TODAY} autoFocus />)
		expect(focused()).toBe(TODAY)
		await key(day(TODAY), 'ArrowRight')
		expect(focused()).toBe('2026-11-25')
		await key(day('2026-11-25'), 'ArrowLeft')
		await key(day(TODAY), 'ArrowDown')
		expect(focused()).toBe('2026-12-01')
		await key(day('2026-12-01'), 'ArrowUp')
		expect(focused()).toBe(TODAY)
	})

	it('Home・End で週の端へ動く（週のはじめに合わせる）', async () => {
		await render(<Calendar today={TODAY} autoFocus />)
		await key(day(TODAY), 'Home')
		expect(focused()).toBe('2026-11-22')
		await key(day('2026-11-22'), 'End')
		expect(focused()).toBe('2026-11-28')
	})

	it('月曜はじまりなら、Home は月曜・End は日曜', async () => {
		await render(<Calendar today={TODAY} autoFocus weekStartsOn={1} />)
		expect(document.querySelector('[role="grid"] thead th')?.textContent).toBe(
			'月',
		)
		await key(day(TODAY), 'Home')
		expect(focused()).toBe('2026-11-23')
		await key(day('2026-11-23'), 'End')
		expect(focused()).toBe('2026-11-29')
	})

	it('PageUp・PageDown で前後の月、Shift を足すと前後の年', async () => {
		await render(<Calendar today={TODAY} autoFocus />)
		await key(day(TODAY), 'PageDown')
		expect(focused()).toBe('2026-12-24')
		expect(heading()).toBe('2026年12月')
		await key(day('2026-12-24'), 'PageUp')
		await key(day(TODAY), 'PageUp', { shiftKey: true })
		expect(focused()).toBe('2025-11-24')
		expect(heading()).toBe('2025年11月')
		await key(day('2025-11-24'), 'PageDown', { shiftKey: true })
		expect(focused()).toBe(TODAY)
	})

	it('月の端を矢印でこえると、次の月へ動く', async () => {
		await render(<Calendar today={TODAY} defaultValue='2026-11-30' autoFocus />)
		for (const from of [
			'2026-11-30',
			'2026-12-07',
			'2026-12-14',
			'2026-12-21',
		]) {
			await key(day(from), 'ArrowDown')
		}
		expect(focused()).toBe('2026-12-28')
		expect(heading()).toBe('2026年12月')
	})

	it('min・max の外へは動かない', async () => {
		await render(
			<Calendar today={TODAY} autoFocus min='2026-11-23' max='2026-11-25' />,
		)
		await key(day(TODAY), 'ArrowUp')
		expect(focused()).toBe('2026-11-23')
		await key(day('2026-11-23'), 'PageDown')
		expect(focused()).toBe('2026-11-25')
	})

	it('Enter と Space で選ぶ', async () => {
		const onValueChange = vi.fn()
		await render(
			<Calendar today={TODAY} autoFocus onValueChange={onValueChange} />,
		)
		await key(day(TODAY), 'ArrowRight')
		await key(day('2026-11-25'), 'Enter')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-25')
		await key(day('2026-11-25'), 'ArrowRight')
		await key(day('2026-11-26'), ' ')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-26')
	})
})

describe('Calendar: 扱える範囲の端', () => {
	it('9999 年 12 月を見せても落ちず、先の月へは動けない', async () => {
		const onValueChange = vi.fn()
		await render(
			<Calendar
				today={TODAY}
				defaultValue='9999-12-01'
				autoFocus
				onValueChange={onValueChange}
			/>,
		)
		expect(heading()).toBe('9999年12月')
		expect(button('次の月').disabled).toBe(true)
		expect(document.querySelector('[data-date^="10000"]')).toBeNull()
		await key(day('9999-12-01'), 'PageDown')
		expect(focused()).toBe('9999-12-31')
		await key(day('9999-12-31'), 'ArrowRight')
		expect(focused()).toBe('9999-12-31')
		await key(day('9999-12-31'), 'Enter')
		expect(onValueChange).toHaveBeenLastCalledWith('9999-12-31')
	})

	it('1 年 1 月を見せても落ちず、前の月へは動けない', async () => {
		await render(<Calendar today={TODAY} defaultValue='0001-01-01' autoFocus />)
		expect(heading()).toBe('1年1月')
		expect(button('前の月').disabled).toBe(true)
		await key(day('0001-01-01'), 'ArrowLeft')
		expect(focused()).toBe('0001-01-01')
	})
})

describe('Calendar: 期間を選ぶ', () => {
	it('1 回目ではじめ、2 回目で終わりが決まる', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		await render(
			<Calendar mode='range' today={TODAY} onValueChange={onValueChange} />,
		)
		await click(day('2026-11-10'))
		expect(onValueChange).toHaveBeenLastCalledWith({
			from: '2026-11-10',
			to: '',
		})
		await click(day('2026-11-18'))
		expect(onValueChange).toHaveBeenLastCalledWith({
			from: '2026-11-10',
			to: '2026-11-18',
		})
		expect(document.querySelectorAll('td[aria-selected="true"]')).toHaveLength(
			9,
		)
		expect(
			document
				.querySelector('[role="grid"]')
				?.getAttribute('aria-multiselectable'),
		).toBe('true')
	})

	it('終わりを先に押しても、早い日がはじめになる', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		await render(
			<Calendar mode='range' today={TODAY} onValueChange={onValueChange} />,
		)
		await click(day('2026-11-18'))
		await click(day('2026-11-10'))
		expect(onValueChange).toHaveBeenLastCalledWith({
			from: '2026-11-10',
			to: '2026-11-18',
		})
	})

	it('同じ日を 2 回押すと、1 日だけの期間になる', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		await render(
			<Calendar mode='range' today={TODAY} onValueChange={onValueChange} />,
		)
		await click(day('2026-11-10'))
		await click(day('2026-11-10'))
		expect(onValueChange).toHaveBeenLastCalledWith({
			from: '2026-11-10',
			to: '2026-11-10',
		})
	})

	it('決まった期間のあとに押すと、選び直しになる', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		await render(
			<Calendar
				mode='range'
				today={TODAY}
				defaultValue={{ from: '2026-11-10', to: '2026-11-18' }}
				onValueChange={onValueChange}
			/>,
		)
		await click(day('2026-11-20'))
		expect(onValueChange).toHaveBeenLastCalledWith({
			from: '2026-11-20',
			to: '',
		})
	})
})

describe('DatePicker', () => {
	const input = () => {
		const el = document.querySelector<HTMLInputElement>('input[type="text"]')
		if (!el) throw new Error('入力欄が無い')
		return el
	}

	it('値を 2026/11/24 の形で見せる', async () => {
		await render(<DatePicker today={TODAY} defaultValue='2026-11-18' />)
		expect(input().value).toBe('2026/11/18')
	})

	it('手で打って欄を離れると、日付に直して知らせる', async () => {
		const onValueChange = vi.fn()
		await render(<DatePicker today={TODAY} onValueChange={onValueChange} />)
		await type(input(), '12/5')
		expect(onValueChange).not.toHaveBeenCalled()
		await blur(input())
		expect(onValueChange).toHaveBeenCalledWith('2026-12-05')
		expect(input().value).toBe('2026/12/05')
	})

	it('Enter でも確かめる', async () => {
		const onValueChange = vi.fn()
		await render(<DatePicker today={TODAY} onValueChange={onValueChange} />)
		await type(input(), '20261205')
		await key(input(), 'Enter')
		expect(onValueChange).toHaveBeenCalledWith('2026-12-05')
	})

	it('読めない文字と選べない日は、元の値に戻す', async () => {
		const onValueChange = vi.fn()
		await render(
			<DatePicker
				today={TODAY}
				defaultValue='2026-11-18'
				max={TODAY}
				onValueChange={onValueChange}
			/>,
		)
		await type(input(), 'あした')
		await blur(input())
		expect(input().value).toBe('2026/11/18')
		await type(input(), '2026/11/25')
		await blur(input())
		expect(input().value).toBe('2026/11/18')
		expect(onValueChange).not.toHaveBeenCalled()
	})

	it('空にして欄を離れると、空を知らせる。required なら元の値に戻す', async () => {
		const onValueChange = vi.fn()
		const el = await render(
			<DatePicker
				today={TODAY}
				defaultValue='2026-11-18'
				onValueChange={onValueChange}
			/>,
		)
		await type(input(), '')
		await blur(input())
		expect(onValueChange).toHaveBeenCalledWith('')
		await act(async () => root?.unmount())
		el.remove()

		await render(
			<DatePicker today={TODAY} defaultValue='2026-11-18' required />,
		)
		await type(input(), '')
		await blur(input())
		expect(input().value).toBe('2026/11/18')
	})

	it('ボタンでカレンダーを開き、日を選ぶと閉じて値が入る', async () => {
		const onValueChange = vi.fn()
		await render(
			<DatePicker
				today={TODAY}
				defaultValue='2026-11-18'
				onValueChange={onValueChange}
			/>,
		)
		expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
		await click(button('カレンダーを開く'))
		await act(wait)
		expect(heading()).toBe('2026年11月')
		expect(focused()).toBe('2026-11-18')
		await click(day('2026-11-20'))
		await act(() => wait(300))
		expect(onValueChange).toHaveBeenCalledWith('2026-11-20')
		expect(input().value).toBe('2026/11/20')
		expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
	})

	it('「今日」と「消す」', async () => {
		const onValueChange = vi.fn()
		await render(
			<DatePicker
				today={TODAY}
				defaultValue='2026-11-18'
				defaultOpen
				onValueChange={onValueChange}
			/>,
		)
		await act(wait)
		const footer = (name: string) => {
			const el = Array.from(document.querySelectorAll('button')).find(
				b => b.textContent === name,
			)
			if (!el) throw new Error(`「${name}」が無い`)
			return el
		}
		await click(footer('今日'))
		expect(onValueChange).toHaveBeenLastCalledWith(TODAY)
		await act(() => wait(300))
		await click(button('カレンダーを開く'))
		await act(wait)
		await click(footer('消す'))
		expect(onValueChange).toHaveBeenLastCalledWith('')
		expect(input().value).toBe('')
	})

	it('name を渡すと、YYYY-MM-DD の値をフォームで送れる', async () => {
		await render(
			<form>
				<DatePicker today={TODAY} name='dueDate' defaultValue='2026-11-18' />
			</form>,
		)
		const form = document.querySelector('form') as HTMLFormElement
		expect(new FormData(form).get('dueDate')).toBe('2026-11-18')
	})

	it('disabled のときは、フォームで値を送らない', async () => {
		await render(
			<form>
				<DatePicker today={TODAY} name='dueDate' value='2026-11-18' disabled />
				<DateRangePicker
					today={TODAY}
					names={['from', 'to']}
					value={{ from: '2026-11-01', to: '2026-11-30' }}
					disabled
				/>
			</form>,
		)
		const data = new FormData(document.querySelector('form') as HTMLFormElement)
		expect(data.has('dueDate')).toBe(false)
		expect(data.has('from')).toBe(false)
		expect(data.has('to')).toBe(false)
	})

	it('form を渡すと、離れた所のフォームでも値を送れる', async () => {
		await render(
			<>
				<form id='editor' />
				<DatePicker
					today={TODAY}
					form='editor'
					name='dueDate'
					defaultValue='2026-11-18'
				/>
				<DateRangePicker
					today={TODAY}
					form='editor'
					names={['from', 'to']}
					defaultValue={{ from: '2026-11-01', to: '2026-11-30' }}
				/>
			</>,
		)
		const data = new FormData(document.querySelector('form') as HTMLFormElement)
		expect(data.get('dueDate')).toBe('2026-11-18')
		expect(data.get('from')).toBe('2026-11-01')
		expect(data.get('to')).toBe('2026-11-30')
	})

	it('開いているあいだに使えなく・読むだけになったら、閉じて値を変えられない', async () => {
		for (const lock of [{ disabled: true }, { readOnly: true }]) {
			const onValueChange = vi.fn()
			const view = (props: { disabled?: boolean; readOnly?: boolean }) => (
				<DatePicker
					today={TODAY}
					defaultValue='2026-11-18'
					defaultOpen
					onValueChange={onValueChange}
					{...props}
				/>
			)
			const el = await render(view({}))
			await act(wait)
			expect(document.querySelector('[data-slot="calendar"]')).not.toBeNull()
			await act(async () => root?.render(view(lock)))
			await act(() => wait(300))
			expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
			expect(onValueChange).not.toHaveBeenCalled()
			await act(async () => root?.unmount())
			el.remove()
		}
	})

	it('フォームの reset で、はじめの値に戻る', async () => {
		await render(
			<form>
				<DatePicker today={TODAY} name='dueDate' defaultValue='2026-11-18' />
				<DateRangePicker
					today={TODAY}
					names={['from', 'to']}
					defaultValue={{ from: '2026-11-01', to: '2026-11-30' }}
				/>
			</form>,
		)
		const form = document.querySelector('form') as HTMLFormElement
		await type(input(), '12/5')
		await blur(input())
		await click(
			document.querySelector('[data-slot="date-range-picker"]') as Element,
		)
		await act(wait)
		await click(day('2026-11-10'))
		await click(day('2026-11-12'))
		await act(() => wait(300))
		expect(new FormData(form).get('dueDate')).toBe('2026-12-05')
		expect(new FormData(form).get('from')).toBe('2026-11-10')

		await act(async () => {
			form.reset()
			await wait()
		})
		expect(input().value).toBe('2026/11/18')
		const data = new FormData(form)
		expect(data.get('dueDate')).toBe('2026-11-18')
		expect(data.get('from')).toBe('2026-11-01')
		expect(data.get('to')).toBe('2026-11-30')
	})

	it('reset が取り消されたら、値はそのまま', async () => {
		await render(
			<form onReset={event => event.preventDefault()}>
				<DatePicker today={TODAY} name='dueDate' defaultValue='2026-11-18' />
			</form>,
		)
		const form = document.querySelector('form') as HTMLFormElement
		await type(input(), '12/5')
		await blur(input())
		await act(async () => {
			form.reset()
			await wait()
		})
		expect(input().value).toBe('2026/12/05')
		expect(new FormData(form).get('dueDate')).toBe('2026-12-05')
	})

	it('disabled と readOnly では開けない', async () => {
		await render(
			<>
				<DatePicker today={TODAY} disabled />
				<DatePicker today={TODAY} readOnly />
			</>,
		)
		for (const el of Array.from(
			document.querySelectorAll<HTMLButtonElement>(
				'button[aria-label="カレンダーを開く"]',
			),
		)) {
			expect(el.disabled).toBe(true)
		}
	})

	it('Field の中では、ラベル・説明・エラーが入力欄につながる', async () => {
		await render(
			<Field label='納期' error='納期を入れてください。'>
				<DatePicker today={TODAY} />
			</Field>,
		)
		const label = document.querySelector('label') as HTMLLabelElement
		expect(label.htmlFor).toBe(input().id)
		expect(input().getAttribute('aria-invalid')).toBe('true')
		const note = document.getElementById(
			input().getAttribute('aria-describedby') ?? '',
		)
		expect(note?.textContent).toBe('納期を入れてください。')
	})
})

describe('DateRangePicker', () => {
	const trigger = () => {
		const el = document.querySelector<HTMLButtonElement>(
			'[data-slot="date-range-picker"]',
		)
		if (!el) throw new Error('期間の欄が無い')
		return el
	}

	it('期間を「はじめ 〜 終わり」で見せる。空なら案内の文字', async () => {
		await render(
			<DateRangePicker
				today={TODAY}
				defaultValue={{ from: '2026-11-01', to: '2026-11-30' }}
			/>,
		)
		expect(trigger().textContent).toBe('2026/11/01 〜 2026/11/30')
		await act(async () => root?.unmount())
		document.body.innerHTML = ''
		await render(<DateRangePicker today={TODAY} />)
		expect(trigger().textContent).toBe('期間を選ぶ')
	})

	it('はじめと終わりを押すと閉じて、決まった期間だけを知らせる', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		await render(
			<DateRangePicker today={TODAY} onValueChange={onValueChange} />,
		)
		await click(trigger())
		await act(wait)
		await click(day('2026-11-10'))
		expect(onValueChange).not.toHaveBeenCalled()
		expect(document.body.textContent).toContain('終わりの日を選んでください')
		await click(day('2026-11-18'))
		await act(() => wait(300))
		expect(onValueChange).toHaveBeenCalledTimes(1)
		expect(onValueChange).toHaveBeenCalledWith({
			from: '2026-11-10',
			to: '2026-11-18',
		})
		expect(trigger().textContent).toBe('2026/11/10 〜 2026/11/18')
		expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
	})

	it('外から open を false にして閉じても、選んでいる途中の期間は残らない', async () => {
		const onValueChange = vi.fn<(value: DateRange) => void>()
		const view = (open: boolean) => (
			<DateRangePicker
				today={TODAY}
				open={open}
				onValueChange={onValueChange}
			/>
		)
		await render(view(true))
		await act(wait)
		await click(day('2026-11-10'))
		await act(async () => root?.render(view(false)))
		await act(() => wait(300))
		await act(async () => root?.render(view(true)))
		await act(wait)
		// 途中の期間が残っていれば、ここで 10 日〜20 日に決まってしまう
		await click(day('2026-11-20'))
		expect(onValueChange).not.toHaveBeenCalled()
		expect(document.body.textContent).toContain('終わりの日を選んでください')
	})

	it('開いているあいだに使えなくなったら、閉じる', async () => {
		const view = (disabled: boolean) => (
			<DateRangePicker today={TODAY} defaultOpen disabled={disabled} />
		)
		await render(view(false))
		await act(wait)
		expect(document.querySelector('[data-slot="calendar"]')).not.toBeNull()
		await act(async () => root?.render(view(true)))
		await act(() => wait(300))
		expect(document.querySelector('[data-slot="calendar"]')).toBeNull()
	})

	it('names が無くても、reset ではじめの期間に戻る', async () => {
		await render(
			<form>
				<DateRangePicker
					today={TODAY}
					defaultValue={{ from: '2026-11-01', to: '2026-11-30' }}
				/>
			</form>,
		)
		await click(trigger())
		await act(wait)
		await click(day('2026-11-10'))
		await click(day('2026-11-12'))
		await act(() => wait(300))
		expect(trigger().textContent).toBe('2026/11/10 〜 2026/11/12')
		await act(async () => {
			;(document.querySelector('form') as HTMLFormElement).reset()
			await wait()
		})
		expect(trigger().textContent).toBe('2026/11/01 〜 2026/11/30')
	})

	it('names を渡すと、はじめと終わりをフォームで送れる', async () => {
		await render(
			<form>
				<DateRangePicker
					today={TODAY}
					names={['from', 'to']}
					defaultValue={{ from: '2026-11-01', to: '2026-11-30' }}
				/>
			</form>,
		)
		const data = new FormData(document.querySelector('form') as HTMLFormElement)
		expect(data.get('from')).toBe('2026-11-01')
		expect(data.get('to')).toBe('2026-11-30')
	})
})
