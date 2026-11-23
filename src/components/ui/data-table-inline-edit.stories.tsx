import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ColumnDef } from '@tanstack/react-table'
import * as React from 'react'

import { DataTable } from './data-table'
import { DataTableDateCell } from './data-table-date-cell'
import {
	DataTableEditingCell,
	type DataTableInlineEdit,
	DataTableInlineEditFailureSummary,
	DataTableInlineEditFailuresProvider,
	DataTableInlineEditTrigger,
	DataTableInputEditor,
} from './data-table-inline-edit'
import { DataTableMultiSelectCell } from './data-table-multi-select-cell'
import {
	DataTableNumberCell,
	formatDataTableNumber,
} from './data-table-number-cell'
import {
	DataTableSelectCell,
	DataTableValueChip,
} from './data-table-select-cell'
import { DataTableTextCell } from './data-table-text-cell'
import { DataTableToggleCell } from './data-table-toggle-cell'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './table'

/**
 * 表の中で値をその場で直すセル。どれも「表示 → 編集 → 保存中 → 保存できた／失敗」の
 * 同じ流れ（`useDataTableInlineEdit`）の上に作ってある。
 *
 * - 押すか Enter で編集を始め、Enter で保存、Esc でやめる。Tab でほかへ移っても保存する。
 * - 保存中は操作できず、保存できたら印が出る。失敗したら元の値に戻して理由を出す。
 * - `onSave` は Promise を返す。`validate`・`formatError`・`disabled` を渡せる。
 *
 * 使い方は `docs/data-table.md`。
 */
const meta = {
	title: 'Components/DataTableInlineEdit',
	parameters: { layout: 'padded' },
} satisfies Meta

export default meta
type Story = StoryObj

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const never = () => new Promise<void>(() => {})
const fail = async () => {
	throw new Error('保存できませんでした')
}

const STATUS = [
	{ value: 'draft', label: '下書き' },
	{ value: 'ordered', label: '発注済み' },
	{ value: 'received', label: '入荷済み' },
]
const TAGS = [
	{ value: 'new', label: '新商品' },
	{ value: 'sale', label: 'セール' },
	{ value: 'limited', label: '限定' },
	{ value: 'cold', label: '要冷蔵' },
]

// ---- 状態の一覧 -------------------------------------------------------------

/** 使う側が値を持ち、保存できたら新しい値にする形を真似る。 */
function Owned<T>({
	initial,
	save,
	children,
}: {
	initial: T
	save: (value: T) => Promise<void>
	children: (value: T, onSave: (value: T) => Promise<void>) => React.ReactNode
}) {
	const [value, setValue] = React.useState(initial)
	const onSave = React.useCallback(
		async (next: T) => {
			await save(next)
			setValue(next)
		},
		[save],
	)
	return <>{children(value, onSave)}</>
}

let queue = Promise.resolve()
/** 表示されたら、中のセルを操作して状態を作る（順に 1 つずつ）。 */
function Scripted({
	run,
	children,
}: {
	run: (cell: HTMLElement) => Promise<void>
	children: React.ReactNode
}) {
	const ref = React.useRef<HTMLDivElement>(null)
	React.useEffect(() => {
		const cell = ref.current
		if (!cell) return
		queue = queue.then(() => run(cell)).catch(() => {})
	}, [run])
	return <div ref={ref}>{children}</div>
}

async function typeAndEnter(cell: HTMLElement, text: string) {
	cell.querySelector('button')?.click()
	await wait(30)
	const input = cell.querySelector('input')
	if (!input) return
	Object.getOwnPropertyDescriptor(
		HTMLInputElement.prototype,
		'value',
	)?.set?.call(input, text)
	input.dispatchEvent(new Event('input', { bubbles: true }))
	input.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
	)
	await wait(30)
}
async function pick(cell: HTMLElement, labels: string[], confirm: boolean) {
	const trigger = cell.querySelector('button')
	trigger?.click()
	await wait(120)
	// このセルの候補だけを操作する。
	const popover = document.getElementById(
		trigger?.getAttribute('aria-controls') ?? '',
	)
	if (!popover) return
	for (const label of labels)
		Array.from(popover.querySelectorAll<HTMLElement>('[role=option]'))
			.find(node => node.textContent?.includes(label))
			?.click()
	await wait(30)
	if (confirm)
		Array.from(popover.querySelectorAll('button'))
			.find(node => node.textContent === '保存')
			?.click()
	await wait(200)
}
async function flip(cell: HTMLElement) {
	cell.querySelector<HTMLElement>('[role=switch]')?.click()
	await wait(30)
}

