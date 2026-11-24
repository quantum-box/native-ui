import {
	DataTableEditableCell,
	DataTableInputEditor,
} from './data-table-inline-edit'
import type { DataTableInlineEditOptions } from './data-table-inline-edit'

export type DataTableTextCellProps = Omit<
	DataTableInlineEditOptions<string>,
	'equals'
> & {
	/** セルを押す所の読み上げ名（例「商品Aの品名を変更」）。 */
	ariaLabel: string
	/** 何の値か（例「品目名」）。失敗の知らせに使う。 */
	label?: string
	/** 空を許さない。 */
	required?: boolean
	/** 入れられる文字の数。 */
	maxLength?: number
	placeholder?: string
	/** 空のときの表示。 */
	emptyLabel?: string
	className?: string
}

/**
 * 1 行の文字をその場で直すセル（品目名、メモなど）。前後の空白は取る。
 * 押すか Enter で編集し、Enter で保存、Esc でやめる。Tab でほかへ移っても保存する。
 */
export function DataTableTextCell({
	ariaLabel,
	label,
	required = false,
	maxLength,
	placeholder,
	emptyLabel = '未設定',
	className,
	...options
}: DataTableTextCellProps) {
	return (
		<DataTableEditableCell
			{...options}
			ariaLabel={ariaLabel}
			className={className}
			label={label}
			formatValue={value => value}
			renderValue={value =>
				value ? (
					value
				) : (
					<span className='text-muted-foreground'>{emptyLabel}</span>
				)
			}
			renderEditor={edit => (
				<DataTableInputEditor
					edit={edit}
					aria-label={ariaLabel}
					initialText={edit.editValue}
					maxLength={maxLength}
					placeholder={placeholder}
					parse={text => {
						const value = text.trim()
						if (required && !value) return { error: '入力してください。' }
						if (maxLength !== undefined && value.length > maxLength)
							return { error: `${maxLength} 文字までです。` }
						return { value }
					}}
				/>
			)}
		/>
	)
}
