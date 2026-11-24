import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import * as React from 'react'

import { DataTable } from './data-table'
import {
	DataTableRecordCell,
	DataTableRecordSelectCell,
	type RecordPlaceholder,
	dataTableRecordColumn,
	recordPlaceholder,
} from './data-table-record-cell'
import { RecordKindProvider, useRecordKind } from '../record/record'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './table'

import {
	CUSTOMERS,
	type Customer,
	KINDS,
	MEMBERS,
	type Member,
	PRODUCTS,
	type Product,
	SHOPS,
	SYSTEMS,
	type Shop,
	yen,
} from '../record/record-story-data'

/**
 * 表のセルに、別の業務の記録（取引先・商品・店・担当者など）を出す。
 *
 * 記録の種類ごとの見た目と動き（絵・名前・押すと詳細へ・触れると要点・消えた／見る権限が無いときの出し方・
 * 付け替えの候補）は、アプリが `RecordKindProvider` に 1 か所で登録する。
 * どの表に出しても同じ見た目と動きになる。native-ui は種類の名前を知らない。
 *
 * 記録に触れる（キーボードではフォーカスして ↓）と、要点の枠が開く。別のシステムの記録は、
 * システムの色の帯（例「商品管理 · 商品  別のシステムの記録 ↗」）と左の線で、別のシステムをのぞいていると分かる。
 * 下の「{システム}で開く」も同じ色。システムの名前・絵・色は `systems` に 1 か所で決める。
 * 消えた・見る権限が無い記録では、開けないことと理由を出す。
 *
 * 記録の部品そのもの（要点のカード・付け替えの候補・文の中・表の外での使い方）は「記録/Record」にある。
 * ここは表のセルでの使い方の例。
 *
 * この例では、記録を押したときの移動先を下に出している（実際のアプリでは画面が移る）。
 * 使い方は `docs/data-table.md`・`docs/record.md`。
 */
const meta = {
	title: '表/DataTableRecordCell',
	id: 'data-table-record-cell',
	parameters: { layout: 'padded' },
	decorators: [
		Story => {
			const [moved, setMoved] = React.useState<string | null>(null)
			return (
				<RecordKindProvider kinds={KINDS} systems={SYSTEMS} navigate={setMoved}>
					<Story />
					<p className='mt-3 text-muted-foreground text-xs' role='status'>
						{moved
							? `移動先: ${moved}（実際のアプリでは詳細の画面へ移る）`
							: '記録を押すと、ここに移動先が出る。触れる（またはフォーカスして ↓）と要点と操作が出る。'}
					</p>
				</RecordKindProvider>
			)
		},
	],
} satisfies Meta

export default meta
type Story = StoryObj

// ---- 例の表 -----------------------------------------------------------------

type Order = {
	id: string
	customer: Customer | null
	customerStatus?: 'loading' | 'missing' | 'forbidden'
	products: readonly (Product | RecordPlaceholder)[]
	shop: Shop | null
	shopStatus?: 'forbidden'
	members: readonly (Member | RecordPlaceholder)[]
	total: number
}

const ORDERS: Order[] = [
	{
		id: 'SO-1001',
		customer: CUSTOMERS[0],
		products: [PRODUCTS[0], PRODUCTS[1]],
		shop: SHOPS[0],
		members: [MEMBERS[0]],
		total: 12480,
	},
	{
		id: 'SO-1002',
		customer: CUSTOMERS[1],
		products: [PRODUCTS[2], PRODUCTS[0], PRODUCTS[3], PRODUCTS[1]],
		shop: SHOPS[1],
		members: [MEMBERS[1], MEMBERS[2]],
		total: 38900,
	},
	{
		id: 'SO-1003',
		customer: null,
		customerStatus: 'missing',
		products: [recordPlaceholder('missing', 'p9')],
		shop: null,
		shopStatus: 'forbidden',
		members: [recordPlaceholder('missing', 'm9')],
		total: 5400,
	},
	{
		id: 'SO-1004',
		customer: null,
		customerStatus: 'loading',
		products: [PRODUCTS[3]],
		shop: SHOPS[2],
		members: [],
		total: 1200,
	},
]

