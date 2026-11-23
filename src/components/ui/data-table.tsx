import {
	type ColumnDef,
	type RowData,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { type ReactNode, useMemo } from 'react'

import { cn } from '../../lib/utils'
import {
	type DataTableDensity,
	DataTableDensityProvider,
	dataTableDensityStyles,
} from './data-table-density'
import { Button } from './button'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './table'

declare module '@tanstack/react-table' {
	interface ColumnMeta<TData extends RowData, TValue> {
		/** その列のセルに付ける class（横スクロールで左に固定する列など）。 */
		cellClassName?: string
		/** その列の見出しに付ける class。 */
		headerClassName?: string
		/** その列の中身の幅の上限（px）。入りきらない文字は 1 行で「…」と省き、触れると全部が出る。 */
		maxWidth?: number
	}
}

export type DataTableProps<T> = {
	/** 列の定義。@tanstack/react-table の `ColumnDef` をそのまま渡す。 */
	columns: ColumnDef<T>[]
	/** 今のページに表示する行。 */
	items: readonly T[]
	/** 全体の件数（ページ数の計算に使う）。 */
	total: number
	/** 今のページ（1 から数える）。 */
	page: number
	/** 1 ページの件数。 */
	pageSize: number
	/** 「前へ」「次へ」で呼ばれる。ページを URL に残すかどうかは使う側が決める。 */
	onPageChange: (page: number) => void
	/** 読み込み中。ページ送りを止め、行が無いときは読み込み中の文言を出す。 */
	busy?: boolean
	/** ページ送りを出さない（全件を 1 ページで出す表など）。 */
	hidePagination?: boolean
	/** 行が無いときの文言。 */
	emptyMessage?: string
	/** 行が無く、読み込み中のときの文言。 */
	loadingMessage?: string
	/**
	 * 密度。`compact` は行の多い表向けに詰めた形（1 行 32px、左右の余白 8px）。既定は `default`（1 行 40px）。
	 * 表の中のセルはどれもこの密度に合わせる。
	 */
	density?: DataTableDensity
	/**
	 * 行の高さ。既定の `fixed` は、どの行も密度で決まる同じ高さにする（中身は 1 行で、入りきらない分は省く）。
	 * `auto` は中身に合わせて高さを変える。
	 */
	rowHeight?: 'fixed' | 'auto'
	className?: string
}

/**
 * API でページを送る一覧の表。
 *
 * 並び替え・絞り込み・ページは使う側が持ち、この部品は今の値を受け取って表示するだけ。
 * 列ごとの見た目は `meta.cellClassName`・`meta.headerClassName` で変える。
 */
export function DataTable<T>({
	columns,
	items,
	total,
	page,
	pageSize,
	onPageChange,
	busy = false,
	hidePagination = false,
	emptyMessage = '記録はありません。',
	loadingMessage = '読み込んでいます…',
	density = 'default',
	rowHeight = 'fixed',
	className,
}: DataTableProps<T>) {
	const size = dataTableDensityStyles[density]
	const fixed = rowHeight === 'fixed'
	const data = useMemo(() => [...items], [items])
	const table = useReactTable({
		columns,
		data,
		getCoreRowModel: getCoreRowModel(),
		manualPagination: true,
		rowCount: total,
		state: { pagination: { pageIndex: page - 1, pageSize } },
	})
	const pageCount = Math.max(1, Math.ceil(total / pageSize))
	return (
		<DataTableDensityProvider value={density}>
			<div
				className={cn('min-w-0 space-y-3', className)}
				aria-busy={busy}
				data-density={density}
			>
				<div className='min-w-0 overflow-hidden rounded-lg border border-border bg-background'>
					<Table className='min-w-[720px]'>
						<TableHeader className='border-t-0 bg-muted/50'>
							{table.getHeaderGroups().map(group => (
								<TableRow key={group.id}>
									{group.headers.map(header => (
										<TableHead
											colSpan={header.colSpan}
											className={cn(
												'whitespace-nowrap',
												size.row,
												size.x,
												header.column.columnDef.meta?.headerClassName,
											)}
											key={header.id}
										>
											{header.isPlaceholder
												? null
												: flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
										</TableHead>
									))}
								</TableRow>
							))}
						</TableHeader>
						<TableBody>
							{table.getRowModel().rows.map(row => (
								<TableRow key={row.id}>
									{row.getVisibleCells().map(cell => (
										<TableCell
											className={cn(
												size.x,
												fixed && cn(size.row, 'py-0'),
												cell.column.columnDef.meta?.cellClassName,
											)}
											key={cell.id}
										>
											{fixed ? (
												<DataTableCellContent
													className={size.maxRow}
													maxWidth={cell.column.columnDef.meta?.maxWidth}
												>
													{flexRender(
														cell.column.columnDef.cell,
														cell.getContext(),
													)}
												</DataTableCellContent>
											) : (
												flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)
											)}
										</TableCell>
									))}
								</TableRow>
							))}
							{!data.length && (
								<TableRow>
									<TableCell
										className='py-10 text-center text-muted-foreground'
										colSpan={table.getVisibleLeafColumns().length}
									>
										{busy ? loadingMessage : emptyMessage}
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</div>
				{!hidePagination && (
					<nav
						aria-label='ページ送り'
						className='flex flex-wrap items-center justify-between gap-3 text-sm'
					>
						<span>
							{total.toLocaleString()}件 · {page} / {pageCount}ページ
						</span>
						<div className='flex gap-2'>
							<Button
								type='button'
								variant='secondary'
								size='sm'
								disabled={busy || page <= 1}
								onClick={() => onPageChange(page - 1)}
							>
								前へ
							</Button>
							<Button
								type='button'
								variant='secondary'
								size='sm'
								disabled={busy || page >= pageCount}
								onClick={() => onPageChange(page + 1)}
							>
								次へ
							</Button>
						</div>
					</nav>
				)}
			</div>
		</DataTableDensityProvider>
	)
}

/**
 * セルの中身を 1 行に収める（行の高さを中身で変えない）。入りきらない文字は「…」で省き、
 * 省いたときだけ、触れると全部の文字が出るようにする。
 */
function DataTableCellContent({
	className,
	maxWidth,
	children,
}: {
	className?: string
	maxWidth?: number
	children: ReactNode
}) {
	return (
		<div
			className={cn('min-w-0 truncate', className)}
			style={maxWidth ? { maxWidth } : undefined}
			onPointerEnter={event => {
				const node = event.currentTarget
				if (node.scrollWidth > node.clientWidth) {
					if (!node.title) node.title = node.textContent ?? ''
				} else if (node.title) node.removeAttribute('title')
			}}
		>
			{children}
		</div>
	)
}
