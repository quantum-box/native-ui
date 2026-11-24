import { type ReactNode, useState } from 'react'

import { cn } from '../../lib/utils'
import { RecordChip, type RecordStatus, useRecordKind } from './record'

/** 一覧に並べる記録 1 つ。 */
export type RecordListItem = {
	/** 並びの中の見分け。 */
	key: string
	/** 登録した種類の名前。 */
	kind: string
	record?: unknown
	/** 記録の様子（読み込み中・消えた・見る権限が無い・読み込めない）。 */
	status?: RecordStatus
	/** 右に小さく出す補足（日付・金額・関係の名前など）。 */
	meta?: ReactNode
	/** 名前の横に出す小さな印（例「変えた」）。 */
	badge?: ReactNode
}

export type RecordListProps = {
	/** 見出し（例「関係する記録」「参照した記録」）。 */
	title?: ReactNode
	items: readonly RecordListItem[]
	/** 種類ごとにまとめて、種類の名前を見出しにする。 */
	groupByKind?: boolean
	/** これより多いときは先頭だけ出し、「ほか N 件」を押すと残りも出す。 */
	max?: number
	/** 記録が無いときの文言。 */
	emptyText?: string
	className?: string
}

function KindHeading({ kind, count }: { kind: string; count: number }) {
	const { definition } = useRecordKind(kind)
	const Icon = definition.icon
	return (
		<p className='flex items-center gap-1.5 px-1 pt-1 text-muted-foreground text-xs'>
			{Icon ? <Icon aria-hidden className='h-3.5 w-3.5' /> : null}
			{definition.name}
			<span className='tabular-nums'>{count} 件</span>
		</p>
	)
}

function Row({ item }: { item: RecordListItem }) {
	return (
		<li className='flex min-h-8 min-w-0 items-center gap-2 rounded-md px-1 py-1 hover:bg-muted/50'>
			<span className='flex min-w-0 flex-1 items-center gap-1.5'>
				<RecordChip
					kind={item.kind}
					record={item.record}
					status={item.status}
					showDescription
				/>
				{item.badge ? (
					<span className='shrink-0 rounded-sm bg-selected px-1 text-[10px] text-primary'>
						{item.badge}
					</span>
				) : null}
			</span>
			{item.meta ? (
				<span className='shrink-0 text-muted-foreground text-xs tabular-nums'>
					{item.meta}
				</span>
			) : null}
		</li>
	)
}

/**
 * 記録の一覧。詳細の画面の「関係する記録」、AI の返事の出典、通知などで使う。
 * どの記録も表のセルと同じ絵・名前・要点のカード（「〜で開く」）で出し、消えた・見る権限が無い記録も同じ出し方にする。
 */
export function RecordList({
	title,
	items,
	groupByKind = false,
	max,
	emptyText = '関係する記録はありません。',
	className,
}: RecordListProps) {
	const [expanded, setExpanded] = useState(false)
	const shown =
		max !== undefined && !expanded ? items.slice(0, max) : [...items]
	const rest = items.length - shown.length
	const groups: { kind: string; items: RecordListItem[] }[] = []
	if (groupByKind)
		for (const item of shown) {
			const group = groups.find(entry => entry.kind === item.kind)
			if (group) group.items.push(item)
			else groups.push({ kind: item.kind, items: [item] })
		}
	return (
		<section className={cn('grid gap-1', className)}>
			{title ? (
				<p className='font-medium text-muted-foreground text-xs'>
					{title}
					<span className='ml-1 tabular-nums'>{items.length} 件</span>
				</p>
			) : null}
			{items.length === 0 ? (
				<p className='px-1 py-1 text-muted-foreground text-sm'>{emptyText}</p>
			) : groupByKind ? (
				groups.map(group => (
					<div key={group.kind} className='grid gap-0.5'>
						<KindHeading kind={group.kind} count={group.items.length} />
						<ul className='grid'>
							{group.items.map(item => (
								<Row key={item.key} item={item} />
							))}
						</ul>
					</div>
				))
			) : (
				<ul className='grid'>
					{shown.map(item => (
						<Row key={item.key} item={item} />
					))}
				</ul>
			)}
			{rest > 0 ? (
				<button
					type='button'
					onClick={() => setExpanded(true)}
					className='w-fit rounded-sm px-1 text-muted-foreground text-xs hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
				>
					ほか {rest} 件
				</button>
			) : null}
		</section>
	)
}
