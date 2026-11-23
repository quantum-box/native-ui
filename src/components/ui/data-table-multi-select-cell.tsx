import { Check } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './command'
import {
	type DataTableInlineEditOptions,
	DataTableInlineEditShell,
	DataTableInlineEditTrigger,
	useDataTableInlineEdit,
} from './data-table-inline-edit'
import {
	type DataTableSelectOption,
	DataTableValueChip,
} from './data-table-select-cell'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type DataTableMultiSelectCellProps = Omit<
	DataTableInlineEditOptions<readonly string[]>,
	'equals'
> & {
	options: readonly DataTableSelectOption[]
	/** セルを押す所の読み上げ名（例「商品Aのタグを変更」）。 */
	ariaLabel: string
	/** 何を選ぶか（例「タグ」）。検索欄や候補の読み上げに使う。 */
	label: string
	/** 空のときの表示。 */
	emptyLabel?: string
	emptySearchMessage?: string
	/** 値の見た目。既定は小さな札。 */
	renderValue?: (label: string, value: string) => ReactNode
	className?: string
}

function sameSet(a: readonly string[], b: readonly string[]) {
	return a.length === b.length && a.every(value => b.indexOf(value) >= 0)
}

/**
 * 複数を選んでその場で直すセル（タグなど）。押すか Enter で候補が開き、
 * Enter・クリックで付け外しする。「保存」か外を押すと保存し、Esc か「やめる」でやめる。
 */
export function DataTableMultiSelectCell({
	options,
	ariaLabel,
	label,
	emptyLabel = '未設定',
	emptySearchMessage = '一致する選択肢はありません。',
	renderValue = text => <DataTableValueChip label={text} />,
	className,
	...rest
}: DataTableMultiSelectCellProps) {
	const edit = useDataTableInlineEdit({ ...rest, equals: sameSet })
	const [draft, setDraft] = useState<readonly string[]>([])
	const cancelled = useRef(false)
	const labelOf = (value: string) =>
		options.find(option => option.value === value)?.label ?? value

	function toggle(value: string) {
		setDraft(current =>
			current.indexOf(value) >= 0
				? current.filter(item => item !== value)
				: // 選択肢の並びにそろえる。
					options
						.map(option => option.value)
						.filter(item => item === value || current.indexOf(item) >= 0),
		)
	}

	return (
		<DataTableInlineEditShell
			error={edit.editing ? null : edit.error}
			className={className}
		>
			<Popover
				open={edit.editing}
				onOpenChange={open => {
					if (open) {
						if (edit.startEditing()) {
							cancelled.current = false
							setDraft(edit.value)
						}
					} else if (cancelled.current) {
						edit.cancel()
					} else {
						void edit.save(draft)
					}
				}}
			>
				<PopoverTrigger asChild>
					<DataTableInlineEditTrigger
						aria-label={ariaLabel}
						status={edit.status}
						error={edit.editing ? null : edit.error}
						saving={edit.saving}
						disabled={edit.disabled}
					>
						<span className='flex min-w-0 flex-wrap gap-1 whitespace-normal'>
							{edit.value.length ? (
								edit.value.map(value => (
									<span key={value} className='min-w-0'>
										{renderValue(labelOf(value), value)}
									</span>
								))
							) : (
								<span className='text-muted-foreground'>{emptyLabel}</span>
							)}
						</span>
					</DataTableInlineEditTrigger>
				</PopoverTrigger>
				<PopoverContent
					align='start'
					sideOffset={0}
					className='w-64 max-w-[calc(100vw-24px)] p-0'
					aria-label={`${label}を選択`}
					onEscapeKeyDown={() => {
						cancelled.current = true
					}}
				>
					<Command>
						<CommandInput
							aria-label={`${label}を検索`}
							placeholder={`${label}を検索…`}
						/>
						<CommandList aria-label={`${label}の候補`}>
							<CommandEmpty>{emptySearchMessage}</CommandEmpty>
							<CommandGroup>
								{options.map(option => {
									const selected = draft.indexOf(option.value) >= 0
									return (
										<CommandItem
											key={option.value}
											value={option.value}
											keywords={[option.label, ...(option.keywords ?? [])]}
											aria-checked={selected}
											onSelect={() => toggle(option.value)}
										>
											<span
												aria-hidden
												className={cn(
													'flex size-4 shrink-0 items-center justify-center rounded-sm border border-input',
													selected &&
														'border-primary bg-primary text-primary-foreground',
												)}
											>
												{selected ? <Check className='size-3' /> : null}
											</span>
											{renderValue(option.label, option.value)}
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
					<div className='flex items-center justify-between gap-2 border-t border-border p-2'>
						<span className='text-muted-foreground text-xs'>
							{draft.length}件を選択中
						</span>
						<div className='flex gap-1'>
							<Button
								type='button'
								size='sm'
								variant='ghost'
								onClick={() => {
									cancelled.current = true
									edit.cancel()
								}}
							>
								やめる
							</Button>
							<Button
								type='button'
								size='sm'
								variant='primary'
								onClick={() => void edit.save(draft)}
							>
								保存
							</Button>
						</div>
					</div>
					{edit.editing && edit.error ? (
						<p className='px-2 pb-2 text-destructive text-xs' role='alert'>
							{edit.error}
						</p>
					) : null}
				</PopoverContent>
			</Popover>
		</DataTableInlineEditShell>
	)
}
