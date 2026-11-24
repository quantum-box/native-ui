'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import * as React from 'react'

import {
	formatDateSlash,
	isDateString,
	parseDateText,
	todayString,
} from '../../lib/calendar-date'
import { cn } from '../../lib/utils'
import { Button } from '../basics/button'
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	PopoverTrigger,
} from '../overlays/popover'
import {
	Calendar,
	type CalendarLabels,
	type CalendarSingleProps,
	type DateRange,
} from './calendar'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from './input-group'

/*
 * 日付の入力欄。手で打つことも、右のボタンでカレンダーを開いて選ぶこともできる。
 *
 * - 値は `YYYY-MM-DD` の文字（空は `''`）。`<input type="date">` と同じ形なので、
 *   そのまま置き換えられる。
 * - 手で打った文字は、欄を離れたときか Enter で確かめる。`2026/11/24`・`2026-11-24`・
 *   `20261124`・`11/24`（今年）などを受け取る。読めない文字・選べない日は、元の値に戻す。
 * - 期間は DateRangePicker。
 */

type CalendarPass = Pick<
	CalendarSingleProps,
	'min' | 'max' | 'isDateDisabled' | 'weekStartsOn' | 'today'
>

export interface DatePickerLabels {
	/** カレンダーを開くボタンの読み上げ名 */
	open: string
	/** 今日を選ぶボタン */
	today: string
	/** 値を消すボタン */
	clear: string
}

export const datePickerLabels: DatePickerLabels = {
	open: 'カレンダーを開く',
	today: '今日',
	clear: '消す',
}

const focusCalendarDay = (event: Event) => {
	// 開いたら、選んだ日（無ければ今日）にフォーカスを置く（Calendar の autoFocus がやる）
	event.preventDefault()
}

