import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import {
	Building2,
	ClipboardList,
	FileText,
	List,
	Package,
	Plus,
	Store,
	UserRound,
} from 'lucide-react'
import * as React from 'react'

import { DataTable } from './data-table'
import {
	DataTableRecordCell,
	DataTableRecordSelectCell,
	type RecordPlaceholder,
	dataTableRecordColumn,
	recordPlaceholder,
} from './data-table-record-cell'
import {
	RecordCard,
	RecordKindProvider,
	type RecordSystemDefinition,
	defineRecordKind,
	recordActions,
	useRecordKind,
} from './record'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './table'

// ---- アプリが 1 か所で決める、記録の種類ごとの決まり（例） --------------------

type Customer = {
	id: string
	name: string
	code: string
	city: string
	balance: number
}
type Product = {
	id: string
	name: string
	sku: string
	price: number
	stock: number
}
type Shop = { id: string; name: string; area: string }
type Member = { id: string; name: string; kana: string; team: string }

const yen = (value: number) => `¥${value.toLocaleString('ja-JP')}`

function Facts({ rows }: { rows: [string, string][] }) {
	return (
		<dl className='grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs'>
			{rows.map(([term, value]) => (
				<React.Fragment key={term}>
					<dt className='text-muted-foreground'>{term}</dt>
					<dd className='text-foreground'>{value}</dd>
				</React.Fragment>
			))}
		</dl>
	)
}
function PreviewTitle({ children }: { children: React.ReactNode }) {
	return <p className='mb-2 font-medium text-sm'>{children}</p>
}

const CUSTOMERS: Customer[] = [
	{
		id: 'c1',
		name: '山田商店',
		code: 'C-0001',
		city: '大阪市',
		balance: 128000,
	},
	{ id: 'c2', name: '鈴木食品', code: 'C-0002', city: '京都市', balance: 0 },
	{
		id: 'c3',
		name: 'みどり青果',
		code: 'C-0003',
		city: '神戸市',
		balance: 46200,
	},
]
const PRODUCTS: Product[] = [
	{
		id: 'p1',
		name: 'りんごジュース 1L',
		sku: 'SKU-1001',
		price: 380,
		stock: 120,
	},
	{
		id: 'p2',
		name: '冷凍ブルーベリー',
		sku: 'SKU-1002',
		price: 1280,
		stock: 8,
	},
	{ id: 'p3', name: '紙コップ 200ml', sku: 'SKU-2001', price: 540, stock: 300 },
	{ id: 'p4', name: 'ボールペン 黒', sku: 'SKU-3001', price: 120, stock: 0 },
]
const SHOPS: Shop[] = [
	{ id: 's1', name: '梅田店', area: '大阪' },
	{ id: 's2', name: '四条店', area: '京都' },
	{ id: 's3', name: '三宮店', area: '神戸' },
]
const MEMBERS: Member[] = [
	{ id: 'm1', name: '佐藤 花子', kana: 'さとう はなこ', team: '営業1課' },
	{ id: 'm2', name: '高橋 健', kana: 'たかはし けん', team: '営業2課' },
	{ id: 'm3', name: '伊藤 美咲', kana: 'いとう みさき', team: '店舗運営' },
]

/** システムごとの決まり（名前・絵・色の印）。アプリが 1 か所で決める。 */
const SYSTEMS = {
	catalog: { name: '商品管理', icon: Package, tone: 'amber' },
	crm: { name: '顧客管理', icon: Building2, tone: 'blue' },
	stores: { name: '店舗管理', icon: Store, tone: 'teal' },
	hr: { name: '人事', icon: UserRound, tone: 'violet' },
} satisfies Record<string, RecordSystemDefinition>

