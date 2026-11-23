import {
	DataTableEditableCell,
	DataTableInputEditor,
} from './data-table-inline-edit'
import type { DataTableInlineEditOptions } from './data-table-inline-edit'

const DATE = /^\d{4}-\d{2}-\d{2}$/

export type DataTableDateCellProps = Omit<
	DataTableInlineEditOptions<string>,
	'equals'
> & {
	/** セルを押す所の読み上げ名（例「商品Aの納期を変更」）。 */
	ariaLabel: string
	/** 選べる最初の日（`YYYY-MM-DD`）。 */
	min?: string
	/** 選べる最後の日（`YYYY-MM-DD`）。 */
	max?: string
	/** 何の値か（例「納期」）。失敗の知らせに使う。 */
	label?: string
	/** 空を許さない。 */
	required?: boolean
	/** 表示の形。既定は `2026/11/24`。 */
	formatDate?: (value: string) => string
	/** 空のときの表示。 */
	emptyLabel?: string
	className?: string
}

/**
 * 日付をその場で直すセル。値は `YYYY-MM-DD` の文字（空は `''`）。
 * 押すか Enter で編集し、Enter で保存、Esc でやめる。
 */
export function DataTableDateCell({
	ariaLabel,
	label,
	min,
	max,
	required = false,
	formatDate = value => value.replace(/-/g, '/'),
	emptyLabel = '未設定',
	className,
	...options
}: DataTableDateCellProps) {
	return (
		<DataTableEditableCell
			{...options}
			ariaLabel={ariaLabel}
			className={className}
			label={label}
			formatValue={value => (value ? formatDate(value) : '')}
			renderValue={value =>
				value ? (
					<span className='tabular-nums'>{formatDate(value)}</span>
				) : (
					<span className='text-muted-foreground'>{emptyLabel}</span>
				)
			}
			renderEditor={edit => (
				<DataTableInputEditor
					edit={edit}
					type='date'
					aria-label={ariaLabel}
					min={min}
					max={max}
					className='tabular-nums'
					initialText={edit.editValue}
					parse={text => {
						if (!text)
							return required
								? { error: '日付を入れてください。' }
								: { value: '' }
						if (!DATE.test(text)) return { error: '日付を入れてください。' }
						if (min && text < min)
							return { error: `${formatDate(min)} 以降で入れてください。` }
						if (max && text > max)
							return { error: `${formatDate(max)} までで入れてください。` }
						return { value: text }
					}}
				/>
			)}
		/>
	)
}