export interface DatePickerProps
	extends CalendarPass,
		Omit<
			React.InputHTMLAttributes<HTMLInputElement>,
			'value' | 'defaultValue' | 'onChange' | 'type' | 'min' | 'max'
		> {
	/** 選んだ日（`YYYY-MM-DD`）。空は `''` */
	value?: string
	defaultValue?: string
	/** 日が決まったとき・消したときに呼ぶ（消したときは `''`） */
	onValueChange?(value: string): void
	open?: boolean
	/** はじめから開いておく */
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	/** 表示の形。既定は `2026/11/24` */
	formatDate?(value: string): string
	/** カレンダーの下の「今日」「消す」を出さない */
	hideFooter?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<DatePickerLabels>
	/** カレンダーの文言 */
	calendarLabels?: Partial<CalendarLabels>
	/** 囲み（枠）の class */
	className?: string
	/** カレンダーの枠の class */
	contentClassName?: string
}

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
	(
		{
			value: valueProp,
			defaultValue = '',
			onValueChange,
			open: openProp,
			defaultOpen = false,
			onOpenChange,
			min,
			max,
			isDateDisabled,
			weekStartsOn,
			today: todayProp,
			formatDate = formatDateSlash,
			hideFooter = false,
			labels: labelsProp,
			calendarLabels,
			className,
			contentClassName,
			name,
			placeholder = '年/月/日',
			disabled,
			readOnly,
			required,
			onBlur,
			onKeyDown,
			...inputProps
		},
		ref,
	) => {
		const labels = { ...datePickerLabels, ...labelsProp }
		const today = isDateString(todayProp) ? todayProp : todayString()

		const [innerValue, setInnerValue] = React.useState(defaultValue)
		const raw = valueProp !== undefined ? valueProp : innerValue
		const value = isDateString(raw) ? raw : ''

		const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
		const open = openProp ?? innerOpen
		const setOpen = (next: boolean) => {
			setInnerOpen(next)
			onOpenChange?.(next)
		}

		// 打っている途中の文字。null のあいだは、値を表示の形にした物を見せる
		const [draft, setDraft] = React.useState<string | null>(null)
		const text = draft ?? (value ? formatDate(value) : '')

		const selectable = (date: string) =>
			!((min && date < min) || (max && date > max) || isDateDisabled?.(date))

		const commit = (next: string) => {
			setDraft(null)
			if (next === value) return
			if (valueProp === undefined) setInnerValue(next)
			onValueChange?.(next)
		}

		/** 打った文字を確かめる。読めない・選べないときは元の値に戻す */
		const commitDraft = () => {
			if (draft === null) return
			if (draft.trim() === '') {
				if (required) setDraft(null)
				else commit('')
				return
			}
			const parsed = parseDateText(draft, today)
			if (parsed && selectable(parsed)) commit(parsed)
			else setDraft(null)
		}

		const canEdit = !disabled && !readOnly

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<InputGroup data-slot='date-picker' className={className}>
						<InputGroupInput
							ref={ref}
							type='text'
							inputMode='numeric'
							autoComplete='off'
							placeholder={placeholder}
							disabled={disabled}
							readOnly={readOnly}
							required={required}
							className='tabular-nums'
							{...inputProps}
							value={text}
							onChange={event => setDraft(event.target.value)}
							onBlur={event => {
								commitDraft()
								onBlur?.(event)
							}}
							onKeyDown={event => {
								onKeyDown?.(event)
								if (event.defaultPrevented) return
								if (event.key === 'Enter' && draft !== null) {
									// 打った文字を確かめるだけにして、フォームは送らない
									event.preventDefault()
									commitDraft()
								} else if (
									event.key === 'ArrowDown' &&
									event.altKey &&
									canEdit
								) {
									event.preventDefault()
									commitDraft()
									setOpen(true)
								}
							}}
						/>
						<InputGroupAddon align='inline-end'>
							<PopoverTrigger asChild disabled={!canEdit}>
								<InputGroupButton
									size='icon-xs'
									aria-label={labels.open}
									disabled={!canEdit}
								>
									<CalendarIcon />
								</InputGroupButton>
							</PopoverTrigger>
						</InputGroupAddon>
						{name && (
							// 使えない欄の値は、ブラウザの入力欄と同じく送らない
							<input
								type='hidden'
								name={name}
								value={value}
								disabled={disabled}
							/>
						)}
					</InputGroup>
				</PopoverAnchor>
				<PopoverContent
					align='start'
					className={cn('w-auto p-0', contentClassName)}
					onOpenAutoFocus={focusCalendarDay}
				>
					<Calendar
						autoFocus
						value={value}
						onValueChange={next => {
							commit(next)
							setOpen(false)
						}}
						min={min}
						max={max}
						isDateDisabled={isDateDisabled}
						weekStartsOn={weekStartsOn}
						today={today}
						labels={calendarLabels}
					/>
					{!hideFooter && (
						<div className='flex items-center justify-between gap-2 border-t border-border px-2 py-1.5'>
							<Button
								type='button'
								variant='ghost'
								size='sm'
								disabled={!selectable(today)}
								onClick={() => {
									commit(today)
									setOpen(false)
								}}
							>
								{labels.today}
							</Button>
							{!required && (
								<Button
									type='button'
									variant='ghost'
									size='sm'
									disabled={!value}
									onClick={() => {
										commit('')
										setOpen(false)
									}}
								>
									{labels.clear}
								</Button>
							)}
						</div>
					)}
				</PopoverContent>
			</Popover>
		)
	},
)
DatePicker.displayName = 'DatePicker'

export interface DateRangePickerLabels {
	/** 値を消すボタン */
	clear: string
	/** はじめの日だけ選んだときの案内 */
	pickEnd: string
}

export const dateRangePickerLabels: DateRangePickerLabels = {
	clear: '消す',
	pickEnd: '終わりの日を選んでください',
}

export interface DateRangePickerProps
	extends CalendarPass,
		Omit<
			React.ButtonHTMLAttributes<HTMLButtonElement>,
			'value' | 'defaultValue' | 'onChange' | 'type'
		> {
	/** 選んだ期間。選んでいなければ `{ from: '', to: '' }` */
	value?: DateRange
	defaultValue?: DateRange
	/** 期間が決まったとき・消したときに呼ぶ（選んでいる途中は呼ばない） */
	onValueChange?(value: DateRange): void
	open?: boolean
	/** はじめから開いておく */
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	/** 選んでいないときの文字 */
	placeholder?: string
	/** 表示の形。既定は `2026/11/24` */
	formatDate?(value: string): string
	/** はじめと終わりのあいだの文字。既定は `〜` */
	separator?: string
	/** フォームで送るときの名前。`[from, to]` の順 */
	names?: readonly [string, string]
	/** 空にできない（「消す」を出さない） */
	required?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<DateRangePickerLabels>
	/** カレンダーの文言 */
	calendarLabels?: Partial<CalendarLabels>
	/** カレンダーの枠の class */
	contentClassName?: string
}

