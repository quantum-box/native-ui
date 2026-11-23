import { useId } from 'react'

import { cn } from '../../lib/utils'
import {
	type DataTableInlineEditOptions,
	DataTableInlineEditError,
	DataTableInlineEditStatusIcon,
	useDataTableInlineEdit,
} from './data-table-inline-edit'
import { Switch } from './switch'

export type DataTableToggleCellProps = Omit<
	DataTableInlineEditOptions<boolean>,
	'equals'
> & {
	/** スイッチの読み上げ名（例「商品Aを公開する」）。 */
	ariaLabel: string
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
	onLabel = 'オン',
	offLabel = 'オフ',
	className,
	...options
}: DataTableToggleCellProps) {
	const edit = useDataTableInlineEdit(options)
	const id = useId()
	return (
		<div className={cn('min-w-0', className)}>
			<div className='flex min-h-[52px] items-center gap-2 px-5 py-2'>
				<Switch
					id={id}
					aria-label={ariaLabel}
					aria-busy={edit.saving}
					aria-disabled={edit.saving || undefined}
					checked={edit.value}
					disabled={edit.disabled}
					onCheckedChange={checked => void edit.save(checked)}
				/>
				<label
					htmlFor={id}
					className={cn(
						'select-none whitespace-nowrap text-sm',
						edit.value ? 'text-foreground' : 'text-muted-foreground',
						edit.disabled ? 'opacity-50' : 'cursor-pointer',
					)}
				>
					{edit.value ? onLabel : offLabel}
				</label>
				<span className='ml-auto'>
					<DataTableInlineEditStatusIcon status={edit.status} />
				</span>
			</div>
			<DataTableInlineEditError error={edit.error} />
		</div>
	)
}
