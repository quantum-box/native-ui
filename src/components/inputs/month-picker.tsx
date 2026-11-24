'use client'

import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import * as React from 'react'

import {
	MAX_MONTH,
	MIN_MONTH,
	addMonthsToMonth,
	clampMonth,
	formatMonthSlash,
	isDateString,
	isMonthString,
	monthOf,
	parseMonthText,
	todayString,
} from '../../lib/calendar-date'
import { cn } from '../../lib/utils'
import { Button } from '../basics/button'
import {
	PickerField,
	type PickerFieldBaseProps,
	PickerFooter,
} from './picker-field'

/*
 * 月の入力欄。手で打つことも、右のボタンで月の一覧を開いて選ぶこともできる。
 *
 * - 値は `YYYY-MM` の文字（空は `''`）。`<input type="month">` と同じ形。
 * - 手で打った文字は、欄を離れたときか Enter で確かめる。`2026/11`・`2026-11`・`202611`・
 *   `11`（今年）などを受け取る。読めない文字・選べない月は、元の値に戻す。
 * - 開いた一覧: 矢印で 1 か月・1 段（4 か月）、Home・End で段の端、PageUp・PageDown で
 *   前後の年、Enter・Space で選ぶ。
 */

export interface MonthPickerLabels {
	/** 月の一覧を開くボタンの読み上げ名 */
	open: string
	/** 今月を選ぶボタン */
	thisMonth: string
	/** 値を消すボタン */
	clear: string
	/** 前の年・次の年へ動くボタンの読み上げ名 */
	previousYear: string
	nextYear: string
	/** 年の見出し（例 `2026年`） */
	formatYear(year: number): string
	/** 月のボタンの文字（例 `11月`） */
	formatMonth(month: number): string
	/** 月の読み上げ名（例 `2026年11月`） */
	formatYearMonth(year: number, month: number): string
	/** 今月の読み上げ名に足す言葉 */
	current: string
}

export const monthPickerLabels: MonthPickerLabels = {
	open: '月の一覧を開く',
	thisMonth: '今月',
	clear: '消す',
	previousYear: '前の年',
	nextYear: '次の年',
	formatYear: year => `${year}年`,
	formatMonth: month => `${month}月`,
	formatYearMonth: (year, month) => `${year}年${month}月`,
	current: '今月',
}

interface MonthGridProps {
	value: string
	onSelect(month: string): void
	min?: string
	max?: string
	isMonthDisabled?(month: string): boolean
	/** 今月（`YYYY-MM`） */
	thisMonth: string
	labels: MonthPickerLabels
}

const COLUMNS = 4
const ROWS = [0, 1, 2]

const pad4 = (year: number) => `000${year}`.slice(-4)
const monthAt = (year: number, index: number) =>
	`${pad4(year)}-${index < 9 ? '0' : ''}${index + 1}`