const orderColumns: ColumnDef<Order>[] = [
	{
		accessorKey: 'id',
		header: '受注番号',
		meta: { cellClassName: 'whitespace-nowrap tabular-nums' },
	},
	dataTableRecordColumn<Order, Customer>({
		id: 'customer',
		header: '取引先',
		kind: 'customer',
		get: order => order.customer,
		status: order => order.customerStatus,
	}),
	dataTableRecordColumn<Order, Product>({
		id: 'products',
		header: '商品',
		kind: 'product',
		get: order => order.products,
		meta: { maxWidth: 260 },
	}),
	dataTableRecordColumn<Order, Shop>({
		id: 'shop',
		header: '店',
		kind: 'shop',
		get: order => order.shop,
		status: order => order.shopStatus,
	}),
	dataTableRecordColumn<Order, Member>({
		id: 'members',
		header: '担当者',
		kind: 'member',
		get: order => order.members,
		emptyText: '担当者なし',
	}),
	{
		accessorKey: 'total',
		header: '金額',
		cell: ({ row }) => yen(row.original.total),
		meta: {
			headerClassName: 'text-right',
			cellClassName: 'text-right tabular-nums',
		},
	},
]

/**
 * 4 種類を登録した表。列は `dataTableRecordColumn` で作り、表ごとにセルを書いていない。
 * 3 行目は記録が消えた・見る権限が無い例、4 行目の取引先は読み込み中の例。
 */
export const Table_: Story = {
	name: '例の表',
	render: () => (
		<DataTable
			columns={orderColumns}
			items={ORDERS}
			total={ORDERS.length}
			page={1}
			pageSize={ORDERS.length}
			onPageChange={() => {}}
			hidePagination
		/>
	),
}

// ---- 種類ごとの状態 -----------------------------------------------------------

const STATE_ROWS: {
	kind: keyof typeof KINDS
	record: unknown
	many: readonly unknown[]
}[] = [
	{
		kind: 'customer',
		record: CUSTOMERS[0],
		many: [CUSTOMERS[0], CUSTOMERS[1], CUSTOMERS[2]],
	},
	{
		kind: 'product',
		record: PRODUCTS[1],
		many: [PRODUCTS[0], recordPlaceholder('missing', 'p9'), PRODUCTS[2]],
	},
	{ kind: 'shop', record: SHOPS[0], many: [SHOPS[0], SHOPS[1]] },
	{
		kind: 'member',
		record: MEMBERS[0],
		many: [MEMBERS[0], MEMBERS[1], recordPlaceholder('forbidden', 'm8')],
	},
]

/**
 * 種類ごとに、ふつう・読み込み中・消えた・見る権限が無い・読み込めない・複数 を並べる。
 * 文言は種類の決まりで変えている（商品は「販売をやめた商品」、店は「ほかの地域の店です」など）。
 */
