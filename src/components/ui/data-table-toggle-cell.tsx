import { useId } from 'react'

import { cn } from '../../lib/utils'
import {
	type DataTableInlineEditOptions,
	type DataTableInlineEdit,
	DataTableInlineEditShell,
	DataTableInlineEditStatusIcon,
	dataTableInlineEditCellClassName,
	dataTableInlineEditErrorClassName,
	useDataTableInlineEditErrorId,
	useDataTableInlineEdit,
} from './data-table-inline-edit'
import { useDataTableDensity } from './data-table-density'
import { Switch } from './switch'

export type DataTableToggleCellProps = Omit<
	DataTableInlineEditOptions<boolean>,
	'equals'
> & {
	/** スイッチの読み上げ名（例「商品Aを公開する」）。 */
	ariaLabel: string
	/** 何の値か（例「公開」）。失敗の知らせに使う。 */
	label?: string
	/** オンのときの表示。 */
	onLabel?: string
	/** オフのときの表示。 */
	offLabel?: string
	className?: string
}

/**
 * オン・オフをその場で切り替えるセル（公開、使う／使わないなど）。
 * 押すか Space で切り替えるとすぐ保存する。保存中は切り替えられない。
 */
export function DataTableToggleCell({
	ariaLabel,
	label,
	onLabel = 'オン',
	offLabel = 'オフ',
	className,
	...options
}: DataTableToggleCellProps) {
	const edit = useDataTableInlineEdit(options)
	return (
		<DataTableInlineEditShell
			edit={edit}
			className={className}
			canResume={false}
			formatValue={value => (value ? onLabel : offLabel)}
			describeFailure={attempted =>
				label
					? `${label}を「${attempted}」に切り替えられませんでした`
					: `「${attempted}」に切り替えられませんでした`
			}
		>
			<ToggleBody
				edit={edit}
				ariaLabel={ariaLabel}
				onLabel={onLabel}
				offLabel={offLabel}
			/>
		</DataTableInlineEditShell>
	)
}

function ToggleBody({
	edit,
	ariaLabel,
	onLabel,
	offLabel,
}: {
	edit: DataTableInlineEdit<boolean>
	ariaLabel: string
	onLabel: string
	offLabel: string
}) {
	const id = useId()
	const errorId = useDataTableInlineEditErrorId()
	const density = useDataTableDensity()
	return (
		<div
			className={cn(
				dataTableInlineEditCellClassName(density),
				edit.error && dataTableInlineEditErrorClassName,
			)}
		>
			<span className='flex min-w-0 flex-1 items-center gap-2'>
				<Switch
					id={id}
					aria-label={ariaLabel}
					aria-busy={edit.saving}
					aria-disabled={edit.saving || undefined}
					aria-describedby={errorId}
					checked={edit.value}
					disabled={edit.disabled}
					onCheckedChange={checked => void edit.save(checked)}
				/>
				<label
					htmlFor={id}
					className={cn(
						'grid select-none whitespace-nowrap text-sm',
						edit.value ? 'text-foreground' : 'text-muted-foreground',
						edit.disabled ? 'opacity-50' : 'cursor-pointer',
					)}
				>
					{/* オンとオフの文言を同じ場所に重ね、長い方の幅を取っておく（切り替えても列の幅が動かない）。 */}
					<span
						className={cn(
							'col-start-1 row-start-1',
							!edit.value && 'invisible',
						)}
					>
						{onLabel}
					</span>
					<span
						className={cn('col-start-1 row-start-1', edit.value && 'invisible')}
					>
						{offLabel}
					</span>
				</label>
			</span>
			<DataTableInlineEditStatusIcon status={edit.status} error={edit.error} />
		</div>
	)
}
