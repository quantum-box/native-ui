import type { ColumnDef, ColumnMeta } from '@tanstack/react-table'
import { ArrowUpRight } from 'lucide-react'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'

import { cn } from '../../lib/utils'
import {
	DataTableSelectCell,
	type DataTableSelectCellProps,
	type DataTableSelectOption,
} from './data-table-select-cell'
import { DataTableOverflowList } from './data-table-overflow-list'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import {
	RecordActionButton,
	RecordChip,
	type RecordStatus,
	RecordSystemBand,
	recordToneStyle,
	useRecordKind,
	useRecordSystem,
} from './record'

const PLACEHOLDER = Symbol('record-placeholder')

/** 記録の代わりに置く印（読み込み中・消えた・見る権限が無い）。 */
export type RecordPlaceholder = {
	readonly [PLACEHOLDER]: Exclude<RecordStatus, 'ready'>
	/** 並べるときの見分け（消えた記録の ID など）。 */
	readonly key: string
}

/** 記録の代わりに置く印を作る。複数の記録を出すときに使う。 */
export function recordPlaceholder(
	status: Exclude<RecordStatus, 'ready'>,
	key: string,
): RecordPlaceholder {
	return { [PLACEHOLDER]: status, key }
}

function isPlaceholder(value: unknown): value is RecordPlaceholder {
	return typeof value === 'object' && value !== null && PLACEHOLDER in value
}

export type DataTableRecordCellProps<T = unknown> = {
	/** 登録した種類の名前。 */
	kind: string
	/** 出す記録。`null` なら「未設定」。 */
	record?: T | null
	/** 記録の様子（読み込み中・消えた・見る権限が無い）。 */
	status?: RecordStatus
	/** 複数の記録を出すとき。読み込み中などの記録は `recordPlaceholder` で置く。 */
	records?: readonly (T | RecordPlaceholder)[]
	/** 複数のとき、並べて出す数の上限。既定は、セルの幅に入るだけ並べ、残りを「+N」にまとめる。 */
	max?: number
	/** 補足（コードなど）も出す。 */
	showDescription?: boolean
	/** 記録が無いときの文言。 */
	emptyText?: string
	className?: string
}

/**
 * 表のセルに別の業務の記録を出す。見た目と動きは登録した種類の決まりどおり。
 * 複数の記録は並べて出し、多いときは「+N」を押すと残りが出る。
 */
export function DataTableRecordCell<T = unknown>({
	kind,
	record,
	status,
	records,
	max,
	showDescription = false,
	emptyText = '未設定',
	className,
}: DataTableRecordCellProps<T>) {
	const { definition } = useRecordKind<T>(kind)
	const empty = (
		<span className={cn('text-muted-foreground text-sm', className)}>
			{emptyText}
		</span>
	)

	if (!records) {
		if (!record && !status) return empty
		return (
			<RecordChip
				kind={kind}
				record={record}
				status={status}
				showDescription={showDescription}
				className={className}
			/>
		)
	}
	if (!records.length) return empty

	const chip = (item: T | RecordPlaceholder) =>
		isPlaceholder(item) ? (
			<RecordChip key={item.key} kind={kind} status={item[PLACEHOLDER]} />
		) : (
			<RecordChip
				key={definition.getId(item)}
				kind={kind}
				record={item}
				showDescription={showDescription}
			/>
		)
	const keyOf = (item: T | RecordPlaceholder) =>
		isPlaceholder(item) ? item.key : definition.getId(item)
	const quiet = (item: T | RecordPlaceholder) =>
		isPlaceholder(item) ? (
			<RecordChip kind={kind} status={item[PLACEHOLDER]} interactive={false} />
		) : (
			<RecordChip
				kind={kind}
				record={item}
				interactive={false}
				showDescription={showDescription}
			/>
		)
	return (
		<DataTableOverflowList
			className={className}
			max={max}
			items={records.map(item => ({
				key: keyOf(item),
				node: chip(item),
				measure: quiet(item),
			}))}
			renderMore={hidden => (
				<MoreRecords
					label={`ほかの${definition.name} ${hidden}件を見る`}
					title={`${definition.name}（${records.length}件）`}
					count={hidden}
				>
					{records.map(item => (
						<li key={keyOf(item)} className='flex min-w-0 px-1'>
							{chip(item)}
						</li>
					))}
				</MoreRecords>
			)}
		/>
	)
}

