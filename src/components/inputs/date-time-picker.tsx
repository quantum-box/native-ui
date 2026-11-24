'use client'

import * as React from 'react'

import { isDateTimeString, isTimeString } from '../../lib/calendar-date'
import { cn } from '../../lib/utils'
import type { CalendarLabels, CalendarSingleProps } from './calendar'
import { DatePicker, type DatePickerLabels } from './date-picker'
import { useFormReset } from './picker-field'
import { TimePicker, type TimePickerLabels } from './time-picker'

/*
 * 日時の入力欄。日付の欄（DatePicker）と時刻の欄（TimePicker）を横に並べて、1 つの値にする。
 *
 * - 値は `YYYY-MM-DDTHH:MM` の文字（空は `''`）。`<input type="datetime-local">` と同じ形。
 *   時間帯は持たない（見ている人の現地の日時として扱うか、`+09:00` を足すかは使う側が決める）。
 * - 日付と時刻の両方が入ったときに値が決まる。片方だけのあいだは `''`。
 *   `defaultTime` を渡すと、日付を先に入れたときに、その時刻が入る。
 * - `min`・`max` は日時（`YYYY-MM-DDTHH:MM`）。外の日は選べず、端の日では時刻も絞る。
 */

export interface DateTimePickerLabels {
	/** 日付の欄の読み上げ名 */
	date: string
	/** 時刻の欄の読み上げ名 */
	time: string
}

export const dateTimePickerLabels: DateTimePickerLabels = {
	date: '日付',
	time: '時刻',
}

export interface DateTimePickerProps
	extends Pick<
			CalendarSingleProps,
			'isDateDisabled' | 'weekStartsOn' | 'today'
		>,
		Omit<
			React.HTMLAttributes<HTMLDivElement>,
			'defaultValue' | 'onChange' | 'children'
		> {
	/** 選んだ日時（`YYYY-MM-DDTHH:MM`）。空は `''` */
	value?: string
	defaultValue?: string
	/** 日時が決まったとき・消したときに呼ぶ（片方だけのあいだは `''`） */
	onValueChange?(value: string): void
	/** 選べる最初の日時（`YYYY-MM-DDTHH:MM`、その時刻を含む） */
	min?: string
	/** 選べる最後の日時（`YYYY-MM-DDTHH:MM`、その時刻を含む） */
	max?: string
	/** 時刻の一覧のきざみ（分）。既定は 30 */
	step?: number
	/** 日付を先に入れたときに入る時刻（`HH:MM`）。無ければ時刻は空のまま */
	defaultTime?: string
	/** フォームで送るときの名前。値は `YYYY-MM-DDTHH:MM` */
	name?: string
	form?: string
	disabled?: boolean
	readOnly?: boolean
	required?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<DateTimePickerLabels>
	dateLabels?: Partial<DatePickerLabels>
	timeLabels?: Partial<TimePickerLabels>
	calendarLabels?: Partial<CalendarLabels>
}

const asDateTime = (raw: unknown) => (isDateTimeString(raw) ? raw : '')
const split = (value: string) =>
	value
		? { date: value.slice(0, 10), time: value.slice(11, 16) }
		: { date: '', time: '' }

const DateTimePicker = React.forwardRef<HTMLDivElement, DateTimePickerProps>(
	(
		{
			value: valueProp,
			defaultValue = '',
			onValueChange,
			min: minProp,
			max: maxProp,
			step,
			defaultTime,
			isDateDisabled,
			weekStartsOn,
			today,
			name,
			form,
			disabled,
			readOnly,
			required,
			labels: labelsProp,
			dateLabels,
			timeLabels,
			calendarLabels,
			className,
			id,
			'aria-describedby': describedBy,
			'aria-invalid': invalid,
			'aria-label': ariaLabel,
			...props
		},
		ref,
	) => {
		const labels = { ...dateTimePickerLabels, ...labelsProp }
		const min = asDateTime(minProp)
		const max = asDateTime(maxProp)

		const [innerValue, setInnerValue] = React.useState(defaultValue)
		const value = asDateTime(valueProp !== undefined ? valueProp : innerValue)

		// 片方だけ入っているあいだの日付と時刻（値が決まっていないときに見せる）
		const [partial, setPartial] = React.useState(() => split(value))
		const { date, time } = value ? split(value) : partial

		// 外から値が空にされたら、片方だけ残っている物も消す
		const emitted = React.useRef(value)
		React.useEffect(() => {
			if (value === emitted.current) return
			emitted.current = value
			setPartial(split(value))
		}, [value])

		const hiddenRef = React.useRef<HTMLInputElement>(null)
		useFormReset(hiddenRef, () => {
			const initial = asDateTime(defaultValue)
			emitted.current = initial
			setInnerValue(initial)
			setPartial(split(initial))
		})

		const update = (nextDate: string, nextTime: string) => {
			let filled = nextTime
			if (nextDate && !filled && isTimeString(defaultTime)) filled = defaultTime
			let next = nextDate && filled ? `${nextDate}T${filled}` : ''
			// 端の日に動かしたとき、時刻が範囲の外なら端の時刻に寄せる
			if (next && min && next < min) next = min
			if (next && max && next > max) next = max
			setPartial(next ? split(next) : { date: nextDate, time: filled })
			if (next === value) return
			emitted.current = next
			if (valueProp === undefined) setInnerValue(next)
			onValueChange?.(next)
		}

		// 端の日では、時刻も絞る
		const minDate = min.slice(0, 10)
		const maxDate = max.slice(0, 10)
		const timeMin = date && date === minDate ? min.slice(11, 16) : undefined
		const timeMax = date && date === maxDate ? max.slice(11, 16) : undefined
		const prefix = ariaLabel ? `${ariaLabel} ` : ''

		return (
			<div
				ref={ref}
				role='group'
				data-slot='date-time-picker'
				aria-label={ariaLabel}
				className={cn('flex w-full min-w-0 items-center gap-1.5', className)}
				{...props}
			>
				<DatePicker
					id={id}
					className='min-w-0 flex-1'
					aria-label={ariaLabel ? `${prefix}${labels.date}` : undefined}
					aria-describedby={describedBy}
					aria-invalid={invalid}
					value={date}
					onValueChange={next => update(next, time)}
					min={minDate || undefined}
					max={maxDate || undefined}
					isDateDisabled={isDateDisabled}
					weekStartsOn={weekStartsOn}
					today={today}
					disabled={disabled}
					readOnly={readOnly}
					required={required}
					labels={dateLabels}
					calendarLabels={calendarLabels}
				/>
				<TimePicker
					className='w-24 shrink-0'
					aria-label={`${prefix}${labels.time}`}
					aria-describedby={describedBy}
					aria-invalid={invalid}
					value={time}
					onValueChange={next => update(date, next)}
					min={timeMin}
					max={timeMax}
					step={step}
					disabled={disabled}
					readOnly={readOnly}
					required={required}
					labels={timeLabels}
				/>
				{name && (
					<input
						ref={hiddenRef}
						type='hidden'
						form={form}
						name={name}
						value={value}
						disabled={disabled}
					/>
				)}
			</div>
		)
	},
)
DateTimePicker.displayName = 'DateTimePicker'

export { DateTimePicker }