/** 1 年ぶんの月の表（4 列 3 段） */
function MonthGrid({
	value,
	onSelect,
	min,
	max,
	isMonthDisabled,
	thisMonth,
	labels,
}: MonthGridProps) {
	// Tab で止まる月。矢印で動かすのもこの月
	const [focused, setFocused] = React.useState(
		() => value || clampMonth(thisMonth, min, max),
	)
	const year = Number(focused.slice(0, 4))
	const gridRef = React.useRef<HTMLTableElement>(null)
	const focusAfterRender = React.useRef(true)

	React.useEffect(() => {
		if (!focusAfterRender.current) return
		focusAfterRender.current = false
		gridRef.current
			?.querySelector<HTMLElement>(`[data-month="${focused}"]`)
			?.focus()
	})

	const disabled = (month: string) =>
		Boolean(
			(min && month < min) || (max && month > max) || isMonthDisabled?.(month),
		)

	const move = (month: string, focus: boolean) => {
		setFocused(clampMonth(month, min, max))
		if (focus) focusAfterRender.current = true
	}

	const handleKeyDown = (event: React.KeyboardEvent<HTMLTableElement>) => {
		const month = (event.target as HTMLElement).closest<HTMLElement>(
			'[data-month]',
		)?.dataset.month
		if (!month) return
		const column = (Number(month.slice(5, 7)) - 1) % COLUMNS
		const steps: Record<string, number> = {
			ArrowLeft: -1,
			ArrowRight: 1,
			ArrowUp: -COLUMNS,
			ArrowDown: COLUMNS,
			Home: -column,
			End: COLUMNS - 1 - column,
			PageUp: -12,
			PageDown: 12,
		}
		const step = steps[event.key]
		if (step === undefined) return
		event.preventDefault()
		move(addMonthsToMonth(month, step), true)
	}

	const previousDisabled = year <= 1 || Boolean(min && monthAt(year, 0) <= min)
	const nextDisabled = year >= 9999 || Boolean(max && monthAt(year, 11) >= max)
	const headingId = React.useId()

	return (
		<div data-slot='month-grid' className='select-none p-2 text-foreground'>
			<div className='flex items-center justify-between gap-2 pb-2'>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					aria-label={labels.previousYear}
					disabled={previousDisabled}
					onClick={() => move(addMonthsToMonth(focused, -12), false)}
				>
					<ChevronLeft />
				</Button>
				<div
					id={headingId}
					aria-live='polite'
					className='text-sm font-medium tabular-nums'
				>
					{labels.formatYear(year)}
				</div>
				<Button
					type='button'
					variant='ghost'
					size='icon'
					aria-label={labels.nextYear}
					disabled={nextDisabled}
					onClick={() => move(addMonthsToMonth(focused, 12), false)}
				>
					<ChevronRight />
				</Button>
			</div>
			<table
				ref={gridRef}
				role='grid'
				aria-labelledby={headingId}
				className='border-collapse'
				onKeyDown={handleKeyDown}
			>
				<tbody>
					{ROWS.map(row => (
						<tr key={row}>
							{[0, 1, 2, 3].map(column => {
								const index = row * COLUMNS + column
								const month = monthAt(year, index)
								const isSelected = month === value
								const isDisabled = disabled(month)
								const isCurrent = month === thisMonth
								const name = labels.formatYearMonth(year, index + 1)
								return (
									<td key={month} aria-selected={isSelected} className='p-0.5'>
										<button
											type='button'
											data-month={month}
											data-selected={isSelected || undefined}
											tabIndex={month === focused ? 0 : -1}
											aria-label={
												isCurrent ? `${name} ${labels.current}` : name
											}
											aria-current={isCurrent ? 'date' : undefined}
											aria-disabled={isDisabled || undefined}
											onClick={() => {
												if (!isDisabled) onSelect(month)
											}}
											onFocus={() => setFocused(month)}
											className={cn(
												'relative flex h-8 w-14 items-center justify-center rounded-md text-sm tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
												// 今月は、数字の下の点で知らせる（Calendar の今日と同じ）
												isCurrent &&
													'font-semibold text-primary after:absolute after:bottom-1 after:size-1 after:rounded-full after:bg-current',
												isSelected
													? 'bg-primary font-medium text-primary-foreground'
													: !isDisabled && 'hover:bg-muted',
												isDisabled &&
													'cursor-not-allowed text-subtle-foreground line-through opacity-60',
											)}
										>
											{labels.formatMonth(index + 1)}
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
}

export interface MonthPickerProps extends PickerFieldBaseProps {
	/** 選んだ月（`YYYY-MM`）。空は `''` */
	value?: string
	/** 選べる最初の月（`YYYY-MM`、その月を含む） */
	min?: string
	/** 選べる最後の月（`YYYY-MM`、その月を含む） */
	max?: string
	/** true を返した月は選べない（締めた月など） */
	isMonthDisabled?(month: string): boolean
	/** 「今日」の日（`YYYY-MM-DD`）。今月の印と、年を省いて打ったときの年に使う */
	today?: string
	/** 表示の形。既定は `2026/11` */
	formatMonth?(value: string): string
	/** 一覧の下の「今月」「消す」を出さない */
	hideFooter?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<MonthPickerLabels>
}

const asMonth = (raw: unknown) => (isMonthString(raw) ? raw : '')

const MonthPicker = React.forwardRef<HTMLInputElement, MonthPickerProps>(
	(
		{
			min,
			max,
			isMonthDisabled,
			today: todayProp,
			formatMonth = formatMonthSlash,
			hideFooter = false,
			labels: labelsProp,
			placeholder = '年/月',
			...props
		},
		ref,
	) => {
		const labels = { ...monthPickerLabels, ...labelsProp }
		const today = isDateString(todayProp) ? todayProp : todayString()
		const thisMonth = monthOf(today)
		const selectable = (month: string) =>
			month >= MIN_MONTH &&
			month <= MAX_MONTH &&
			!(
				(min && month < min) ||
				(max && month > max) ||
				isMonthDisabled?.(month)
			)

		return (
			<PickerField
				ref={ref}
				slot='month-picker'
				normalize={asMonth}
				parse={text => parseMonthText(text, today)}
				format={formatMonth}
				selectable={selectable}
				icon={<CalendarDays />}
				openLabel={labels.open}
				placeholder={placeholder}
				{...props}
			>
				{({ value, select }) => (
					<>
						<MonthGrid
							value={value}
							onSelect={select}
							min={min}
							max={max}
							isMonthDisabled={isMonthDisabled}
							thisMonth={thisMonth}
							labels={labels}
						/>
						{!hideFooter && (
							<PickerFooter>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									disabled={!selectable(thisMonth)}
									onClick={() => select(thisMonth)}
								>
									{labels.thisMonth}
								</Button>
								{!props.required && (
									<Button
										type='button'
										variant='ghost'
										size='sm'
										disabled={!value}
										onClick={() => select('')}
									>
										{labels.clear}
									</Button>
								)}
							</PickerFooter>
						)}
					</>
				)}
			</PickerField>
		)
	},
)
MonthPicker.displayName = 'MonthPicker'

export { MonthPicker }
