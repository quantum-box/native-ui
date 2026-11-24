// @vitest-environment jsdom
import { type ReactNode, act } from 'react'
import { type Root, createRoot } from 'react-dom/client'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { DateTimePicker } from './date-time-picker'
import { Field } from './field'
import { MonthPicker } from './month-picker'
import { TimePicker } from './time-picker'

// 月・時刻・日時の入力欄。「今日」は 2026-11-24 に固定する。

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
const find = <T extends Element>(selector: string) => {
	const el = document.querySelector<T>(selector)
	if (!el) throw new Error(`${selector} が無い`)
	return el
}
const input = (slot: string) =>
	find<HTMLInputElement>(`[data-slot="${slot}"] input[type="text"]`)
const button = (name: string) =>
	find<HTMLButtonElement>(`button[aria-label="${name}"]`)
const textButton = (name: string) => {
	const el = Array.from(document.querySelectorAll('button')).find(
		b => b.textContent === name,
	)
	if (!el) throw new Error(`「${name}」が無い`)
	return el
}
async function click(el: Element) {
	await act(async () => {
		;(el as HTMLElement).click()
	})
}
async function key(el: Element, name: string) {
	await act(async () => {
		el.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: name,
				bubbles: true,
				cancelable: true,
			}),
		)
	})
}
async function type(el: HTMLInputElement, text: string) {
	const setter = Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		'value',
	)?.set
	await act(async () => {
		el.focus()
		setter?.call(el, text)
		el.dispatchEvent(new Event('input', { bubbles: true }))
	})
	await act(async () => {
		el.blur()
	})
}
const focusedAttr = (name: string) =>
	(document.activeElement as HTMLElement | null)?.getAttribute(name)

