import { Check, Loader2 } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'

import { Badge } from './badge'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type DataTableSelectOption = {
	value: string
	label: string
	keywords?: string[]
}
export type DataTableSelectCellProps = {
	value: string
	options: readonly DataTableSelectOption[]
	ariaLabel: string
	label: string
	groupLabel?: string
	disabled?: boolean
	emptyOptionsAction?: ReactNode
	emptySearchMessage?: string
	onSave: (value: string) => Promise<void>
	formatError?: (error: unknown) => string
	renderValue?: (label: string, value: string) => ReactNode
}

/**
 * 表の中でその場で値を選んで保存するセル。
 *
 * `value` は使う側が持つ。`onSave` の中で保存し、終わる前に新しい値を反映する。
 * 失敗したら例外を投げると、表示を元に戻して `formatError` の文言を出す。
 * 保存中は操作できず、保存できたら印を出す。選択肢が無いときは値だけを表示する。
 */
export function DataTableSelectCell({
	value: committedValue,
	options,
	ariaLabel,
	label,
	groupLabel,
	disabled = false,
	emptyOptionsAction,
	emptySearchMessage = '一致する選択肢はありません。',
	onSave,
	formatError = () => '保存できませんでした。再試行してください。',
	renderValue = text => <DataTableValueChip label={text} />,
}: DataTableSelectCellProps) {
	const [open, setOpen] = useState(false)
	const [activeOption, setActiveOption] = useState(committedValue)
	const [draft, setDraft] = useState<string | null>(null)
	const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
	const [error, setError] = useState<string | null>(null)
	const saving = useRef(false)
	const value = draft ?? committedValue
	const valueLabel =
		options.find(option => option.value === value)?.label ?? (value || '未設定')
	async function save(next: string) {
		if (
			disabled ||
			saving.current ||
			next === committedValue ||
			!options.some(option => option.value === next)
		)
			return
		saving.current = true
		setDraft(next)
		setStatus('saving')
		setError(null)
		try {
			await onSave(next)
			setStatus('saved')
		} catch (cause) {
			setStatus('idle')
			setError(formatError(cause))
		} finally {
			setDraft(null)
			saving.current = false
		}
	}
	if (!options.length)
		return (
			<div className='flex min-h-[52px] items-center gap-2 whitespace-nowrap px-5 py-2'>
				{renderValue(valueLabel, value)}
				{!disabled ? emptyOptionsAction : null}
			</div>
		)

	return (
		<div className='min-w-0'>
			<Popover
				open={open}
				onOpenChange={nextOpen => {
					if (nextOpen && (disabled || saving.current)) return
					if (nextOpen) setActiveOption(committedValue)
					setOpen(nextOpen)
				}}
			>
				<PopoverTrigger asChild>
					<button
						type='button'
						aria-label={ariaLabel}
						aria-busy={status === 'saving'}
						aria-disabled={disabled || status === 'saving'}
						disabled={disabled}
						className='flex min-h-[52px] w-full items-center gap-2 px-5 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50 data-[state=open]:bg-selected data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-ring'
					>
						{renderValue(valueLabel, value)}
						<span
							className='ml-auto w-4 shrink-0 text-muted-foreground'
							role='status'
						>
							{status === 'saving' ? (
								<>
									<Loader2 aria-hidden className='h-3.5 w-3.5 animate-spin' />
									<span className='sr-only'>保存中</span>
								</>
							) : status === 'saved' ? (
								<>
									<Check aria-hidden className='h-3.5 w-3.5' />
									<span className='sr-only'>保存済み</span>
								</>
							) : null}
						</span>
					</button>
				</PopoverTrigger>
				<PopoverContent
					align='start'
					sideOffset={0}
					className='w-64 max-w-[calc(100vw-24px)] p-0'
					aria-label={`${label}を選択`}
				>
					<Command value={activeOption} onValueChange={setActiveOption}>
						<CommandInput
							aria-label={`${label}を検索`}
							placeholder={`${label}を検索…`}
						/>
						<CommandList aria-label={`${label}の候補`}>
							<CommandEmpty>{emptySearchMessage}</CommandEmpty>
							<CommandGroup heading={groupLabel}>
								{options.map(option => (
									<CommandItem
										key={option.value}
										value={option.value}
										keywords={[option.label, ...(option.keywords ?? [])]}
										onSelect={() => {
											setOpen(false)
											void save(option.value)
										}}
									>
										{renderValue(option.label, option.value)}
										{option.value === committedValue ? (
											<Check
												aria-label={`現在の${label}`}
												className='ml-auto'
											/>
										) : null}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{error ? (
				<p className='px-5 pb-2 text-destructive text-xs' role='alert'>
					{error}
				</p>
			) : null}
		</div>
	)
}

/** 表の中で値を小さな札として表示する。 */
export function DataTableValueChip({ label }: { label: string }) {
	return (
		<Badge variant='neutral' className='min-w-0 max-w-full gap-1.5'>
			<span
				aria-hidden
				className='h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50'
			/>
			<span className='truncate'>{label}</span>
		</Badge>
	)
}
