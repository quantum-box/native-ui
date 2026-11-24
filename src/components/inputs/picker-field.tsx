'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'
import {
	Popover,
	PopoverAnchor,
	PopoverContent,
	type PopoverContentProps,
	PopoverTrigger,
} from '../overlays/popover'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupInput,
} from './input-group'

/*
 * 「手で打てる欄 + 右のボタンで開く枠」の土台。DatePicker・MonthPicker・TimePicker が使う
 * （部品として外には出さない）。
 *
 * - 値は文字（空は `''`）。外で持つ（value）か、中で持つ（defaultValue）。
 * - 打った文字は、欄を離れたときか Enter で確かめる。読めない・選べないときは元の値に戻す。
 * - name を渡すと、値を見えない入力欄でフォームに送る（使えない欄は送らない）。
 *   フォームの reset で、はじめの値に戻る。
 * - 使えない・読むだけになったら、開いていても閉じる。
 */

/** 見えない入力欄が入っているフォームの reset を聞く */
export function useFormReset(
	ref: React.RefObject<HTMLInputElement | null>,
	onReset: () => void,
) {
	const latest = React.useRef(onReset)
	latest.current = onReset
	React.useEffect(() => {
		const form = ref.current?.form
		if (!form) return
		// reset は取り消せる（onReset で preventDefault）。このリスナーは React の onReset より
		// 先に呼ばれるので、イベントが配り終わるのを待ってから、取り消されていないときだけ戻す
		const handle = (event: Event) => {
			setTimeout(() => {
				if (!event.defaultPrevented) latest.current()
			}, 0)
		}
		form.addEventListener('reset', handle)
		return () => form.removeEventListener('reset', handle)
	})
}

/** 開いたときのフォーカスは、中身（autoFocus）に任せる */
export const keepFocusForContent = (event: Event) => {
	event.preventDefault()
}

/** 欄の props のうち、どの欄にも共通の物 */
export interface PickerFieldBaseProps
	extends Omit<
		React.InputHTMLAttributes<HTMLInputElement>,
		| 'value'
		| 'defaultValue'
		| 'onChange'
		| 'type'
		| 'min'
		| 'max'
		| 'step'
		| 'children'
	> {
	value?: string
	defaultValue?: string
	/** 値が決まったとき・消したときに呼ぶ（消したときは `''`） */
	onValueChange?(value: string): void
	open?: boolean
	/** はじめから開いておく */
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	/** 囲み（枠）の class */
	className?: string
	/** 開く枠の class */
	contentClassName?: string
}

export interface PickerFieldApi {
	/** 今の値（正しい形か `''`） */
	value: string
	/** 値を決めて閉じる */
	select(next: string): void
}

interface PickerFieldProps extends PickerFieldBaseProps {
	/** 囲みの data-slot */
	slot: string
	/** 渡された値を正しい形にする（違えば `''`） */
	normalize(raw: unknown): string
	/** 打った文字を値に直す（読めなければ `''`） */
	parse(text: string): string
	/** 値を表示の形にする */
	format(value: string): string
	/** その値を選べるか */
	selectable(value: string): boolean
	/** 開くボタンの印と読み上げ名 */
	icon: React.ReactNode
	openLabel: string
	contentProps?: Partial<PopoverContentProps>
	/** 開く枠の中身 */
	children(api: PickerFieldApi): React.ReactNode
}

export const PickerField = React.forwardRef<HTMLInputElement, PickerFieldProps>(
	(
		{
			slot,
			normalize,
			parse,
			format,
			selectable,
			icon,
			openLabel,
			contentProps,
			children,
			value: valueProp,
			defaultValue = '',
			onValueChange,
			open: openProp,
			defaultOpen = false,
			onOpenChange,
			className,
			contentClassName,
			name,
			form,
			disabled,
			readOnly,
			required,
			onBlur,
			onKeyDown,
			...inputProps
		},
		ref,
	) => {
		const [innerValue, setInnerValue] = React.useState(defaultValue)
		const value = normalize(valueProp !== undefined ? valueProp : innerValue)

		const [innerOpen, setInnerOpen] = React.useState(defaultOpen)
		const canEdit = !disabled && !readOnly
		// 使えない・読むだけになったら、開いていても閉じる（開いたまま値を変えられないように）
		const open = (openProp ?? innerOpen) && canEdit
		const setOpen = (next: boolean) => {
			setInnerOpen(next)
			onOpenChange?.(next)
		}

		// 打っている途中の文字。null のあいだは、値を表示の形にした物を見せる
		const [draft, setDraft] = React.useState<string | null>(null)

		// フォームの reset で、はじめの値に戻す（外で値を持つときは、外に任せる）
		const hiddenRef = React.useRef<HTMLInputElement>(null)
		useFormReset(hiddenRef, () => {
			setInnerValue(defaultValue)
			setDraft(null)
		})
		const text = draft ?? (value ? format(value) : '')

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
			const parsed = parse(draft)
			if (parsed && selectable(parsed)) commit(parsed)
			else setDraft(null)
		}

		return (
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverAnchor asChild>
					<InputGroup data-slot={slot} className={className}>
						<InputGroupInput
							ref={ref}
							type='text'
							inputMode='numeric'
							autoComplete='off'
							disabled={disabled}
							readOnly={readOnly}
							required={required}
							className='tabular-nums'
							form={form}
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
									aria-label={openLabel}
									disabled={!canEdit}
								>
									{icon}
								</InputGroupButton>
							</PopoverTrigger>
						</InputGroupAddon>
						{name && (
							// 使えない欄の値は、ブラウザの入力欄と同じく送らない
							<input
								ref={hiddenRef}
								type='hidden'
								form={form}
								name={name}
								value={value}
								disabled={disabled}
							/>
						)}
					</InputGroup>
				</PopoverAnchor>
				<PopoverContent
					align='start'
					onOpenAutoFocus={keepFocusForContent}
					{...contentProps}
					className={cn('w-auto p-0', contentClassName)}
				>
					{children({
						value,
						select: next => {
							commit(next)
							setOpen(false)
						},
					})}
				</PopoverContent>
			</Popover>
		)
	},
)
PickerField.displayName = 'PickerField'

/** 開く枠の下の帯（「今日」「消す」など） */
export function PickerFooter({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'flex items-center justify-between gap-2 border-t border-border px-2 py-1.5',
				className,
			)}
			{...props}
		/>
	)
}
