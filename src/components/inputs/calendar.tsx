'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import {
	MAX_DATE,
	MIN_DATE,
	addDays,
	addMonths,
	addMonthsToMonth,
	clampDate,
	isDateString,
	isMonthString,
	monthGrid,
	monthOf,
	todayString,
	weekdayOf,
} from '../../lib/calendar-date'
import { cn } from '../../lib/utils'
import { Button } from '../basics/button'

/*
 * 月の表から日を選ぶ部品。1 日を選ぶ（mode='single'、既定）か、期間を選ぶ（mode='range'）。
 *
 * - 日付は `YYYY-MM-DD` の文字で受け渡す（選んでいないときは `''`）。時刻と時間帯は持たない。
 * - 選べない日: `min`・`max`（その日を含む）と、`isDateDisabled`（休みの日など）。
 * - 月の移動: 見出しの左右のボタン。`month`・`onMonthChange` で外から持つこともできる。
 * - キーボード: 矢印で 1 日・1 週、Home・End で週の端、PageUp・PageDown で前後の月
 *   （Shift を足すと前後の年）、Enter・Space で選ぶ。Tab で止まる日は表の中に 1 つだけ。
 * - base-ui にカレンダーの部品は無いので、表は自分で描く（外の物は足していない）。
 *
 * 入力欄に付けて使うときは DatePicker・DateRangePicker を使う。
 */

/** 期間。`from` と `to` はその日を含む。選んでいる途中は `to` が `''` */
export interface DateRange {
	from: string
	to: string
}

export interface CalendarLabels {
	/** 前の月へ動くボタンの読み上げ名 */
	previousMonth: string
	/** 次の月へ動くボタンの読み上げ名 */
	nextMonth: string
	/** 曜日の見出し。日曜から 7 つ */
	weekdays: readonly string[]
	/** 曜日の読み上げ名。日曜から 7 つ */
	weekdaysLong: readonly string[]
	/** 月の見出し（例 `2026年11月`） */
	formatMonth(year: number, month: number): string
	/** 日の読み上げ名（例 `2026年11月24日 火曜日`） */
	formatDay(date: string): string
	/** 今日の日の読み上げ名に足す言葉 */
	today: string
}

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const
const WEEKDAYS_LONG = WEEKDAYS.map(day => `${day}曜日`)

export const calendarLabels: CalendarLabels = {
	previousMonth: '前の月',
	nextMonth: '次の月',
	weekdays: WEEKDAYS,
	weekdaysLong: WEEKDAYS_LONG,
	formatMonth: (year, month) => `${year}年${month}月`,
	formatDay: date =>
		`${Number(date.slice(0, 4))}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日 ${WEEKDAYS_LONG[weekdayOf(date)]}`,
	today: '今日',
}

interface CalendarBaseProps
	extends Omit<
		React.HTMLAttributes<HTMLDivElement>,
		'defaultValue' | 'onChange'
	> {
	/** 見せる月（`YYYY-MM`）。渡すと外で持つ */
	month?: string
	/** はじめに見せる月（`YYYY-MM`）。無ければ、選んだ日の月か今日の月 */
	defaultMonth?: string
	/** 見せる月が変わるときに呼ぶ */
	onMonthChange?(month: string): void
	/** 選べる最初の日（`YYYY-MM-DD`、その日を含む） */
	min?: string
	/** 選べる最後の日（`YYYY-MM-DD`、その日を含む） */
	max?: string
	/** true を返した日は選べない（休みの日・締めた日など） */
	isDateDisabled?(date: string): boolean
	/** 週のはじめ。0 が日曜（既定）、1 が月曜 */
	weekStartsOn?: 0 | 1
	/** 「今日」の日（`YYYY-MM-DD`）。無ければ見ている人の現地の今日 */
	today?: string
	/** 出たときに、選んだ日（無ければ今日）へフォーカスを置く */
	autoFocus?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<CalendarLabels>
}