/** 編集中の見た目だけを出すための、保存しない編集の状態。 */
function previewEdit<T>(value: T): DataTableInlineEdit<T> {
	return {
		value,
		editValue: value,
		editing: true,
		status: 'idle',
		error: null,
		failure: null,
		retry: async () => true,
		resume: () => true,
		saving: false,
		disabled: false,
		startEditing: () => true,
		cancel: () => {},
		reject: () => {},
		save: async () => true,
	}
}
/** 編集中のセル（入力欄）。実際のセルと同じ部品で、フォーカスだけは動かさない。 */
function EditingPreview({
	text,
	align,
	type,
}: {
	text: string
	align?: 'end'
	type?: string
}) {
	return (
		<DataTableEditingCell align={align}>
			<DataTableInputEditor
				edit={previewEdit(text)}
				autoFocus={false}
				type={type}
				aria-label='編集中の例'
				className={align === 'end' ? 'text-right tabular-nums' : undefined}
				initialText={text}
				parse={value => ({ value })}
			/>
		</DataTableEditingCell>
	)
}

/** 候補が開いているときのセル。セルの中は枠なしで、外周に線（候補はポップオーバーで出る）。 */
function OpenPreview({ children }: { children: React.ReactNode }) {
	return (
		<DataTableInlineEditTrigger status='idle' data-state='open' tabIndex={-1}>
			{children}
		</DataTableInlineEditTrigger>
	)
}

type Kind = {
	name: string
	render: (
		props: {
			onSave: (value: never) => Promise<void>
			disabled?: boolean
		},
		key: string,
	) => React.ReactNode
	editing: React.ReactNode
	change: (cell: HTMLElement) => Promise<void>
}

