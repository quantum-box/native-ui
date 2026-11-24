'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'

/*
 * 名前と値の並び（詳細の画面の「取引先：〇〇商店」「合計：￥1,200」）。表示だけで、入力欄ではない
 * （入力欄は Field）。<dl>・<dt>・<dd> で出すので、画面を読む道具にも「名前と値の組」と伝わる。
 */

type DescriptionListLayout = 'stacked' | 'inline'

interface DescriptionListContextValue {
	layout: DescriptionListLayout
	empty: React.ReactNode
}

const DescriptionListContext = React.createContext<DescriptionListContextValue>(
	{ layout: 'stacked', empty: '—' },
)

export interface DescriptionListProps
	extends React.HTMLAttributes<HTMLDListElement> {
	/**
	 * 並べ方。
	 * - `stacked`（既定）: 名前を上、値を下に置いた組を、横に何列か並べる。
	 * - `inline`: 名前を左、値を右に置いた行を、縦に並べる。箱が狭くて値の幅（12rem）が
	 *   取れないときは、名前が上、値が下に来る（画面の幅ではなく、箱の幅で決まる）。
	 */
	layout?: DescriptionListLayout
	/**
	 * `stacked` のときの、いちばん多いときの列の数。箱が狭くなると（右の詳細の中など）、
	 * 1 列が minColumnWidth を下回らないよう列を減らし、もっと狭ければ 1 列にする。
	 * 画面の幅ではなく、箱の幅で決まる。省くと、10rem ずつ入るだけ並べる。
	 */
	columns?: number
	/** `stacked` のときの、1 列のいちばん狭い幅（CSS の長さ）。既定は 9rem */
	minColumnWidth?: string
	/** `inline` のときの、名前の列の幅（CSS の長さ）。既定は 8rem */
	labelWidth?: string
	/** 値が無いときに出す物。既定は「—」 */
	empty?: React.ReactNode
}

/**
 * 名前と値の組（DescriptionItem）を並べる箱。
 *
 * `stacked` では、同じ行の組どうしで名前の段と値の段の高さを共有する（CSS の subgrid）。
 * 名前が折り返した組と折り返さない組が並んでも、値の上端がそろう。
 */
const DescriptionList = React.forwardRef<
	HTMLDListElement,
	DescriptionListProps
>(
	(
		{
			layout = 'stacked',
			columns,
			minColumnWidth = '9rem',
			labelWidth = '8rem',
			empty = '—',
			className,
			style,
			...props
		},
		ref,
	) => {
		const context = React.useMemo(() => ({ layout, empty }), [layout, empty])
		return (
			<DescriptionListContext.Provider value={context}>
				<dl
					ref={ref}
					data-slot='description-list'
					data-layout={layout}
					className={cn(
						'grid min-w-0 text-sm',
						layout === 'stacked'
							? [
									'gap-x-4 gap-y-3',
									columns === undefined &&
										'grid-cols-[repeat(auto-fill,minmax(min(100%,10rem),1fr))]',
								]
							: 'gap-y-2',
						className,
					)}
					style={
						layout === 'inline'
							? ({
									'--description-label': labelWidth,
									...style,
								} as React.CSSProperties)
							: columns === undefined
								? style
								: {
										// 広ければ columns 列ちょうど、狭ければ minColumnWidth を下回らない数、
										// もっと狭ければ 1 列（min(100%, …)）。列の間は gap-x-4（1rem）
										gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, max(${minColumnWidth}, calc((100% - ${columns - 1} * 1rem) / ${columns}))), 1fr))`,
										...style,
									}
					}
					{...props}
				/>
			</DescriptionListContext.Provider>
		)
	},
)
DescriptionList.displayName = 'DescriptionList'

export interface DescriptionItemProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
	/** 名前。例「取引先」。 */
	label: React.ReactNode
	/**
	 * 値。文字・数のほか、Badge・リンク・AiValue・FactValue などの部品も置ける。
	 * 無いとき（null・undefined・空の文字・false）は、`empty`（既定は「—」）を出す。
	 */
	children?: React.ReactNode
	/** 値が無いときに出す物。省くと DescriptionList の `empty`。 */
	empty?: React.ReactNode
	/** 等幅の小さい文字で出す（ID・番号・キー）。 */
	mono?: boolean
	/** 数字の幅をそろえる（金額・数量）。 */
	numeric?: boolean
	/** 値を少し太くする（合計など、目立たせたい値）。 */
	emphasis?: boolean
	/**
	 * 長い値の扱い。
	 * - `words`（既定）: 言葉の切れ目で折り返し、切れ目の無い長い言葉は途中で折る。
	 * - `anywhere`: どこででも折る（ID・URL・ハッシュ）。
	 * - `pre`: 改行をそのまま出す（メモ・住所）。
	 * - `truncate`: 1 行に収め、入りきらない分は「…」にする。
	 */
	wrap?: 'words' | 'anywhere' | 'pre' | 'truncate'
	/** `stacked` で、行の端から端まで使う（長い文の値）。 */
	full?: boolean
	/** 値（dd）に足す class。 */
	valueClassName?: string
}

const WRAP = {
	words: 'break-words',
	anywhere: 'break-all',
	pre: 'whitespace-pre-wrap break-words',
	truncate: 'truncate',
} as const

function isEmpty(value: React.ReactNode) {
	return value == null || value === '' || value === false
}

/** 名前と値の 1 組。DescriptionList の中に置く。 */
const DescriptionItem = React.forwardRef<HTMLDivElement, DescriptionItemProps>(
	(
		{
			label,
			children,
			empty,
			mono,
			numeric,
			emphasis,
			wrap = 'words',
			full,
			className,
			valueClassName,
			style,
			...props
		},
		ref,
	) => {
		const list = React.useContext(DescriptionListContext)
		const missing = isEmpty(children)
		return (
			<div
				ref={ref}
				data-slot='description-item'
				data-empty={missing ? '' : undefined}
				className={cn(
					'min-w-0',
					list.layout === 'stacked'
						? // 名前の段と値の段を、同じ行の組と共有する
							'row-span-2 grid grid-rows-subgrid gap-y-0'
						: // 名前の列の幅と、値に要る幅（12rem）が箱に入らなければ、値が下へ回る。
							// 画面の幅ではなく、箱の幅で決まる
							'flex flex-wrap gap-x-4 gap-y-0.5',
					full && 'col-span-full',
					className,
				)}
				style={style}
				{...props}
			>
				<dt
					className={cn(
						'min-w-0 break-words text-muted-foreground text-xs leading-snug',
						list.layout === 'inline' &&
							'max-w-full shrink-0 basis-[var(--description-label)] pt-0.5',
					)}
				>
					{label}
				</dt>
				<dd
					className={cn(
						'min-w-0',
						list.layout === 'stacked' ? 'pt-1' : 'flex-[1_1_12rem]',
						WRAP[wrap],
						mono && 'font-mono text-xs',
						numeric && 'tabular-nums',
						emphasis && 'font-medium',
						missing && 'text-muted-foreground',
						valueClassName,
					)}
				>
					{missing ? (empty ?? list.empty) : children}
				</dd>
			</div>
		)
	},
)
DescriptionItem.displayName = 'DescriptionItem'

export { DescriptionItem, DescriptionList }
