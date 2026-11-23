import { Check } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useState } from 'react'

import { cn } from '../../lib/utils'

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
	DataTableInlineEditShell,
	DataTableInlineEditTrigger,
	dataTableInlineEditCellClassName,
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
	/** 検索欄の文言。既定は「{label}を検索…」。 */
	searchPlaceholder?: string
	/** 候補の枠の上に出す物（どこから選ぶかの帯など）。 */
	pickerHeader?: ReactNode
	/** 候補の枠の下に出す物（元の画面へ移る道筋など）。 */
	pickerFooter?: ReactNode
	/** 候補の枠の見た目を足す。 */
	pickerClassName?: string
	pickerStyle?: CSSProperties
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
	searchPlaceholder,
	pickerHeader,
	pickerFooter,
	pickerClassName,
	pickerStyle,
	formatError = () => '保存できませんでした。再試行してください。',
	renderValue = text => <DataTableValueChip label={text} />,
	...rest
}: DataTableSelectCellProps) {
	const edit = useDataTableInlineEdit({ ...rest, formatError })
	const committedValue = rest.value
	const disabled = edit.disabled
	const [activeOption, setActiveOption] = useState(committedValue)
	// 開いたときは、今の値（「直す」で戻ったときは失敗した値）を選んだ状態にする。
	const editValue = edit.editValue
	useEffect(() => {
		if (edit.editing) setActiveOption(editValue)
	}, [edit.editing, editValue])
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
			<div
				className={cn(dataTableInlineEditCellClassName, 'whitespace-nowrap')}
			>
				{renderValue(valueLabel, value)}
				{!disabled ? emptyOptionsAction : null}
			</div>
		)

	return (
		<DataTableInlineEditShell
			edit={edit}
			label={label}
			formatValue={item =>
				options.find(option => option.value === item)?.label ?? item
			}
		>
			<Popover
				open={edit.editing}
				onOpenChange={nextOpen => {
					if (!nextOpen) return edit.cancel()
					edit.startEditing()
				}}
			>
				<PopoverTrigger asChild>
					<DataTableInlineEditTrigger
						aria-label={ariaLabel}
						status={edit.status}
						error={edit.error}
						saving={edit.saving}
						disabled={disabled}
					>
						{renderValue(valueLabel, value)}
					</DataTableInlineEditTrigger>
				</PopoverTrigger>
				<PopoverContent
					align='start'
					sideOffset={0}
					className={cn(
						'w-64 max-w-[calc(100vw-24px)] overflow-hidden p-0',
						pickerClassName,
					)}
					style={pickerStyle}
					aria-label={`${label}を選択`}
				>
					{pickerHeader}
					<Command value={activeOption} onValueChange={setActiveOption}>
						<CommandInput
							aria-label={`${label}を検索`}
							placeholder={searchPlaceholder ?? `${label}を検索…`}
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
					{pickerFooter}
				</PopoverContent>
			</Popover>
		</DataTableInlineEditShell>
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
