import {
	DataTableEditableCell,
	DataTableInputEditor,
} from './data-table-inline-edit'
import type { DataTableInlineEditOptions } from './data-table-inline-edit'

export type DataTableNumberFormat = {
	/** 前に付ける文字（例 `¥`、`$`）。 */
	prefix?: string
	/** 後ろに付ける文字（例 `円`、`個`、`%`）。 */
	suffix?: string
	/** 小数の桁の上限。0 なら整数だけ。既定は 0。 */
	fractionDigits?: number
}

export type DataTableNumberRule = DataTableNumberFormat & {
	min?: number
	max?: number
	/** 空（値なし）を許す。 */
	allowEmpty?: boolean
}

const FULL_WIDTH = /[０-９．，－ー−＋]/g
const FULL_WIDTH_MAP: Record<string, string> = {
	'．': '.',
	'，': ',',
	'－': '-',
	ー: '-',
	'−': '-',
	'＋': '+',
}

/** 数を桁区切りで表示用の文字にする。空なら空文字。 */
export function formatDataTableNumber(
	value: number | null,
	{ prefix = '', suffix = '', fractionDigits = 0 }: DataTableNumberFormat = {},
) {
	if (value === null || Number.isNaN(value)) return ''
	const text = new Intl.NumberFormat('ja-JP', {
		maximumFractionDigits: fractionDigits,
	}).format(value)
	return `${prefix}${text}${suffix}`
}

/**
 * 入れた文字を数に直す。全角の数字、「1,200」、前後の通貨や単位の記号を受け付ける。
 * だめなら理由の文言を返す。
 */
export function parseDataTableNumber(
	text: string,
	{
		prefix,
		suffix,
		fractionDigits = 0,
		min,
		max,
		allowEmpty = false,
	}: DataTableNumberRule = {},
): { value: number | null } | { error: string } {
	let normalized = text
		.replace(FULL_WIDTH, char =>
			char >= '０' && char <= '９'
				? String.fromCharCode(char.charCodeAt(0) - 0xfee0)
				: FULL_WIDTH_MAP[char],
		)
		.replace(/[\s　]/g, '')
	for (const mark of [prefix, suffix, '¥', '￥', '$', '円'])
		if (mark) normalized = normalized.split(mark).join('')
	normalized = normalized.replace(/,/g, '')
	if (!normalized) {
		return allowEmpty ? { value: null } : { error: '数を入れてください。' }
	}
	if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized))
		return { error: '数を入れてください。' }
	const decimals = normalized.split('.')[1]?.length ?? 0
	if (decimals > fractionDigits)
		return {
			error:
				fractionDigits === 0
					? '整数で入れてください。'
					: `小数は ${fractionDigits} 桁までです。`,
		}
	const value = Number(normalized)
	if (min !== undefined && value < min)
		return {
			error: `${formatDataTableNumber(min, { prefix, suffix, fractionDigits })} 以上で入れてください。`,
		}
	if (max !== undefined && value > max)
		return {
			error: `${formatDataTableNumber(max, { prefix, suffix, fractionDigits })} 以下で入れてください。`,
		}
	return { value }
}

export type DataTableNumberCellProps = Omit<
	DataTableInlineEditOptions<number | null>,
	'equals'
> &
	DataTableNumberRule & {
		/** セルを押す所の読み上げ名（例「商品Aの単価を変更」）。 */
		ariaLabel: string
		/** 空のときの表示。 */
		emptyLabel?: string
		className?: string
	}

/**
 * 数・金額をその場で直すセル。桁区切りで右に寄せて表示し、`prefix`・`suffix` で通貨や単位を付ける。
 * 全角の数字や「1,200」も受け付け、`min`・`max`・`fractionDigits` で確かめる。
 */
export function DataTableNumberCell({
	ariaLabel,
	prefix,
	suffix,
	fractionDigits,
	min,
	max,
	allowEmpty,
	emptyLabel = '未設定',
	className,
	...options
}: DataTableNumberCellProps) {
	const rule = { prefix, suffix, fractionDigits, min, max, allowEmpty }
	return (
		<DataTableEditableCell
			{...options}
			ariaLabel={ariaLabel}
			className={className}
			align='end'
			renderValue={value =>
				value === null ? (
					<span className='text-muted-foreground'>{emptyLabel}</span>
				) : (
					formatDataTableNumber(value, rule)
				)
			}
			renderEditor={edit => (
				<DataTableInputEditor
					edit={edit}
					aria-label={ariaLabel}
					inputMode={fractionDigits ? 'decimal' : 'numeric'}
					className='text-right tabular-nums'
					initialText={edit.value === null ? '' : String(edit.value)}
					parse={text => parseDataTableNumber(text, rule)}
				/>
			)}
		/>
	)
}
