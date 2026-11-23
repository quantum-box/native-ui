import { Check } from 'lucide-react'
import { type ReactNode, useState } from 'react'

import { Badge } from './badge'
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
	DataTableInlineEditError,
	DataTableInlineEditStatusIcon,
	useDataTableInlineEdit,
} from './data-table-inline-edit'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

export type DataTableSelectOption = {
	value: string
	label: string
	keywords?: string[]
}
export type DataTableSelectCellProps = Omit<
	DataTableInlineEditOptions<string>,
	'equals'
> & {
	options: readonly DataTableSelectOption[]
	ariaLabel: string
	label: string
	groupLabel?: string
	emptyOptionsAction?: ReactNode
	emptySearchMessage?: string
	renderValue?: (label: string, value: string) => ReactNode
}

/**
 * 表の中でその場で値を選んで保存するセル。
 *
 * `value` は使う側が持つ。`onSave` の中で保存し、終わる前に新しい値を反映する。
 * 失敗したら例外を投げると、表示を元に戻して `formatError` の文言を出す。
 * 保存中は操作できず、保存できたら印を出す。選択肢が無いときは値だけを表示する。
 * 保存の流れは `useDataTableInlineEdit` で、ほかのその場で直すセルと同じ。
 */
export function DataTableSelectCell({
	options,
	ariaLabel,
	label,
	groupLabel,
	emptyOptionsAction,
	emptySearchMessage = '一致する選択肢はありません。',
	formatError = () => '保存できませんでした。再試行してください。',
	renderValue = text => <DataTableValueChip label={text} />,
	...rest
}: DataTableSelectCellProps) {
	const edit = useDataTableInlineEdit({ ...rest, formatError })
	const committedValue = rest.value
	const disabled = edit.disabled
	const [activeOption, setActiveOption] = useState(committedValue)
	const value = edit.value
	const valueLabel =
		options.find(option => option.value === value)?.label ?? (value || '未設定')
	function save(next: string) {
		// 選択肢に無い値は保存しない。
		if (!options.some(option => option.value === next)) return edit.cancel()
		void edit.save(next)
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
				open={edit.editing}
				onOpenChange={nextOpen => {
					if (!nextOpen) return edit.cancel()
					if (edit.startEditing()) setActiveOption(committedValue)
				}}
			>
				<PopoverTrigger asChild>
					<button
						type='button'
						aria-label={ariaLabel}
						aria-busy={edit.saving}
						aria-disabled={disabled || edit.saving}
						disabled={disabled}
						className='flex min-h-[52px] w-full items-center gap-2 px-5 py-2 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-50 data-[state=open]:bg-selected data-[state=open]:ring-2 data-[state=open]:ring-inset data-[state=open]:ring-ring'
					>
						{renderValue(valueLabel, value)}
						<span className='ml-auto'>
							<DataTableInlineEditStatusIcon status={edit.status} />
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
										onSelect={() => save(option.value)}
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
			<DataTableInlineEditError error={edit.error} />
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