/**
 * 「+N」。触れる・押すと、残りを含む全部の記録が出る（それぞれ触れると要点と「〜で開く」が出る）。
 */
function MoreRecords({
	label,
	title,
	count,
	children,
}: {
	label: string
	title: string
	count: number
	children: ReactNode
}) {
	const [open, setOpen] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout>>()
	useEffect(() => () => clearTimeout(timer.current), [])
	const later = (next: boolean, delay: number) => {
		clearTimeout(timer.current)
		timer.current = setTimeout(() => setOpen(next), delay)
	}
	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type='button'
					aria-label={label}
					className='rounded-sm bg-muted px-1.5 text-muted-foreground text-xs leading-5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					onClick={event => event.stopPropagation()}
					onPointerEnter={event => {
						if (event.pointerType === 'mouse') later(true, 300)
					}}
					onPointerLeave={event => {
						if (event.pointerType === 'mouse') later(false, 200)
					}}
				>
					+{count}
				</button>
			</PopoverTrigger>
			<PopoverContent
				align='start'
				className='w-64 p-2'
				aria-label={title}
				onPointerEnter={() => clearTimeout(timer.current)}
				onPointerLeave={event => {
					if (event.pointerType === 'mouse') later(false, 200)
				}}
			>
				<p className='px-1 pb-1 text-muted-foreground text-xs'>{title}</p>
				<ul className='space-y-1'>{children}</ul>
			</PopoverContent>
		</Popover>
	)
}

export type DataTableRecordSelectCellProps<T = unknown> = Omit<
	DataTableSelectCellProps,
	| 'value'
	| 'options'
	| 'onSave'
	| 'label'
	| 'renderValue'
	| 'validate'
	| 'searchPlaceholder'
	| 'pickerHeader'
	| 'pickerFooter'
	| 'pickerClassName'
	| 'pickerStyle'
> & {
	/** 登録した種類の名前。候補・見た目はその決まりから出す。 */
	kind: string
	/** 今の記録。`null` なら未設定。 */
	record: T | null
	/** 付け替える。終わる前に使う側の記録を新しい記録にし、失敗したら例外を投げる。 */
	onSave: (record: T | null) => Promise<void>
	/** 候補。渡さなければ種類の決まりの `useCandidates` から出す。 */
	candidates?: readonly T[]
	/** 「未設定」に戻せるようにする。 */
	allowEmpty?: boolean
	/** 保存の前に確かめる。だめなら理由の文言を返す（保存しない）。 */
	validate?: (record: T | null) => string | null
}

const noCandidates = () => ({ records: [] as const })

/**
 * 表の中でその場で別の記録に付け替えるセル（担当者を変えるなど）。
 * 流れは `DataTableSelectCell` と同じで、候補と見た目は種類の決まりから出す。
 */