describe('MonthPicker', () => {
	const month = (value: string) =>
		find<HTMLButtonElement>(`[data-month="${value}"]`)

	it('値を 2026/11 の形で見せ、手で打った月を知らせる', async () => {
		const onValueChange = vi.fn()
		await render(
			<MonthPicker
				today={TODAY}
				defaultValue='2026-10'
				onValueChange={onValueChange}
			/>,
		)
		expect(input('month-picker').value).toBe('2026/10')
		await type(input('month-picker'), '3')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-03')
		expect(input('month-picker').value).toBe('2026/03')
		await type(input('month-picker'), '2027年1月')
		expect(onValueChange).toHaveBeenLastCalledWith('2027-01')
	})

	it('読めない文字と選べない月は、元の値に戻す', async () => {
		const onValueChange = vi.fn()
		await render(
			<MonthPicker
				today={TODAY}
				defaultValue='2026-10'
				min='2026-04'
				max='2026-11'
				isMonthDisabled={value => value === '2026-08'}
				onValueChange={onValueChange}
			/>,
		)
		for (const text of ['らいげつ', '2026/13', '2026/3', '2026/12', '2026/8']) {
			await type(input('month-picker'), text)
			expect(input('month-picker').value).toBe('2026/10')
		}
		expect(onValueChange).not.toHaveBeenCalled()
	})

	it('開くと選んだ月にフォーカスがあり、押すと閉じて値が入る', async () => {
		const onValueChange = vi.fn()
		await render(
			<MonthPicker
				today={TODAY}
				defaultValue='2026-10'
				onValueChange={onValueChange}
			/>,
		)
		await click(button('月の一覧を開く'))
		await act(wait)
		expect(focusedAttr('data-month')).toBe('2026-10')
		expect(month('2026-10').closest('td')?.getAttribute('aria-selected')).toBe(
			'true',
		)
		expect(month('2026-11').getAttribute('aria-label')).toBe('2026年11月 今月')
		await click(month('2026-06'))
		await act(() => wait(300))
		expect(onValueChange).toHaveBeenCalledWith('2026-06')
		expect(input('month-picker').value).toBe('2026/06')
		expect(document.querySelector('[data-slot="month-grid"]')).toBeNull()
	})

	it('矢印で 1 か月・1 段、Home・End で段の端、PageUp・PageDown で前後の年', async () => {
		await render(
			<MonthPicker today={TODAY} defaultValue='2026-06' defaultOpen />,
		)
		await act(wait)
		const step = async (name: string, expected: string) => {
			await key(document.activeElement as Element, name)
			expect(focusedAttr('data-month')).toBe(expected)
		}
		await step('ArrowRight', '2026-07')
		await step('ArrowDown', '2026-11')
		await step('ArrowDown', '2027-03')
		await step('ArrowUp', '2026-11')
		await step('Home', '2026-09')
		await step('End', '2026-12')
		await step('ArrowRight', '2027-01')
		await step('PageUp', '2026-01')
		await step('PageDown', '2027-01')
		expect(find('[data-slot="month-grid"] [aria-live]').textContent).toBe(
			'2027年',
		)
	})

	it('年のボタンで前後の年へ動き、min・max の外の年へは動けない', async () => {
		await render(
			<MonthPicker
				today={TODAY}
				defaultValue='2026-10'
				min='2026-04'
				max='2027-02'
				defaultOpen
			/>,
		)
		await act(wait)
		expect(button('前の年').disabled).toBe(true)
		await click(button('次の年'))
		expect(find('[data-slot="month-grid"] [aria-live]').textContent).toBe(
			'2027年',
		)
		expect(button('次の年').disabled).toBe(true)
		expect(month('2027-03').getAttribute('aria-disabled')).toBe('true')
		expect(month('2027-02').getAttribute('aria-disabled')).toBeNull()
	})

	it('選べない月は押しても選ばれない。「今月」と「消す」', async () => {
		const onValueChange = vi.fn()
		await render(
			<MonthPicker
				today={TODAY}
				defaultValue='2026-10'
				isMonthDisabled={value => value === '2026-08'}
				defaultOpen
				onValueChange={onValueChange}
			/>,
		)
		await act(wait)
		await click(month('2026-08'))
		expect(onValueChange).not.toHaveBeenCalled()
		await click(textButton('今月'))
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11')
		await act(() => wait(300))
		await click(button('月の一覧を開く'))
		await act(wait)
		await click(textButton('消す'))
		expect(onValueChange).toHaveBeenLastCalledWith('')
	})

	it('9999 年と 1 年でも落ちず、その先へは動けない', async () => {
		const el = await render(
			<MonthPicker today={TODAY} defaultValue='9999-12' defaultOpen />,
		)
		await act(wait)
		expect(button('次の年').disabled).toBe(true)
		await key(document.activeElement as Element, 'ArrowRight')
		expect(focusedAttr('data-month')).toBe('9999-12')
		await act(async () => root?.unmount())
		el.remove()

		await render(
			<MonthPicker today={TODAY} defaultValue='0001-01' defaultOpen />,
		)
		await act(wait)
		expect(button('前の年').disabled).toBe(true)
		await key(document.activeElement as Element, 'PageUp')
		expect(focusedAttr('data-month')).toBe('0001-01')
	})
})