const KINDS = {
	customer: defineRecordKind<Customer>({
		name: '取引先',
		icon: Building2,
		getId: customer => customer.id,
		getLabel: customer => customer.name,
		getDescription: customer => customer.code,
		system: 'crm',
		getHref: customer => `/customers/${customer.id}`,
		getActions: customer => [
			recordActions.newTab(`/customers/${customer.id}`),
			{
				label: 'この取引先の請求書を見る',
				icon: FileText,
				href: `/invoices?customer=${customer.id}`,
			},
			recordActions.copy(customer.code, 'コードをコピー'),
		],
		renderPreview: customer => (
			<>
				<PreviewTitle>{customer.name}</PreviewTitle>
				<Facts
					rows={[
						['コード', customer.code],
						['所在地', customer.city],
						['売掛残高', yen(customer.balance)],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: CUSTOMERS }),
		missingText: '削除された取引先',
	}),
	product: defineRecordKind<Product>({
		name: '商品',
		icon: Package,
		getId: product => product.id,
		getLabel: product => product.name,
		getDescription: product => product.sku,
		system: 'catalog',
		getHref: product => `/products/${product.id}`,
		getActions: product => [
			recordActions.newTab(`/products/${product.id}`),
			{
				label: 'この商品の受注を見る',
				icon: ClipboardList,
				href: `/orders?product=${product.id}`,
			},
			recordActions.copy(product.sku, '品番をコピー'),
		],
		renderPreview: product => (
			<>
				<PreviewTitle>{product.name}</PreviewTitle>
				<Facts
					rows={[
						['品番', product.sku],
						['単価', yen(product.price)],
						['在庫', product.stock ? `${product.stock}個` : '在庫なし'],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: PRODUCTS }),
		missingText: '販売をやめた商品',
	}),
	shop: defineRecordKind<Shop>({
		name: '店',
		icon: Store,
		getId: shop => shop.id,
		getLabel: shop => shop.name,
		getDescription: shop => shop.area,
		system: 'stores',
		getHref: shop => `/shops/${shop.id}`,
		renderPreview: shop => (
			<>
				<PreviewTitle>{shop.name}</PreviewTitle>
				<Facts rows={[['地域', shop.area]]} />
			</>
		),
		getActions: shop => [recordActions.newTab(`/shops/${shop.id}`)],
		pickerActions: [
			{ label: '店舗管理で新しく作る', icon: Plus, href: '/shops/new' },
			{ label: '店舗管理で一覧を開く', icon: List, href: '/shops' },
		],
		useCandidates: () => ({ records: SHOPS }),
		forbiddenText: 'ほかの地域の店です',
	}),
	member: defineRecordKind<Member>({
		name: '担当者',
		icon: UserRound,
		getId: member => member.id,
		getLabel: member => member.name,
		getDescription: member => member.team,
		getKeywords: member => [member.kana],
		system: 'hr',
		getHref: member => `/staff/${member.id}`,
		openLabel: '社員名簿で開く',
		pickerActions: [
			{ label: '社員名簿で一覧を開く', icon: List, href: '/staff' },
		],
		getActions: member => [
			{
				label: 'この担当者の作業を見る',
				icon: ClipboardList,
				href: `/tasks?member=${member.id}`,
			},
			recordActions.copy(member.id),
		],
		renderAvatar: member => (
			<span className='flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-medium text-[10px] text-primary'>
				{member.name.slice(0, 1)}
			</span>
		),
		renderPreview: member => (
			<>
				<PreviewTitle>{member.name}</PreviewTitle>
				<Facts
					rows={[
						['よみ', member.kana],
						['所属', member.team],
					]}
				/>
			</>
		),
		useCandidates: () => ({ records: MEMBERS }),
		missingText: '退職した担当者',
	}),
}

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
 * この例では、記録を押したときの移動先を下に出している（実際のアプリでは画面が移る）。
 * 使い方は `docs/data-table.md`。
 */
const meta = {
	title: 'Components/DataTableRecordCell',
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

// ---- 要点の枠 -----------------------------------------------------------------

function CardFrame({ children }: { children: React.ReactNode }) {
	return (
		<div className='w-80 overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay'>
			{children}
		</div>
	)
}

/**
 * 触れたときに出る枠を、4 種類並べて開いたまま見せる。
 * 上に種類とシステム、下に「{システム}で開く」と種類ごとの操作が出る。
 * 最後の 2 つは消えた記録と見る権限が無い記録で、開けないことと理由を出す。
 */
export const Cards: Story = {
	name: '要点の枠',
	render: () => (
		<div className='flex flex-wrap items-start gap-4'>
			<CardFrame>
				<RecordCard kind='product' record={PRODUCTS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='customer' record={CUSTOMERS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='shop' record={SHOPS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='member' record={MEMBERS[0]} />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='product' status='missing' />
			</CardFrame>
			<CardFrame>
				<RecordCard kind='customer' status='forbidden' />
			</CardFrame>
		</div>
	),
}

// ---- 同じシステムと別のシステム ------------------------------------------------

/**
 * 今の画面が「商品管理」のとき。同じ商品管理の記録（商品）はふつうの枠、
 * 別のシステムの記録（取引先・担当者）は、色の帯と線のある枠で出る。
 * `RecordKindProvider` の `currentSystem` で今の画面のシステムを決める。
 */
export const SameAndOtherSystem: Story = {
	name: '同じシステムと別のシステム',
	render: () => (
		<RecordKindProvider kinds={KINDS} systems={SYSTEMS} currentSystem='catalog'>
			<p className='mb-3 text-muted-foreground text-xs'>今の画面: 商品管理</p>
			<div className='flex flex-wrap items-start gap-4'>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>同じシステム（商品）</p>
					<CardFrame>
						<RecordCard kind='product' record={PRODUCTS[1]} />
					</CardFrame>
				</div>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>
						別のシステム（取引先）
					</p>
					<CardFrame>
						<RecordCard kind='customer' record={CUSTOMERS[2]} />
					</CardFrame>
				</div>
				<div className='space-y-1'>
					<p className='text-muted-foreground text-xs'>
						別のシステム（担当者）
					</p>
					<CardFrame>
						<RecordCard kind='member' record={MEMBERS[1]} />
					</CardFrame>
				</div>
			</div>
		</RecordKindProvider>
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