const KINDS: Kind[] = [
	{
		name: '文字',
		render: ({ onSave, disabled }, key) => (
			<Owned key={key} initial='りんご' save={onSave as never}>
				{(value, save) => (
					<DataTableTextCell
						ariaLabel={`品目名を変更（${key}）`}
						label='品目名'
						value={value as string}
						onSave={save as (value: string) => Promise<void>}
						disabled={disabled}
						formatError={() => '品目名を保存できませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: <EditingPreview text='りんご' />,
		change: cell => typeAndEnter(cell, 'みかん'),
	},
	{
		name: '数・金額',
		render: ({ onSave, disabled }, key) => (
			<Owned key={key} initial={1200} save={onSave as never}>
				{(value, save) => (
					<DataTableNumberCell
						ariaLabel={`単価を変更（${key}）`}
						label='単価'
						prefix='¥'
						value={value as number}
						onSave={save as (value: number | null) => Promise<void>}
						disabled={disabled}
						formatError={() => '単価を保存できませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: <EditingPreview text='¥1,200' align='end' />,
		change: cell => typeAndEnter(cell, '１，５８０'),
	},
	{
		name: '日付',
		render: ({ onSave, disabled }, key) => (
			<Owned key={key} initial='2026-11-24' save={onSave as never}>
				{(value, save) => (
					<DataTableDateCell
						ariaLabel={`納期を変更（${key}）`}
						label='納期'
						value={value as string}
						onSave={save as (value: string) => Promise<void>}
						disabled={disabled}
						formatError={() => '納期を保存できませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: <EditingPreview text='2026-11-24' type='date' />,
		change: cell => typeAndEnter(cell, '2026-12-01'),
	},
	{
		name: 'オン・オフ',
		render: ({ onSave, disabled }, key) => (
			<Owned key={key} initial={false} save={onSave as never}>
				{(value, save) => (
					<DataTableToggleCell
						ariaLabel={`公開する（${key}）`}
						label='公開'
						onLabel='公開'
						offLabel='非公開'
						value={value as boolean}
						onSave={save as (value: boolean) => Promise<void>}
						disabled={disabled}
						formatError={() => '公開を切り替えられませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: (
			<p className='flex min-h-[52px] items-center px-5 text-muted-foreground text-xs'>
				編集の段階は無い（切り替えるとすぐ保存）
			</p>
		),
		change: flip,
	},
	{
		name: '選ぶ',
		render: ({ onSave, disabled }, key) => (
			<Owned key={key} initial='draft' save={onSave as never}>
				{(value, save) => (
					<DataTableSelectCell
						ariaLabel={`状態を変更（${key}）`}
						label='状態'
						options={STATUS}
						value={value as string}
						onSave={save as (value: string) => Promise<void>}
						disabled={disabled}
						formatError={() => '状態を保存できませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: (
			<OpenPreview>
				<DataTableValueChip label='下書き' />
			</OpenPreview>
		),
		change: cell => pick(cell, ['発注済み'], false),
	},
	{
		name: '複数を選ぶ',
		render: ({ onSave, disabled }, key) => (
			<Owned
				key={key}
				initial={['sale'] as readonly string[]}
				save={onSave as never}
			>
				{(value, save) => (
					<DataTableMultiSelectCell
						ariaLabel={`タグを変更（${key}）`}
						label='タグ'
						options={TAGS}
						value={value as readonly string[]}
						onSave={save as (value: readonly string[]) => Promise<void>}
						disabled={disabled}
						formatError={() => 'タグを保存できませんでした。'}
					/>
				)}
			</Owned>
		),
		editing: (
			<OpenPreview>
				<DataTableValueChip label='セール' />
			</OpenPreview>
		),
		change: cell => pick(cell, ['新商品'], true),
	},
]

const COLUMNS = ['表示', '編集中', '保存中', '保存できた', '失敗', '使えない']

function StatesExample() {
	return (
		<div className='overflow-hidden rounded-lg border border-border bg-background'>
			<Table className='min-w-[1100px] table-fixed'>
				<TableHeader className='border-t-0 bg-muted/50'>
					<TableRow>
						<TableHead className='w-28'>種類</TableHead>
						{COLUMNS.map(column => (
							<TableHead key={column}>{column}</TableHead>
						))}
					</TableRow>
				</TableHeader>
				<TableBody>
					{KINDS.map(kind => (
						<TableRow key={kind.name}>
							<TableCell className='font-medium'>{kind.name}</TableCell>
							<TableCell className='p-0'>
								{kind.render({ onSave: async () => {} }, '表示')}
							</TableCell>
							<TableCell className='p-0'>{kind.editing}</TableCell>
							<TableCell className='p-0'>
								<Scripted run={kind.change}>
									{kind.render({ onSave: never }, '保存中')}
								</Scripted>
							</TableCell>
							<TableCell className='p-0'>
								<Scripted run={kind.change}>
									{kind.render({ onSave: async () => {} }, '保存できた')}
								</Scripted>
							</TableCell>
							<TableCell className='p-0 align-top'>
								<Scripted run={kind.change}>
									{kind.render({ onSave: fail }, '失敗')}
								</Scripted>
							</TableCell>
							<TableCell className='p-0'>
								{kind.render(
									{ onSave: async () => {}, disabled: true },
									'使えない',
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}

/**
 * 種類ごとの状態を並べる。保存中・保存できた・失敗の列は、表示された後に
 * 実際にセルを操作して作っている（保存中の列は保存が終わらない）。
 */
export const States: Story = { render: () => <StatesExample /> }

// ---- 1 つの表で直す ---------------------------------------------------------

type Line = {
	id: string
	name: string
	price: number | null
	quantity: number | null
	dueDate: string
	status: string
	tags: readonly string[]
	active: boolean
}

const LINES: Line[] = [
	{
		id: 'L-1',
		name: 'りんごジュース 1L',
		price: 380,
		quantity: 24,
		dueDate: '2026-12-01',
		status: 'ordered',
		tags: ['new'],
		active: true,
	},
	{
		id: 'L-2',
		name: '冷凍ブルーベリー',
		price: 1280,
		quantity: 6,
		dueDate: '2026-12-03',
		status: 'draft',
		tags: ['cold', 'limited'],
		active: true,
	},
	{
		id: 'L-3',
		name: '紙コップ 200ml',
		price: 540,
		quantity: null,
		dueDate: '',
		status: 'draft',
		tags: [],
		active: false,
	},
	{
		id: 'L-4',
		name: 'ボールペン 黒',
		price: 120,
		quantity: 100,
		dueDate: '2026-11-28',
		status: 'received',
		tags: ['sale'],
		active: true,
	},
]

/** 失敗の理由を、保存の失敗から読む。 */
const reason = (cause: unknown) =>
	cause instanceof Error ? cause.message : '保存できませんでした。'

const FAILURE_REASONS: Partial<Record<keyof Line, string>> = {
	name: '見る権限が無いので、品目名は変えられません。',
	price:
		'ほかの人が先に単価を変えました。最新の値を読み込んでから直してください。',
	active: '通信が切れました。もう一度試してください。',
	status: '入荷済みの行は、状態を戻せません。',
}

function EditableTableExample({ failing = false }: { failing?: boolean }) {
	const [lines, setLines] = React.useState(LINES)
	const update = React.useCallback(
		<K extends keyof Line>(id: string, key: K) =>
			async (value: Line[K]) => {
				await wait(500)
				// 例: 失敗する表では、保存がいつも失敗する（理由は列ごと）。
				if (failing)
					throw new Error(FAILURE_REASONS[key] ?? '保存できませんでした。')
				// 例: 「エラー」を含む名前は保存に失敗させる。
				if (key === 'name' && String(value).includes('エラー'))
					throw new Error('保存できませんでした')
				setLines(current =>
					current.map(line =>
						line.id === id ? { ...line, [key]: value } : line,
					),
				)
			},
		[failing],
	)
	// 列は作り直さない（作り直すとセルの状態が消える）。
	const columns = React.useMemo<ColumnDef<Line>[]>(
		() => [
			{
				accessorKey: 'name',
				header: '品目名',
				cell: ({ row }) => (
					<DataTableTextCell
						ariaLabel={`${row.original.id}の品目名を変更`}
						label={`${row.original.id}の品目名`}
						value={row.original.name}
						required
						maxLength={40}
						onSave={update(row.original.id, 'name')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-56', cellClassName: 'p-0' },
			},
			{
				accessorKey: 'price',
				header: '単価',
				cell: ({ row }) => (
					<DataTableNumberCell
						ariaLabel={`${row.original.id}の単価を変更`}
						label={`${row.original.id}の単価`}
						prefix='¥'
						min={0}
						max={1000000}
						value={row.original.price}
						onSave={update(row.original.id, 'price')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-32 text-right', cellClassName: 'p-0' },
			},
			{
				accessorKey: 'quantity',
				header: '数量',
				cell: ({ row }) => (
					<DataTableNumberCell
						ariaLabel={`${row.original.id}の数量を変更`}
						label={`${row.original.id}の数量`}
						suffix='個'
						min={0}
						allowEmpty
						value={row.original.quantity}
						onSave={update(row.original.id, 'quantity')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-28 text-right', cellClassName: 'p-0' },
			},
			{
				id: 'amount',
				header: '金額',
				cell: ({ row }) =>
					row.original.price !== null && row.original.quantity !== null
						? formatDataTableNumber(
								row.original.price * row.original.quantity,
								{
									prefix: '¥',
								},
							)
						: '—',
				meta: {
					headerClassName: 'w-32 text-right',
					cellClassName: 'text-right tabular-nums text-muted-foreground',
				},
			},
			{
				accessorKey: 'dueDate',
				header: '納期',
				cell: ({ row }) => (
					<DataTableDateCell
						ariaLabel={`${row.original.id}の納期を変更`}
						label={`${row.original.id}の納期`}
						min='2026-11-01'
						value={row.original.dueDate}
						onSave={update(row.original.id, 'dueDate')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-36', cellClassName: 'p-0' },
			},
			{
				accessorKey: 'status',
				header: '状態',
				cell: ({ row }) => (
					<DataTableSelectCell
						ariaLabel={`${row.original.id}の状態を変更`}
						label='状態'
						options={STATUS}
						value={row.original.status}
						onSave={update(row.original.id, 'status')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-36', cellClassName: 'p-0' },
			},
			{
				accessorKey: 'tags',
				header: 'タグ',
				cell: ({ row }) => (
					<DataTableMultiSelectCell
						ariaLabel={`${row.original.id}のタグを変更`}
						label='タグ'
						options={TAGS}
						value={row.original.tags}
						onSave={update(row.original.id, 'tags')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-52', cellClassName: 'p-0' },
			},
			{
				accessorKey: 'active',
				header: '使う',
				cell: ({ row }) => (
					<DataTableToggleCell
						ariaLabel={`${row.original.id}を使う`}
						label={`${row.original.id}の「使う」`}
						onLabel='使う'
						offLabel='使わない'
						value={row.original.active}
						disabled={row.original.status === 'received'}
						onSave={update(row.original.id, 'active')}
						formatError={reason}
					/>
				),
				meta: { headerClassName: 'w-32', cellClassName: 'p-0' },
			},
		],
		[update],
	)
	return (
		<DataTableInlineEditFailuresProvider>
			<div className='space-y-2'>
				<DataTableInlineEditFailureSummary />
				<DataTable
					columns={columns}
					items={lines}
					total={lines.length}
					page={1}
					pageSize={lines.length}
					onPageChange={() => {}}
					hidePagination
				/>
			</div>
		</DataTableInlineEditFailuresProvider>
	)
}

/**
 * 1 つの表で、いろいろな列をその場で直す。保存には 0.5 秒かかる。
 * 品目名に「エラー」を入れると保存に失敗する。入荷済みの行は「使う」を切り替えられない。
 * 金額は単価と数量から出している（保存すると変わる）。
 */
export const EditableTable: Story = {
	render: () => <EditableTableExample />,
}

function cellOf(label: string) {
	return document
		.querySelector(`[aria-label="${label}"]`)
		?.closest('td') as HTMLElement | null
}

function FailingTableExample() {
	// 表示されたら、3 つのセルを直して保存に失敗させる（例のため）。
	React.useEffect(() => {
		let stopped = false
		void (async () => {
			await wait(300)
			const price = cellOf('L-1の単価を変更')
			if (!stopped && price) await typeAndEnter(price, '1500')
			const active = cellOf('L-2を使う')
			if (!stopped && active) await flip(active)
			const name = cellOf('L-4の品目名を変更')
			if (!stopped && name) await typeAndEnter(name, 'ボールペン 赤')
		})()
		return () => {
			stopped = true
		}
	}, [])
	return <EditableTableExample failing />
}

/**
 * 保存がいつも失敗する表。表示されると 3 つのセルを直して失敗させる。
 * 失敗したセルは外周が赤い線になり、右端に「!」が出る。理由はセルに付く吹き出しで出る
 * （失敗した直後は 1 度だけ自分で開き、外を押すか数秒で閉じる。そのあとは触れる・フォーカスすると開く）。
 * 吹き出しには、何が失敗したか・理由・元の値と、「もう一度」「直す」が出る。キーボードではセルで ↓ を押すと移れる。
 * 表の上の「3件を保存できませんでした」は、押すとそのセルへ移る（`DataTableInlineEditFailuresProvider` と
 * `DataTableInlineEditFailureSummary` で、表の側で任意に付ける）。
 */
export const FailingTable: Story = {
	name: '失敗が複数ある表',
	render: () => <FailingTableExample />,
}
