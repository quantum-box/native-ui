'use client'

import { Clock } from 'lucide-react'
import * as React from 'react'

import {
	isTimeString,
	parseTimeText,
	timeOptions,
} from '../../lib/calendar-date'
import { cn } from '../../lib/utils'
import { Button } from '../basics/button'
import {
	PickerField,
	type PickerFieldBaseProps,
	PickerFooter,
} from './picker-field'

/*
 * 時刻の入力欄。手で打つことも、右のボタンで時刻の一覧を開いて選ぶこともできる。
 *
 * - 値は `HH:MM` の文字（24 時間、空は `''`）。`<input type="time">` と同じ形。
 * - 手で打った文字は、欄を離れたときか Enter で確かめる。`9:30`・`930`・`0930`・`9`（9:00）・
 *   `9時30分` などを受け取る。打つときは 1 分きざみで入れられる（一覧のきざみに縛られない）。
 *   読めない文字・範囲の外の時刻は、元の値に戻す。
 * - 開いた一覧: `step` 分きざみ（既定は 30 分）。上下の矢印で動き、Home・End で端、
 *   PageUp・PageDown で 1 時間ぶん、Enter・Space で選ぶ。
 */

export interface TimePickerLabels {
	/** 時刻の一覧を開くボタンの読み上げ名 */
	open: string
	/** 一覧の読み上げ名 */
	list: string
	/** 値を消すボタン */
	clear: string
}

export const timePickerLabels: TimePickerLabels = {
	open: '時刻の一覧を開く',
	list: '時刻',
	clear: '消す',
}

interface TimeListProps {
	value: string
	onSelect(time: string): void
	options: string[]
	/** 値が無いときに、はじめに見せる時刻 */
	scrollTo: string
	/** 1 時間ぶんの項目の数（PageUp・PageDown で動く数） */
	page: number
	label: string
}

function TimeList({
	value,
	onSelect,
	options,
	scrollTo,
	page,
	label,
}: TimeListProps) {
	// はじめにフォーカスを置く時刻: 値と同じか、その次の物。無ければ最後の物
	const initial = React.useMemo(() => {
		const from = value || scrollTo
		for (const option of options) if (option >= from) return option
		return options[options.length - 1] ?? ''
	}, [value, scrollTo, options])
	const [focused, setFocused] = React.useState(initial)
	const listRef = React.useRef<HTMLDivElement>(null)
	const focusAfterRender = React.useRef(true)

	React.useEffect(() => {
		if (!focusAfterRender.current) return
		focusAfterRender.current = false
		const el = listRef.current?.querySelector<HTMLElement>(
			`[data-time="${focused}"]`,
		)
		if (!el) return
		// 一覧の真ん中あたりに見せる
		const list = listRef.current
		if (list) list.scrollTop = el.offsetTop - list.clientHeight / 2 + 14
		el.focus({ preventScroll: true })
	})

	const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
		const time = (event.target as HTMLElement).closest<HTMLElement>(
			'[data-time]',
		)?.dataset.time
		if (!time) return
		const index = options.indexOf(time)
		const last = options.length - 1
		const targets: Record<string, number> = {
			ArrowUp: index - 1,
			ArrowDown: index + 1,
			Home: 0,
			End: last,
			PageUp: index - page,
			PageDown: index + page,
		}
		const target = targets[event.key]
		if (target === undefined) return
		event.preventDefault()
		const next = options[Math.max(0, Math.min(last, target))]
		setFocused(next)
		listRef.current
			?.querySelector<HTMLElement>(`[data-time="${next}"]`)
			?.focus()
	}

	return (
		<div
			ref={listRef}
			role='listbox'
			// フォーカスは中の項目が持つ（一覧そのものには Tab で止まらない）
			tabIndex={-1}
			aria-label={label}
			data-slot='time-list'
			className='relative max-h-56 w-24 select-none overflow-y-auto p-1 text-foreground'
			onKeyDown={handleKeyDown}
		>
			{options.map(option => {
				const isSelected = option === value
				return (
					<button
						key={option}
						type='button'
						role='option'
						aria-selected={isSelected}
						data-time={option}
						tabIndex={option === focused ? 0 : -1}
						onClick={() => onSelect(option)}
						onFocus={() => setFocused(option)}
						className={cn(
							'flex h-7 w-full items-center justify-center rounded-md text-sm tabular-nums transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50',
							isSelected
								? 'bg-primary font-medium text-primary-foreground'
								: 'hover:bg-muted',
						)}
					>
						{option}
					</button>
				)
			})}
		</div>
	)
}

export interface TimePickerProps extends PickerFieldBaseProps {
	/** 選んだ時刻（`HH:MM`）。空は `''` */
	value?: string
	/** 選べる最初の時刻（`HH:MM`、その時刻を含む） */
	min?: string
	/** 選べる最後の時刻（`HH:MM`、その時刻を含む） */
	max?: string
	/** 一覧のきざみ（分）。既定は 30。手で打つときは 1 分きざみで入れられる */
	step?: number
	/** 値が無いときに、一覧ではじめに見せる時刻。既定は `09:00` */
	scrollTo?: string
	/** 一覧の下の「消す」を出さない */
	hideFooter?: boolean
	/** 文言。渡した物だけ差し替える */
	labels?: Partial<TimePickerLabels>
}

const asTime = (raw: unknown) => (isTimeString(raw) ? raw : '')

const TimePicker = React.forwardRef<HTMLInputElement, TimePickerProps>(
	(
		{
			min,
			max,
			step = 30,
			scrollTo = '09:00',
			hideFooter = false,
			labels: labelsProp,
			placeholder = '時:分',
			...props
		},
		ref,
	) => {
		const labels = { ...timePickerLabels, ...labelsProp }
		const lower = isTimeString(min) ? min : '00:00'
		const upper = isTimeString(max) ? max : '23:59'
		const options = React.useMemo(
			() => timeOptions(step, lower, upper),
			[step, lower, upper],
		)
		const selectable = (time: string) => time >= lower && time <= upper
		const showFooter = !hideFooter && !props.required

		return (
			<PickerField
				ref={ref}
				slot='time-picker'
				normalize={asTime}
				parse={parseTimeText}
				format={time => time}
				selectable={selectable}
				icon={<Clock />}
				openLabel={labels.open}
				placeholder={placeholder}
				{...props}
			>
				{({ value, select }) => (
					<>
						<TimeList
							value={value}
							onSelect={select}
							options={options}
							scrollTo={scrollTo}
							page={Math.max(1, Math.round(60 / Math.max(1, step)))}
							label={labels.list}
						/>
						{showFooter && (
							<PickerFooter className='justify-end'>
								<Button
									type='button'
									variant='ghost'
									size='sm'
									disabled={!value}
									onClick={() => select('')}
								>
									{labels.clear}
								</Button>
							</PickerFooter>
						)}
					</>
				)}
			</PickerField>
		)
	},
)
TimePicker.displayName = 'TimePicker'

export { TimePicker }