describe('TimePicker', () => {
	const option = (value: string) =>
		find<HTMLButtonElement>(`[data-time="${value}"]`)

	it('手で打った時刻を HH:MM に直して知らせる（1 分きざみで入れられる）', async () => {
		const onValueChange = vi.fn()
		await render(
			<TimePicker defaultValue='09:30' onValueChange={onValueChange} />,
		)
		expect(input('time-picker').value).toBe('09:30')
		await type(input('time-picker'), '1745')
		expect(onValueChange).toHaveBeenLastCalledWith('17:45')
		await type(input('time-picker'), '8')
		expect(onValueChange).toHaveBeenLastCalledWith('08:00')
		await type(input('time-picker'), '9時7分')
		expect(onValueChange).toHaveBeenLastCalledWith('09:07')
		expect(input('time-picker').value).toBe('09:07')
	})

	it('読めない文字と範囲の外の時刻は、元の値に戻す', async () => {
		const onValueChange = vi.fn()
		await render(
			<TimePicker
				defaultValue='10:00'
				min='09:00'
				max='18:00'
				onValueChange={onValueChange}
			/>,
		)
		for (const text of ['ひる', '25:00', '8:59', '18:01']) {
			await type(input('time-picker'), text)
			expect(input('time-picker').value).toBe('10:00')
		}
		expect(onValueChange).not.toHaveBeenCalled()
		await type(input('time-picker'), '18:00')
		expect(onValueChange).toHaveBeenCalledWith('18:00')
	})

	it('一覧はきざみと範囲どおりで、開くと選んだ時刻にフォーカスがある', async () => {
		const onValueChange = vi.fn()
		await render(
			<TimePicker
				defaultValue='10:15'
				min='09:00'
				max='18:00'
				step={15}
				onValueChange={onValueChange}
			/>,
		)
		await click(button('時刻の一覧を開く'))
		await act(wait)
		const options = Array.from(document.querySelectorAll('[role="option"]'))
		expect(options).toHaveLength(37)
		expect(options[0].textContent).toBe('09:00')
		expect(options[36].textContent).toBe('18:00')
		expect(focusedAttr('data-time')).toBe('10:15')
		expect(option('10:15').getAttribute('aria-selected')).toBe('true')
		expect(
			document.querySelectorAll('[role="listbox"] [tabindex="0"]'),
		).toHaveLength(1)

		await click(option('11:30'))
		await act(() => wait(300))
		expect(onValueChange).toHaveBeenCalledWith('11:30')
		expect(input('time-picker').value).toBe('11:30')
		expect(document.querySelector('[role="listbox"]')).toBeNull()
	})

	it('一覧に無い時刻のときは、その次の時刻にフォーカスを置く。空なら 9:00', async () => {
		const el = await render(<TimePicker defaultValue='09:07' defaultOpen />)
		await act(wait)
		expect(focusedAttr('data-time')).toBe('09:30')
		await act(async () => root?.unmount())
		el.remove()
		await render(<TimePicker defaultOpen />)
		await act(wait)
		expect(focusedAttr('data-time')).toBe('09:00')
	})

	it('上下の矢印・Home・End・PageUp・PageDown で動く', async () => {
		await render(<TimePicker defaultValue='09:30' defaultOpen />)
		await act(wait)
		const step = async (name: string, expected: string) => {
			await key(document.activeElement as Element, name)
			expect(focusedAttr('data-time')).toBe(expected)
		}
		await step('ArrowDown', '10:00')
		await step('ArrowUp', '09:30')
		await step('PageDown', '10:30')
		await step('PageUp', '09:30')
		await step('End', '23:30')
		await step('ArrowDown', '23:30')
		await step('Home', '00:00')
		await step('ArrowUp', '00:00')
	})

	it('required なら「消す」を出さない', async () => {
		await render(<TimePicker defaultValue='09:30' defaultOpen required />)
		await act(wait)
		expect(
			Array.from(document.querySelectorAll('button')).some(
				b => b.textContent === '消す',
			),
		).toBe(false)
	})
})

