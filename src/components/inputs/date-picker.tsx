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
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover'
import {
	Calendar,
	type CalendarLabels,
	type CalendarSingleProps,
	type DateRange,
} from './calendar'
import {
	PickerField,
	type PickerFieldBaseProps,
	PickerFooter,
	keepFocusForContent,
	useFormReset,
} from './picker-field'

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

export interface DatePickerProps extends CalendarPass, PickerFieldBaseProps {
	/** 選んだ日（`YYYY-MM-DD`）。空は `''` */
	value?: string
	/** 表示の形。既定は `2026/11/24` */
	formatDate?(value: string): string
	/** カレンダーの下の「今日」「消す」を出さない */
	hideFooter?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<DatePickerLabels>
	/** カレンダーの文言 */
	calendarLabels?: Partial<CalendarLabels>
}

const asDate = (raw: unknown) => (isDateString(raw) ? raw : '')

const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
	(
		{
			min,
			max,
			isDateDisabled,
			weekStartsOn,
			today: todayProp,
			formatDate = formatDateSlash,
			hideFooter = false,
			labels: labelsProp,
			calendarLabels,
			placeholder = '年/月/日',
			...props
		},
		ref,
	) => {
		const labels = { ...datePickerLabels, ...labelsProp }
		const today = isDateString(todayProp) ? todayProp : todayString()
		const selectable = (date: string) =>
			!((min && date < min) || (max && date > max) || isDateDisabled?.(date))

		return (
			<PickerField
				ref={ref}
				slot='date-picker'
				normalize={asDate}
				parse={text => parseDateText(text, today)}
				format={formatDate}
				selectable={selectable}
				icon={<CalendarIcon />}
				openLabel={labels.open}
				placeholder={placeholder}
				{...props}
			>
				{({ value, select }) => (
					<>
						<Calendar
							autoFocus
							value={value}
							onValueChange={select}
							min={min}
							max={max}
							isDateDisabled={isDateDisabled}
							weekStartsOn={weekStartsOn}
							today={today}
							labels={calendarLabels}
						/>
						{!hideFooter && (
							<PickerFooter>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									disabled={!selectable(today)}
									onClick={() => select(today)}
								>
									{labels.today}
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
			form,
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

		// フォームの reset で、はじめの値に戻す
		const hiddenRef = React.useRef<HTMLInputElement>(null)
		useFormReset(hiddenRef, () => {
			setInnerValue(defaultValue)
			setDraft(null)
		})

		const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
		// 使えなくなったら、開いていても閉じる
		const open = (openProp ?? innerOpen) && !disabled
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
						form={form}
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
							ref={hiddenRef}
							type='hidden'
							form={form}
							name={names[0]}
							value={value.from}
							disabled={disabled}
						/>
						<input
							type='hidden'
							form={form}
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
					onOpenAutoFocus={keepFocusForContent}
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
