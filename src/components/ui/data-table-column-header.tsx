import {
	ArrowDown,
	ArrowUp,
	ChevronDown,
	Filter,
	Pin,
	PinOff,
} from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from './button'
import { Input } from './input'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type DataTableFilterField = {
	key: string
	label: string
	type?: 'text' | 'number' | 'date' | 'select'
	min?: number
	step?: number | 'any'
	maxLength?: number
	options?: readonly { value: string; label: string }[]
	disabled?: boolean
	hint?: string
	error?: string
}
export type DataTableColumnHeaderProps = {
	label: string
	sort?: {
		direction: 'asc' | 'desc' | null
		onChange: (direction: 'asc' | 'desc' | null) => void
	}
	filter?: {
		active: boolean
		fields: readonly DataTableFilterField[]
		values: Readonly<Record<string, string>>
		disabled?: boolean
		validate?: (values: Readonly<Record<string, string>>) => string | null
		onApply: (values: Record<string, string>) => void
		onClear: () => void
	}
	pin?: { pinned: boolean; onChange: (pinned: boolean) => void }
	onOpenChange?: (open: boolean) => void
}

/**
 * 列の見出し。押すとメニューが開き、並び替え・絞り込み・左に固定ができる。
 *
 * 表示だけを受け持つ。今の並び替え・絞り込み・固定の状態は使う側が渡し、
 * 変わったら `onChange`・`onApply`・`onClear` で知らせる。URL や端末に残すかは使う側が決める。
 * `sort`・`filter`・`pin` は省くとその操作を出さない。
 */
export function DataTableColumnHeader({
	label,
	sort,
	filter,
	pin,
	onOpenChange,
}: DataTableColumnHeaderProps) {
	const id = useId()
	const [open, setOpen] = useState(false)
	const [draft, setDraft] = useState<Record<string, string>>({})
	const [error, setError] = useState<string | null>(null)
	const sorted = !!sort?.direction
	const ascending = sort?.direction === 'asc'
	const filtered = filter?.active
	const pinned = pin?.pinned
	const menuButton =
		'flex h-8 w-full items-center gap-2 rounded-sm px-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
	function changeOpen(next: boolean) {
		if (next) {
			setDraft({ ...filter?.values })
			setError(null)
		}
		setOpen(next)
		onOpenChange?.(next)
	}
	function applyFilter() {
		if (!filter || filter.disabled) return
		// 自分の項目だけを渡す（ほかの列の絞り込みは混ぜない）。
		const values: Record<string, string> = {}
		for (const field of filter.fields)
			values[field.key] = (draft[field.key] ?? '').trim()
		const failure = filter.validate?.(values)
		if (failure) {
			setError(failure)
			return
		}
		filter.onApply(values)
		changeOpen(false)
	}

	return (
		<Popover open={open} onOpenChange={changeOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					aria-label={`${label}列のメニュー`}
					className='flex h-[38px] w-full whitespace-nowrap items-center gap-2 px-5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring'
				>
					{label}
					{sorted ? (
						ascending ? (
							<ArrowUp className='h-3 w-3' />
						) : (
							<ArrowDown className='h-3 w-3' />
						)
					) : null}
					{filtered ? (
						<Filter aria-label='絞り込み中' className='h-3 w-3' />
					) : null}
					{pinned ? <Pin aria-label='固定中' className='h-3 w-3' /> : null}
					<ChevronDown aria-hidden className='ml-auto h-3 w-3' />
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='w-64 max-w-[calc(100vw-24px)] p-2'
				aria-label={`${label}列の操作`}
			>
				<p className='px-2 py-1 text-muted-foreground text-xs'>{label}</p>
				{sort ? (
					<div className='border-b pb-2'>
						<button
							type='button'
							className={menuButton}
							onClick={() => {
								sort.onChange('asc')
								changeOpen(false)
							}}
						>
							<ArrowUp className='h-4 w-4' />
							昇順に並び替え
						</button>
						<button
							type='button'
							className={menuButton}
							onClick={() => {
								sort.onChange('desc')
								changeOpen(false)
							}}
						>
							<ArrowDown className='h-4 w-4' />
							降順に並び替え
						</button>
						{sorted ? (
							<button
								type='button'
								className={menuButton}
								onClick={() => {
									sort.onChange(null)
									changeOpen(false)
								}}
							>
								並び替えを解除
							</button>
						) : null}
					</div>
				) : null}
				{filter ? (
					<form
						className='space-y-3 px-2 py-3'
						onSubmit={event => {
							event.preventDefault()
							applyFilter()
						}}
					>
						<p className='flex items-center gap-2 font-medium text-xs'>
							<Filter className='h-3 w-3' />
							絞り込み
						</p>
						{filter.fields.map(field => (
							<label
								key={field.key}
								className='block space-y-1 text-xs'
								htmlFor={`${id}-${field.key}`}
							>
								<span className='text-muted-foreground'>{field.label}</span>
								{field.type === 'select' ? (
									<select
										id={`${id}-${field.key}`}
										className='h-8 w-full rounded-md border bg-background px-2 text-sm'
										disabled={field.disabled}
										value={draft[field.key] ?? ''}
										onChange={event =>
											setDraft(current => ({
												...current,
												[field.key]: event.target.value,
											}))
										}
									>
										<option value=''>すべて</option>
										{field.options?.map(option => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
										{draft[field.key] &&
										!field.options?.some(
											option => option.value === draft[field.key],
										) ? (
											<option value={draft[field.key]}>
												{draft[field.key]}
											</option>
										) : null}
									</select>
								) : (
									<Input
										id={`${id}-${field.key}`}
										type={field.type ?? 'text'}
										min={field.min}
										step={field.step}
										disabled={field.disabled}
										maxLength={field.maxLength}
										value={draft[field.key] ?? ''}
										onChange={event =>
											setDraft(current => ({
												...current,
												[field.key]: event.target.value,
											}))
										}
									/>
								)}
								{field.hint ? (
									<span className='block text-muted-foreground'>
										{field.hint}
									</span>
								) : null}
								{field.error ? (
									<span role='alert' className='block text-destructive'>
										{field.error}
									</span>
								) : null}
							</label>
						))}
						{error ? (
							<p role='alert' className='text-destructive text-xs'>
								{error}
							</p>
						) : null}
						<div className='flex items-center justify-between gap-2'>
							<Button
								type='button'
								size='sm'
								variant='ghost'
								onClick={() => {
									filter.onClear()
									changeOpen(false)
								}}
							>
								条件をクリア
							</Button>
							<Button type='submit' size='sm' disabled={filter.disabled}>
								適用
							</Button>
						</div>
					</form>
				) : null}
				{pin ? (
					<div className='border-t pt-2'>
						<button
							type='button'
							className={menuButton}
							onClick={() => {
								pin.onChange(!pin.pinned)
								changeOpen(false)
							}}
						>
							{pinned ? (
								<PinOff className='h-4 w-4' />
							) : (
								<Pin className='h-4 w-4' />
							)}
							{pinned ? '固定を解除' : '左に固定'}
						</button>
					</div>
				) : null}
			</PopoverContent>
		</Popover>
	)
}