describe('DateTimePicker', () => {
	const date = () => input('date-picker')
	const time = () => input('time-picker')

	it('値を日付と時刻に分けて見せる', async () => {
		await render(
			<DateTimePicker today={TODAY} defaultValue='2026-11-24T09:30' />,
		)
		expect(date().value).toBe('2026/11/24')
		expect(time().value).toBe('09:30')
	})

	it('両方が入ったときに値が決まり、片方を消すと空になる（残した方は残る）', async () => {
		const onValueChange = vi.fn()
		await render(<DateTimePicker today={TODAY} onValueChange={onValueChange} />)
		await type(date(), '11/25')
		expect(onValueChange).not.toHaveBeenCalled()
		expect(date().value).toBe('2026/11/25')
		await type(time(), '930')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-25T09:30')
		await type(time(), '')
		expect(onValueChange).toHaveBeenLastCalledWith('')
		expect(date().value).toBe('2026/11/25')
		await type(time(), '10')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-25T10:00')
	})

	it('defaultTime があれば、日付を入れたときにその時刻が入る', async () => {
		const onValueChange = vi.fn()
		await render(
			<DateTimePicker
				today={TODAY}
				defaultTime='18:00'
				onValueChange={onValueChange}
			/>,
		)
		await type(date(), '11/25')
		expect(onValueChange).toHaveBeenCalledWith('2026-11-25T18:00')
		expect(time().value).toBe('18:00')
		// 時刻を消したときは、はじめの時刻を戻さない（空にできる）
		await type(time(), '')
		expect(time().value).toBe('')
		expect(onValueChange).toHaveBeenLastCalledWith('')
		// 日付を入れ直すと、また入る
		await type(date(), '11/26')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-26T18:00')
	})

	it('min・max の外の日は選べず、端の日では時刻も絞る', async () => {
		const onValueChange = vi.fn()
		await render(
			<DateTimePicker
				today={TODAY}
				min='2026-11-24T10:00'
				max='2026-11-30T18:00'
				defaultValue='2026-11-26T08:00'
				onValueChange={onValueChange}
			/>,
		)
		await type(date(), '11/23')
		expect(date().value).toBe('2026/11/26')
		// 端の日に動かすと、範囲の外の時刻は端の時刻に寄る
		await type(date(), '11/24')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-24T10:00')
		expect(time().value).toBe('10:00')
		await type(time(), '9:59')
		expect(time().value).toBe('10:00')
		await type(date(), '11/30')
		await type(time(), '18:01')
		expect(time().value).toBe('10:00')
		await type(time(), '18:00')
		expect(onValueChange).toHaveBeenLastCalledWith('2026-11-30T18:00')
	})

	it('外で値を持つとき、外から空にされたら両方の欄が空になる', async () => {
		const view = (value: string) => (
			<DateTimePicker today={TODAY} value={value} onValueChange={() => {}} />
		)
		await render(view('2026-11-24T09:30'))
		await act(async () => root?.render(view('')))
		expect(date().value).toBe('')
		expect(time().value).toBe('')
	})

	it('name を渡すと YYYY-MM-DDTHH:MM を送り、reset ではじめの値に戻る。disabled なら送らない', async () => {
		const view = (disabled: boolean) => (
			<form>
				<DateTimePicker
					today={TODAY}
					name='at'
					defaultValue='2026-11-24T09:30'
					disabled={disabled}
				/>
			</form>
		)
		await render(view(false))
		const form = find<HTMLFormElement>('form')
		expect(new FormData(form).get('at')).toBe('2026-11-24T09:30')
		await type(time(), '11')
		expect(new FormData(form).get('at')).toBe('2026-11-24T11:00')
		await act(async () => {
			form.reset()
			await wait()
		})
		expect(new FormData(form).get('at')).toBe('2026-11-24T09:30')
		expect(time().value).toBe('09:30')
		await act(async () => root?.render(view(true)))
		expect(new FormData(form).has('at')).toBe(false)
	})

	it('form を渡すと、見える 2 つの欄も、値を送る欄も、そのフォームに入る', async () => {
		await render(
			<>
				<form id='booking' />
				<DateTimePicker
					today={TODAY}
					form='booking'
					name='at'
					defaultValue='2026-11-24T09:30'
					required
				/>
			</>,
		)
		const form = find<HTMLFormElement>('form')
		expect(date().form).toBe(form)
		expect(time().form).toBe(form)
		expect(date().required).toBe(true)
		expect(time().required).toBe(true)
		expect(new FormData(form).get('at')).toBe('2026-11-24T09:30')
	})

	it('Field の中では、ラベルが日付の欄を指し、説明とエラーが両方の欄につながる', async () => {
		await render(
			<Field label='受付の日時' error='日時を入れてください。'>
				<DateTimePicker today={TODAY} />
			</Field>,
		)
		expect(find<HTMLLabelElement>('label').htmlFor).toBe(date().id)
		expect(time().getAttribute('aria-label')).toBe('時刻')
		for (const el of [date(), time()]) {
			expect(el.getAttribute('aria-invalid')).toBe('true')
			expect(
				document.getElementById(el.getAttribute('aria-describedby') ?? '')
					?.textContent,
			).toBe('日時を入れてください。')
		}
	})

	it('aria-label を渡すと、2 つの欄を「名前 日付」「名前 時刻」と読む', async () => {
		await render(<DateTimePicker today={TODAY} aria-label='受付の日時' />)
		expect(find('[role="group"]').getAttribute('aria-label')).toBe('受付の日時')
		expect(date().getAttribute('aria-label')).toBe('受付の日時 日付')
		expect(time().getAttribute('aria-label')).toBe('受付の日時 時刻')
	})
})