export const States: Story = {
	name: '種類ごとの状態',
	render: () => (
		<div className='overflow-hidden rounded-lg border border-border bg-background'>
			<Table className='min-w-[1240px]'>
				<TableHeader className='border-t-0 bg-muted/50'>
					<TableRow>
						<TableHead>種類</TableHead>
						<TableHead>ふつう</TableHead>
						<TableHead>読み込み中</TableHead>
						<TableHead>消えた</TableHead>
						<TableHead>見る権限が無い</TableHead>
						<TableHead>読み込めない</TableHead>
						<TableHead>複数</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{STATE_ROWS.map(row => (
						<TableRow key={row.kind}>
							<TableCell className='whitespace-nowrap font-medium'>
								{KINDS[row.kind].name}
							</TableCell>
							<TableCell>
								<DataTableRecordCell
									kind={row.kind}
									record={row.record}
									showDescription
								/>
							</TableCell>
							<TableCell>
								<DataTableRecordCell kind={row.kind} status='loading' />
							</TableCell>
							<TableCell>
								<DataTableRecordCell kind={row.kind} status='missing' />
							</TableCell>
							<TableCell>
								<DataTableRecordCell kind={row.kind} status='forbidden' />
							</TableCell>
							<TableCell>
								<DataTableRecordCell kind={row.kind} status='unavailable' />
							</TableCell>
							<TableCell>
								<DataTableRecordCell kind={row.kind} records={row.many} />
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	),
}

// ---- 付け替える ---------------------------------------------------------------

type Task = {
	id: string
	title: string
	shop: Shop | null
	member: Member | null
}

function ReassignExample() {
	const [tasks, setTasks] = React.useState<Task[]>([
		{ id: 't1', title: '棚卸し', shop: SHOPS[0], member: MEMBERS[0] },
		{ id: 't2', title: '新商品の陳列', shop: SHOPS[1], member: null },
		{ id: 't3', title: '売上の締め', shop: SHOPS[2], member: MEMBERS[2] },
	])
	const save = React.useCallback(
		<K extends 'shop' | 'member'>(id: string, key: K) =>
			async (value: Task[K]) => {
				await new Promise(resolve => setTimeout(resolve, 500))
				if (key === 'member' && value && (value as Member).id === 'm2')
					throw new Error('高橋さんは今週休みです')
				setTasks(current =>
					current.map(task =>
						task.id === id ? { ...task, [key]: value } : task,
					),
				)
			},
		[],
	)
	// 列は作り直さない（作り直すとセルの保存中の様子が消える）。
	const columns = React.useMemo<ColumnDef<Task>[]>(
		() => [
			{ accessorKey: 'title', header: '作業' },
			{
				id: 'shop',
				header: '店',
				cell: ({ row }) => (
					<DataTableRecordSelectCell<Shop>
						kind='shop'
						ariaLabel={`${row.original.title}の店を変更`}
						record={row.original.shop}
						onSave={save(row.original.id, 'shop')}
					/>
				),
				meta: { headerClassName: 'w-56', cellClassName: 'p-0' },
			},
			{
				id: 'member',
				header: '担当者',
				cell: ({ row }) => (
					<DataTableRecordSelectCell<Member>
						kind='member'
						ariaLabel={`${row.original.title}の担当者を変更`}
						record={row.original.member}
						allowEmpty
						onSave={save(row.original.id, 'member')}
						formatError={error =>
							error instanceof Error ? error.message : '保存できませんでした。'
						}
					/>
				),
				meta: { headerClassName: 'w-64', cellClassName: 'p-0' },
			},
		],
		[save],
	)
	const [current, setCurrent] = React.useState<'tasks' | 'stores'>('tasks')
	// 外側（この例の枠）の移動の方法をそのまま使う。
	const { navigate } = useRecordKind('shop')
	return (
		<div className='space-y-3'>
			<div
				role='radiogroup'
				aria-label='今の画面'
				className='flex items-center gap-2 text-xs'
			>
				<span className='text-muted-foreground'>今の画面:</span>
				{(
					[
						['tasks', '作業の管理（店も担当者も別のシステム）'],
						['stores', '店舗管理（店は同じシステム）'],
					] as const
				).map(([value, text]) => (
					<button
						key={value}
						type='button'
						role='radio'
						aria-checked={current === value}
						onClick={() => setCurrent(value)}
						className='rounded-md border border-border px-2 py-1 aria-checked:border-primary aria-checked:bg-selected'
					>
						{text}
					</button>
				))}
			</div>
			<RecordKindProvider
				kinds={KINDS}
				systems={SYSTEMS}
				currentSystem={current}
				navigate={navigate}
			>
				<DataTable
					columns={columns}
					items={tasks}
					total={tasks.length}
					page={1}
					pageSize={tasks.length}
					onPageChange={() => {}}
					hidePagination
				/>
			</RecordKindProvider>
		</div>
	)
}

/**
 * その場で別の記録に付け替える。流れは `DataTableSelectCell` と同じで、候補と見た目は種類の決まりから出す。
 * 別のシステムの記録から選ぶときは、候補の枠にも要点の枠と同じ色の帯（例「店舗管理 · 店から選ぶ」）と線が付き、
 * 検索欄は「店舗管理の店を検索…」、候補の絵もシステムの色になる。下には「店舗管理で新しく作る」などの道筋が出る。
 * 上の「今の画面」を店舗管理にすると、店の候補の枠はふつうの枠になる。
 * 担当者は読み仮名でも探せる（例「たかはし」）。高橋さんを選ぶと保存に失敗し、元に戻る。担当者は「未設定」に戻せる。
 */
export const Reassign: Story = {
	name: '付け替える',
	render: () => <ReassignExample />,
}