const NO_RANGE: DateRange = { from: '', to: '' }

/**
 * 期間の入力欄。押すとカレンダーが開き、はじめの日・終わりの日の順に押して選ぶ
 * （終わりを先に押しても、早い日がはじめになる）。値は `{ from, to }`（どちらも `YYYY-MM-DD`）。
 */
const DateRangePicker = React.forwardRef<
	HTMLButtonElement,
	DateRangePickerProps
>(
	(
		{
			value: valueProp,
			defaultValue = NO_RANGE,
			onValueChange,
			open: openProp,
			defaultOpen = false,
			onOpenChange,
			min,
			max,
			isDateDisabled,
			weekStartsOn,
			today,
			placeholder = '期間を選ぶ',
			formatDate = formatDateSlash,
			separator = '〜',
			names,
			required,
			labels: labelsProp,
			calendarLabels,
			className,
			contentClassName,
			disabled,
			...buttonProps
		},
		ref,
	) => {
		const labels = { ...dateRangePickerLabels, ...labelsProp }

		const [innerValue, setInnerValue] = React.useState(defaultValue)
		const raw = valueProp !== undefined ? valueProp : innerValue
		const value: DateRange =
			isDateString(raw?.from) && isDateString(raw?.to)
				? { from: raw.from, to: raw.to }
				: NO_RANGE
		const hasValue = Boolean(value.from)

		// 開いているあいだに選んでいる途中の期間。閉じたら捨てる
		const [draft, setDraft] = React.useState<DateRange | null>(null)

		const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
		const open = openProp ?? innerOpen
		const setOpen = (next: boolean) => {
			if (!next) setDraft(null)
			setInnerOpen(next)
			onOpenChange?.(next)
		}

		// 外から open を false にして閉じたときも、選んでいる途中の期間を捨てる
		React.useEffect(() => {
			if (!open) setDraft(null)
		}, [open])

		const commit = (next: DateRange) => {
			if (valueProp === undefined) setInnerValue(next)
			onValueChange?.(next)
		}

		const contentId = React.useId()
		const picking = Boolean(draft?.from) && !draft?.to

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild disabled={disabled}>
					<button
						ref={ref}
						type='button'
						data-slot='date-range-picker'
						aria-haspopup='dialog'
						aria-expanded={open}
						aria-controls={open ? contentId : undefined}
						disabled={disabled}
						className={cn(
							'flex h-7 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors duration-fast hover:bg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive/25',
							className,
						)}
						{...buttonProps}
					>
						<span
							className={cn(
								'truncate tabular-nums',
								!hasValue && 'text-subtle-foreground',
							)}
						>
							{hasValue
								? `${formatDate(value.from)} ${separator} ${formatDate(value.to)}`
								: placeholder}
						</span>
						<CalendarIcon className='size-3.5 shrink-0 text-subtle-foreground' />
					</button>
				</PopoverTrigger>
				{names && (
					<>
						<input
							type='hidden'
							name={names[0]}
							value={value.from}
							disabled={disabled}
						/>
						<input
							type='hidden'
							name={names[1]}
							value={value.to}
							disabled={disabled}
						/>
					</>
				)}
				<PopoverContent
					id={contentId}
					align='start'
					className={cn('w-auto p-0', contentClassName)}
					onOpenAutoFocus={focusCalendarDay}
				>
					<Calendar
						autoFocus
						mode='range'
						value={draft ?? value}
						onValueChange={next => {
							if (!next.to) {
								setDraft(next)
								return
							}
							commit(next)
							setOpen(false)
						}}
						min={min}
						max={max}
						isDateDisabled={isDateDisabled}
						weekStartsOn={weekStartsOn}
						today={today}
						labels={calendarLabels}
					/>
					<div className='flex min-h-9 items-center justify-between gap-2 border-t border-border px-2 py-1.5'>
						<span
							aria-live='polite'
							className='px-1 text-xs text-muted-foreground'
						>
							{picking ? labels.pickEnd : ''}
						</span>
						{!required && (
							<Button
								type='button'
								variant='ghost'
								size='sm'
								disabled={!hasValue && !draft}
								onClick={() => {
									if (hasValue) commit(NO_RANGE)
									setOpen(false)
								}}
							>
								{labels.clear}
							</Button>
						)}
					</div>
				</PopoverContent>
			</Popover>
		)
	},
)
DateRangePicker.displayName = 'DateRangePicker'

export { DatePicker, DateRangePicker }
