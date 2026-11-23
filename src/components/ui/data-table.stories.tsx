import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import * as React from 'react'

import { DataTable } from './data-table'
import {
	DataTableColumnHeader,
	type DataTableColumnHeaderProps,
} from './data-table-column-header'
import {
	DataTableSelectCell,
	DataTableValueChip,
} from './data-table-select-cell'
import { DataTableViewNotice } from './data-table-view-notice'

/**
 * API でページを送る一覧の表。並び替え・絞り込み・ページは使う側が持ち、
 * 表は今の値を受け取って表示し、変わったら関数で知らせる。
 * 使い方の説明は `docs/data-table.md`。
 */
const meta = {
	title: 'Components/DataTable',
	parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

type Product = {
	id: string
	name: string
	category: string
	price: number
	stock: number
	visibility: string
	updatedAt: string
}

const CATEGORIES = ['飲料', '食品', '日用品', '文具']
const VISIBILITY = [
	{ value: 'draft', label: '下書き' },
	{ value: 'published', label: '公開中' },
	{ value: 'archived', label: '公開終了' },
]
const PRODUCTS: Product[] = Array.from({ length: 57 }, (_, index) => ({
	id: `P-${String(10001 + index).slice(1)}`,
	name: `商品 ${index + 1}`,
	category: CATEGORIES[index % CATEGORIES.length],
	price: ((index * 37) % 50) * 120 + 100,
	stock: (index * 13) % 80,
	visibility: VISIBILITY[index % VISIBILITY.length].value,
	updatedAt: `2026-11-${String(101 + (index % 28)).slice(1)}`,
}))
const PAGE_SIZE = 10
const yen = (value: number) => `¥${value.toLocaleString('ja-JP')}`

const basicColumns: ColumnDef<Product>[] = [
	{ accessorKey: 'id', header: '商品コード' },
	{ accessorKey: 'name', header: '商品名' },
	{ accessorKey: 'category', header: '分類' },
	{
		accessorKey: 'price',
		header: '価格',
		cell: ({ row }) => yen(row.original.price),
		meta: {
			headerClassName: 'text-right',
			cellClassName: 'text-right tabular-nums',
		},
	},
	{
		accessorKey: 'updatedAt',
		header: '更新日',
		meta: { cellClassName: 'text-muted-foreground tabular-nums' },
	},
]

function PaginationExample() {
	const [page, setPage] = React.useState(1)
	const items = PRODUCTS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
	return (
		<DataTable
			columns={basicColumns}
			items={items}
			total={PRODUCTS.length}
			page={page}
			pageSize={PAGE_SIZE}
			onPageChange={setPage}
		/>
	)
}

/** 「前へ」「次へ」でページを送る。件数とページ数は `total` と `pageSize` から出す。 */
export const Pagination: Story = { render: () => <PaginationExample /> }

/** 行が無いときは `emptyMessage` を出す。 */
export const Empty: Story = {
	render: () => (
		<DataTable
			columns={basicColumns}
			items={[]}
			total={0}
			page={1}
			pageSize={PAGE_SIZE}
			onPageChange={() => {}}
			emptyMessage='条件に合う商品はありません。'
		/>
	),
}

/** 読み込み中はページ送りを止め、行が無ければ読み込み中の文言を出す。 */
export const Loading: Story = {
	render: () => (
		<DataTable
			columns={basicColumns}
			items={[]}
			total={0}
			page={1}
			pageSize={PAGE_SIZE}
			onPageChange={() => {}}
			busy
		/>
	),
}

type SortKey = 'name' | 'price'
type SortState = { key: SortKey; direction: 'asc' | 'desc' } | null

function SortAndFilterExample() {
	// 実際のアプリでは、この値を URL に残して API に渡す（全件に対して並べ替え・絞り込む）。
	const [page, setPage] = React.useState(1)
	const [sort, setSort] = React.useState<SortState>(null)
	const [filters, setFilters] = React.useState<Record<string, string>>({})

	const visible = React.useMemo(() => {
		const name = filters.name ?? ''
		const category = filters.category ?? ''
		const min = Number(filters.minPrice || 0)
		const rows = PRODUCTS.filter(
			product =>
				product.name.includes(name) &&
				(!category || product.category === category) &&
				product.price >= min,
		)
		if (!sort) return rows
		return [...rows].sort((a, b) => {
			const order = a[sort.key] < b[sort.key] ? -1 : 1
			return sort.direction === 'asc' ? order : -order
		})
	}, [filters, sort])

	function updateFilters(keys: string[], values: Record<string, string>) {
		setFilters(current => {
			const next = { ...current }
			for (const key of keys) next[key] = values[key] ?? ''
			return next
		})
		setPage(1)
	}
	function sortProps(key: SortKey): DataTableColumnHeaderProps['sort'] {
		return {
			direction: sort?.key === key ? sort.direction : null,
			onChange: direction => {
				setSort(direction ? { key, direction } : null)
				setPage(1)
			},
		}
	}
	function filterProps(
		fields: NonNullable<DataTableColumnHeaderProps['filter']>['fields'],
		validate?: (values: Readonly<Record<string, string>>) => string | null,
	): DataTableColumnHeaderProps['filter'] {
		const keys = fields.map(field => field.key)
		return {
			active: keys.some(key => !!filters[key]),
			fields,
			values: filters,
			validate,
			onApply: values => updateFilters(keys, values),
			onClear: () => updateFilters(keys, {}),
		}
	}

	const columns: ColumnDef<Product>[] = [
		{ accessorKey: 'id', header: '商品コード' },
		{
			accessorKey: 'name',
			header: () => (
				<DataTableColumnHeader
					label='商品名'
					sort={sortProps('name')}
					filter={filterProps([{ key: 'name', label: '商品名に含む文字' }])}
				/>
			),
			meta: { headerClassName: 'p-0' },
		},
		{
			accessorKey: 'category',
			header: () => (
				<DataTableColumnHeader
					label='分類'
					filter={filterProps([
						{
							key: 'category',
							label: '分類',
							type: 'select',
							options: CATEGORIES.map(value => ({ value, label: value })),
						},
					])}
				/>
			),
			meta: { headerClassName: 'p-0' },
		},
		{
			accessorKey: 'price',
			header: () => (
				<DataTableColumnHeader
					label='価格'
					sort={sortProps('price')}
					filter={filterProps(
						[
							{
								key: 'minPrice',
								label: 'この金額以上',
								type: 'number',
								min: 0,
								hint: '円で入れます',
							},
						],
						values =>
							Number(values.minPrice) > 10000
								? '10,000 円以下で入れてください'
								: null,
					)}
				/>
			),
			cell: ({ row }) => yen(row.original.price),
			meta: {
				headerClassName: 'p-0',
				cellClassName: 'text-right tabular-nums',
			},
		},
	]

	return (
		<div>
			<DataTableViewNotice
				active={!!sort || Object.keys(filters).some(key => !!filters[key])}
				onClear={() => {
					setSort(null)
					setFilters({})
					setPage(1)
				}}
			/>
			<DataTable
				columns={columns}
				items={visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}
				total={visible.length}
				page={page}
				pageSize={PAGE_SIZE}
				onPageChange={setPage}
				emptyMessage='条件に合う商品はありません。'
			/>
		</div>
	)
}

/**
 * 列の見出しを押すと、並び替え・絞り込みのメニューが開く。
 * 上の案内は、どれかが効いているときに「すべて解除」を出す。
 */
export const SortAndFilter: Story = { render: () => <SortAndFilterExample /> }

function InlineSelectExample() {
	const [rows, setRows] = React.useState(PRODUCTS.slice(0, 6))
	const failNext = React.useRef(true)
	// 列は作り直さない。作り直すとセルが作り直され、保存中の状態や失敗の文言が消える。
	const columns = React.useMemo<ColumnDef<Product>[]>(
		() => [
			{ accessorKey: 'name', header: '商品名' },
			{
				accessorKey: 'visibility',
				header: '公開状態',
				cell: ({ row }) => (
					<DataTableSelectCell
						key={row.original.id}
						label='公開状態'
						ariaLabel={`${row.original.name}の公開状態を変更`}
						value={row.original.visibility}
						options={VISIBILITY}
						disabled={row.index === 5}
						onSave={async visibility => {
							await new Promise(resolve => setTimeout(resolve, 600))
							if (failNext.current) {
								failNext.current = false
								throw new Error('保存できませんでした')
							}
							setRows(current =>
								current.map(item =>
									item.id === row.original.id ? { ...item, visibility } : item,
								),
							)
						}}
						formatError={() =>
							'公開状態を保存できませんでした。もう一度選んでください。'
						}
					/>
				),
				meta: { cellClassName: 'p-0 w-56' },
			},
			{
				accessorKey: 'category',
				header: '分類',
				cell: ({ row }) => <DataTableValueChip label={row.original.category} />,
			},
		],
		[],
	)
	return (
		<DataTable
			columns={columns}
			items={rows}
			total={rows.length}
			page={1}
			pageSize={rows.length}
			onPageChange={() => {}}
			hidePagination
		/>
	)
}

/**
 * 表の中でその場で値を選んで保存する。保存中は操作できず、終わると印が出る。
 * この例では最初の保存がわざと失敗し、元の値に戻って文言が出る。6 行目は操作できない。
 */
export const InlineSelect: Story = { render: () => <InlineSelectExample /> }

const MONTHS = Array.from({ length: 12 }, (_, index) => `${index + 1}月`)
const STICKY =
	'sticky left-0 z-10 bg-background after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border'

function StickyColumnExample() {
	const [pinned, setPinned] = React.useState(true)
	const columns: ColumnDef<Product>[] = [
		{
			accessorKey: 'name',
			header: () => (
				<DataTableColumnHeader
					label='商品名'
					pin={{ pinned, onChange: setPinned }}
				/>
			),
			meta: {
				headerClassName: pinned
					? `p-0 ${STICKY} bg-gradient-to-r from-muted/50 to-muted/50`
					: 'p-0',
				cellClassName: pinned ? `font-medium ${STICKY}` : 'font-medium',
			},
		},
		...MONTHS.map(
			(month, index): ColumnDef<Product> => ({
				id: month,
				header: month,
				cell: ({ row }) =>
					yen(((row.original.price * (index + 3)) % 9000) + 500),
				meta: { cellClassName: 'text-right tabular-nums whitespace-nowrap' },
			}),
		),
	]
	return (
		<div className='max-w-[720px]'>
			<DataTable
				columns={columns}
				items={PRODUCTS.slice(0, 8)}
				total={8}
				page={1}
				pageSize={8}
				onPageChange={() => {}}
				hidePagination
			/>
		</div>
	)
}

/**
 * 横に長い表で、左の列を固定する。見出しとセルの両方に同じ固定の class を
 * `meta.headerClassName`・`meta.cellClassName` で付け、背景を塗って下の列を隠す。
 * 見出しのメニューの「固定を解除」で外せる。
 */
export const StickyColumn: Story = { render: () => <StickyColumnExample /> }
