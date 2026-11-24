import { createContext, useContext } from 'react'

/** 表の密度。`compact` は行の多い表向けに詰めた形。 */
export type DataTableDensity = 'default' | 'compact'

/**
 * 密度ごとの寸法。表の中のセル（見出し・ふつうのセル・その場で直すセル・記録のセル・計算した値のセル）は
 * どれもここから寸法を取るので、表に密度を 1 つ渡すだけでそろう。
 */
export const dataTableDensityStyles = {
	default: {
		/** 行の高さ（40px）。 */
		row: 'h-10',
		/** 中身の高さの上限（行の高さを中身で変えない）。 */
		maxRow: 'max-h-10',
		/** その場で直すセルの箱の高さ（行の下の線 1px を除いた高さ）。 */
		box: 'h-[39px]',
		/** 左右の余白。 */
		x: 'px-5',
		/** 中身と印の間。 */
		gap: 'gap-2',
		/** 印（保存中・✓・!）の大きさと場所。 */
		icon: 'h-3.5 w-3.5',
		slot: 'w-4',
		/** 編集中に入力欄を重ねる場所（左右の余白と、右揃えのときの印の場所）。 */
		overlayLeft: 'left-5',
		overlayRight: 'right-5',
		overlayRightEnd: 'right-[2.75rem]',
	},
	compact: {
		row: 'h-8',
		maxRow: 'max-h-8',
		box: 'h-[31px]',
		x: 'px-2',
		gap: 'gap-1.5',
		icon: 'h-3 w-3',
		slot: 'w-3.5',
		overlayLeft: 'left-2',
		overlayRight: 'right-2',
		overlayRightEnd: 'right-7',
	},
} as const

const DensityContext = createContext<DataTableDensity>('default')

/** 表の中の密度を伝える。`DataTable` は自分で置くので、手で組んだ表に使う。 */
export const DataTableDensityProvider = DensityContext.Provider

/** 今の表の密度を読む。 */
export function useDataTableDensity() {
	return useContext(DensityContext)
}

/** 今の表の密度の寸法を読む。 */
export function useDataTableDensityStyles() {
	return dataTableDensityStyles[useContext(DensityContext)]
}
