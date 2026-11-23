import {
	type ColumnDef,
	type RowData,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { useMemo } from 'react'

import { cn } from '../../lib/utils'
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
	className,
}: DataTableProps<T>) {
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
		<div className={cn('min-w-0 space-y-3', className)} aria-busy={busy}>
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
										className={cell.column.columnDef.meta?.cellClassName}
										key={cell.id}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
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
	)
}