export interface CalendarSingleProps extends CalendarBaseProps {
	/** 1 日を選ぶ（既定） */
	mode?: 'single'
	/** 選んだ日（`YYYY-MM-DD`）。選んでいなければ `''` */
	value?: string
	defaultValue?: string
	/** 日を選んだときに呼ぶ */
	onValueChange?(value: string): void
}

export interface CalendarRangeProps extends CalendarBaseProps {
	/** 期間を選ぶ。1 回目に押した日がはじめ、2 回目に押した日が終わり */
	mode: 'range'
	/** 選んだ期間。選んでいる途中は `to` が `''` */
	value?: DateRange
	defaultValue?: DateRange
	/** 日を押すたびに呼ぶ（はじめだけ決まったときは `to` が `''`） */
	onValueChange?(value: DateRange): void
}

export type CalendarProps = CalendarSingleProps | CalendarRangeProps

const EMPTY_RANGE: DateRange = { from: '', to: '' }

const Calendar = React.forwardRef<HTMLDivElement, CalendarProps>(
	(props, ref) => {
		const {
			mode = 'single',
			value: valueProp,
			defaultValue,
			onValueChange,
			month: monthProp,
			defaultMonth,
			onMonthChange,
			min,
			max,
			isDateDisabled,
			weekStartsOn = 0,
			today: todayProp,
			autoFocus = false,
			labels: labelsProp,
			className,
			...rest
		} = props as CalendarBaseProps & {
			mode?: 'single' | 'range'
			value?: string | DateRange
			defaultValue?: string | DateRange
			onValueChange?(value: string | DateRange): void
		}

		const labels = React.useMemo(
			() => ({ ...calendarLabels, ...labelsProp }),
			[labelsProp],
		)
		const today = isDateString(todayProp) ? todayProp : todayString()

		// 選んだ値（外で持つか、中で持つ）
		const [innerValue, setInnerValue] = React.useState<
			string | DateRange | undefined
		>(defaultValue)
		const value = valueProp !== undefined ? valueProp : innerValue
		const single =
			mode === 'single' && isDateString(value) ? (value as string) : ''
		const range: DateRange =
			mode === 'range' && value && typeof value === 'object'
				? {
						from: isDateString(value.from) ? value.from : '',
						to: isDateString(value.to) ? value.to : '',
					}
				: EMPTY_RANGE
		const anchor = mode === 'range' ? range.from : single

		// 見せる月（外で持つか、中で持つ）
		const [innerMonth, setInnerMonth] = React.useState(() =>
			isMonthString(defaultMonth)
				? defaultMonth
				: monthOf(anchor || clampDate(today, min, max)),
		)
		const month = isMonthString(monthProp) ? monthProp : innerMonth
		const setMonth = (next: string) => {
			if (next === month) return
			setInnerMonth(next)
			onMonthChange?.(next)
		}

		// Tab で止まる日。矢印で動かすのもこの日
		const [focusedDate, setFocusedDate] = React.useState(
			() => anchor || clampDate(today, min, max),
		)
		// 期間を選んでいる途中に、マウスを乗せている日
		const [hoverDate, setHoverDate] = React.useState('')
		const gridRef = React.useRef<HTMLTableElement>(null)
		const focusAfterRender = React.useRef(autoFocus)

		// 外から 1 日の値が変わったら、その月を見せる
		const lastSingle = React.useRef(single)
		React.useEffect(() => {
			if (single === lastSingle.current) return
			lastSingle.current = single
			if (!single) return
			setFocusedDate(single)
			if (monthOf(single) !== month) {
				setInnerMonth(monthOf(single))
				onMonthChange?.(monthOf(single))
			}
		})

		const weeks = React.useMemo(
			() => monthGrid(month, weekStartsOn),
			[month, weekStartsOn],
		)
		// 表の中に Tab で止まる日が必ず 1 つあるようにする
		// （文字の大小では比べない。10000 年のマスが混ざると順が崩れる）
		const tabDate =
			isDateString(focusedDate) &&
			weeks.some(week => week.indexOf(focusedDate) >= 0)
				? focusedDate
				: clampDate(`${month}-01`, min, max)

		React.useEffect(() => {
			if (!focusAfterRender.current) return
			focusAfterRender.current = false
			gridRef.current
				?.querySelector<HTMLElement>(`[data-date="${tabDate}"]`)
				?.focus()
		})

		const disabled = (date: string) =>
			Boolean(
				(min && date < min) || (max && date > max) || isDateDisabled?.(date),
			)

		const commit = (next: string | DateRange) => {
			if (valueProp === undefined) setInnerValue(next)
			onValueChange?.(next)
		}

		const select = (date: string) => {
			if (disabled(date)) return
			setFocusedDate(date)
			if (mode === 'single') {
				// 前後の月の日を選んだら、その月へ動く
				if (monthOf(date) !== month) setMonth(monthOf(date))
				commit(date)
				return
			}
			setHoverDate('')
			if (!range.from || range.to) commit({ from: date, to: '' })
			else if (date < range.from) commit({ from: date, to: range.from })
			else commit({ from: range.from, to: date })
		}

		const moveFocus = (date: string) => {
			const next = clampDate(date, min, max)
			setFocusedDate(next)
			if (monthOf(next) !== month) setMonth(monthOf(next))
			focusAfterRender.current = true
		}

		const handleKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
			const target = (event.target as HTMLElement).closest<HTMLElement>(
				'[data-date]',
			)
			const date = target?.dataset.date
			if (!date) return
			const weekday = (weekdayOf(date) - weekStartsOn + 7) % 7
			let next: string | undefined
			switch (event.key) {
				case 'ArrowLeft':
					next = addDays(date, -1)
					break
				case 'ArrowRight':
					next = addDays(date, 1)
					break
				case 'ArrowUp':
					next = addDays(date, -7)
					break
				case 'ArrowDown':
					next = addDays(date, 7)
					break
				case 'Home':
					next = addDays(date, -weekday)
					break
				case 'End':
					next = addDays(date, 6 - weekday)
					break
				case 'PageUp':
					next = addMonths(date, event.shiftKey ? -12 : -1)
					break
				case 'PageDown':
					next = addMonths(date, event.shiftKey ? 12 : 1)
					break
				case 'Enter':
				case ' ':
					event.preventDefault()
					select(date)
					return
				default:
					return
			}
			event.preventDefault()
			moveFocus(next)
		}

		const shiftMonth = (amount: number) => {
			const next = addMonthsToMonth(month, amount)
			setMonth(next)
			// Tab で止まる日も一緒に動かす（フォーカスそのものは動かさない）
			setFocusedDate(current =>
				clampDate(
					addMonths(
						monthOf(current) === month ? current : `${month}-01`,
						amount,
					),
					min,
					max,
				),
			)
		}

		const previousDisabled =
			month === monthOf(MIN_DATE) || Boolean(min && `${month}-01` <= min)
		const nextDisabled =
			month === monthOf(MAX_DATE) ||
			Boolean(max && `${addMonthsToMonth(month, 1)}-01` > max)

		// 期間の見た目。選んでいる途中は、乗せている日（無ければフォーカスの日）までを見せる
		const picking = mode === 'range' && Boolean(range.from) && !range.to
		const previewEnd = picking ? hoverDate || range.from : range.to
		const rangeStart =
			mode === 'range' && range.from
				? previewEnd && previewEnd < range.from
					? previewEnd
					: range.from
				: ''
		const rangeEnd =
			mode === 'range' && range.from
				? previewEnd && previewEnd > range.from
					? previewEnd
					: range.from
				: ''

		const headingId = React.useId()
		const year = Number(month.slice(0, 4))
		const monthNumber = Number(month.slice(5, 7))

		return (
			<div
				ref={ref}
				data-slot='calendar'
				data-mode={mode}
				className={cn('w-fit select-none p-2 text-foreground', className)}
				{...rest}
			>
				<div className='flex items-center justify-between gap-2 pb-2'>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						aria-label={labels.previousMonth}
						disabled={previousDisabled}
						onClick={() => shiftMonth(-1)}
					>
						<ChevronLeft />
					</Button>
					<div
						id={headingId}
						aria-live='polite'
						className='text-sm font-medium tabular-nums'
					>
						{labels.formatMonth(year, monthNumber)}
					</div>
					<Button
						type='button'
						variant='ghost'
						size='icon'
						aria-label={labels.nextMonth}
						disabled={nextDisabled}
						onClick={() => shiftMonth(1)}
					>
						<ChevronRight />
					</Button>
				</div>
				<table
					ref={gridRef}
					role='grid'
					aria-labelledby={headingId}
					aria-multiselectable={mode === 'range' || undefined}
					className='border-collapse'
					onKeyDown={handleKeyDown}
					onMouseLeave={() => setHoverDate('')}
				>
					<thead>
						<tr>
							{weeks[0].map(date => {
								const weekday = weekdayOf(date)
								return (
									<th
										key={weekday}
										scope='col'
										abbr={labels.weekdaysLong[weekday]}
										className='size-8 p-0 text-2xs font-medium text-muted-foreground'
									>
										{labels.weekdays[weekday]}
									</th>
								)
							})}
						</tr>
					</thead>
					<tbody>
						{weeks.map(week => (
							<tr key={week[0]}>
								{week.map((date, column) => {
									// 扱える範囲（1 年〜9999 年）の外のマスは、空のまま
									if (!isDateString(date)) return <td key={date} />
									const outside = monthOf(date) !== month
									const isDisabled = disabled(date)
									const isToday = date === today
									const inRange =
										Boolean(rangeStart) &&
										date >= rangeStart &&
										date <= rangeEnd
									const isRangeStart = inRange && date === rangeStart
									const isRangeEnd = inRange && date === rangeEnd
									const isSelected =
										mode === 'single'
											? date === single
											: date === range.from || date === range.to
									return (
										<td
											key={date}
											aria-selected={
												mode === 'single' ? isSelected : inRange && !picking
											}
											data-in-range={inRange || undefined}
											className={cn(
												'p-0',
												// 期間の帯。端と行の端は角を丸める
												inRange && 'bg-selected',
												(isRangeStart || (inRange && column === 0)) &&
													'rounded-l-md',
												(isRangeEnd || (inRange && column === 6)) &&
													'rounded-r-md',
											)}
										>
											<button
												type='button'
												data-date={date}
												data-today={isToday || undefined}
												data-outside={outside || undefined}
												data-selected={isSelected || undefined}
												tabIndex={date === tabDate ? 0 : -1}
												aria-label={
													isToday
														? `${labels.formatDay(date)} ${labels.today}`
														: labels.formatDay(date)
												}
												aria-current={isToday ? 'date' : undefined}
												aria-disabled={isDisabled || undefined}
												onClick={() => select(date)}
												onFocus={() => {
													setFocusedDate(date)
													// キーボードでも、選んでいる途中の期間を見せる
													if (picking && !isDisabled) setHoverDate(date)
												}}
												onMouseEnter={
													picking && !isDisabled
														? () => setHoverDate(date)
														: undefined
												}
												className={cn(
													'relative flex size-8 items-center justify-center rounded-md text-sm tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
													outside && 'text-subtle-foreground',
													// 今日は、数字の下の点で知らせる
													isToday &&
														'font-semibold text-primary after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current',
													isSelected
														? 'bg-primary font-medium text-primary-foreground'
														: !isDisabled &&
																(inRange
																	? 'hover:bg-primary/15'
																	: 'hover:bg-muted'),
													isDisabled &&
														'cursor-not-allowed text-subtle-foreground line-through opacity-60',
												)}
											>
												{Number(date.slice(8, 10))}
											</button>
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		)
	},
)
Calendar.displayName = 'Calendar'

export { Calendar }