export function DataTableRecordSelectCell<T = unknown>({
	kind,
	record,
	onSave,
	candidates,
	allowEmpty = false,
	validate,
	...rest
}: DataTableRecordSelectCellProps<T>) {
	const { definition, navigate } = useRecordKind<T>(kind)
	const system = useRecordSystem(definition)
	const external = system?.external ? system : null
	// 種類ごとに同じフックを呼ぶ。セルの種類を途中で変えるときは key も変える。
	const fromKind = (definition.useCandidates ?? noCandidates)()
	const pool = candidates ?? (fromKind.records as readonly T[])
	const byId = useMemo(() => {
		const map = new Map<string, T>()
		for (const item of pool) map.set(definition.getId(item), item)
		if (record) map.set(definition.getId(record), record)
		return map
	}, [definition, pool, record])
	const options = useMemo(() => {
		const list: DataTableSelectOption[] = []
		if (allowEmpty) list.push({ value: '', label: '未設定' })
		byId.forEach((item, id) =>
			list.push({
				value: id,
				label: definition.getLabel(item),
				keywords: [
					...(definition.getDescription?.(item)
						? [definition.getDescription(item) as string]
						: []),
					...(definition.getKeywords?.(item) ?? []),
				],
			}),
		)
		return list
	}, [allowEmpty, byId, definition])

	return (
		<DataTableSelectCell
			{...rest}
			label={definition.name}
			value={record ? definition.getId(record) : ''}
			options={options}
			validate={validate ? id => validate(byId.get(id) ?? null) : undefined}
			onSave={id => onSave(byId.get(id) ?? null)}
			searchPlaceholder={
				external
					? `${external.name}の${definition.name}を検索…`
					: `${definition.name}を検索…`
			}
			pickerStyle={external ? recordToneStyle(external.tone) : undefined}
			pickerClassName={
				external
					? 'w-72 border-l-[3px] border-l-[hsl(var(--record-tone))]'
					: undefined
			}
			pickerHeader={
				external ? (
					<RecordSystemBand
						system={{
							name: external.name,
							icon: external.icon ?? definition.icon,
						}}
						trailing={
							<>
								<span className='sr-only'>別のシステムから選ぶ</span>
								<ArrowUpRight aria-hidden className='h-3 w-3' />
							</>
						}
					>
						{definition.name}から選ぶ
					</RecordSystemBand>
				) : undefined
			}
			pickerFooter={
				definition.pickerActions?.length ? (
					<div className='flex flex-wrap gap-1 border-border border-t p-1.5'>
						{definition.pickerActions.map(action => (
							<RecordActionButton
								key={action.label}
								action={action}
								navigate={navigate}
							/>
						))}
					</div>
				) : undefined
			}
			renderValue={(_, id) => {
				const item = byId.get(id)
				return item ? (
					<RecordChip
						kind={kind}
						record={item}
						interactive={false}
						showDescription
						toned
					/>
				) : (
					<span className='text-muted-foreground text-sm'>未設定</span>
				)
			}}
		/>
	)
}

/**
 * 別の記録を出す列を作る。表ごとにセルを書かずに済む。
 *
 * ```ts
 * dataTableRecordColumn<Invoice>({ id: 'customer', header: '取引先', kind: 'customer', get: row => row.customer })
 * ```
 */
export function dataTableRecordColumn<TRow, T = unknown>({
	id,
	header,
	kind,
	get,
	status,
	max,
	showDescription,
	emptyText,
	meta,
}: {
	id: string
	header: string
	kind: string
	/** 行から記録（または記録の並び）を取り出す。 */
	get: (row: TRow) => T | null | undefined | readonly (T | RecordPlaceholder)[]
	/** 行ごとの記録の様子。 */
	status?: (row: TRow) => RecordStatus | undefined
	max?: number
	showDescription?: boolean
	emptyText?: string
	meta?: ColumnMeta<TRow, unknown>
}): ColumnDef<TRow> {
	return {
		id,
		header,
		meta,
		cell: ({ row }) => {
			const value = get(row.original)
			return Array.isArray(value) ? (
				<DataTableRecordCell
					kind={kind}
					records={value as readonly (T | RecordPlaceholder)[]}
					max={max}
					showDescription={showDescription}
					emptyText={emptyText}
				/>
			) : (
				<DataTableRecordCell
					kind={kind}
					record={(value as T | null | undefined) ?? null}
					status={status?.(row.original)}
					showDescription={showDescription}
					emptyText={emptyText}
				/>
			)
		},
	}
}
