'use client'

import { ExternalLink, FileText, Link2 } from 'lucide-react'
import type * as React from 'react'

import { useHoverOpen } from '../../lib/use-hover-open'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover'

/*
 * 返事の出典・参照。返事の中に [1] のような小さな印を置き、触れるとその資料の中身が
 * 開く。返事の下には、元の資料・記録の一覧を並べる。
 */

/** 出典・参照 1 つ。 */
interface ChatSource {
	/** 返事の中の印と結び付ける番号や名前。 */
	id: string
	/** 資料・記録の名前。例「請求書 INV-2026-1104」。 */
	title: React.ReactNode
	/** 開く先。画面の中の記録なら相対の URL でもよい。 */
	href?: string
	/** 中身の抜き出しや、どこを使ったか。 */
	excerpt?: React.ReactNode
	/** 種類。例「仕訳」「請求書」「Web」。一覧の左に小さく出す。 */
	kind?: React.ReactNode
	/** この返事で変えた記録か。一覧で「変えた」の印を付け、先に並べる。 */
	changed?: boolean
}

function isExternal(href?: string) {
	return Boolean(href && /^https?:\/\//.test(href))
}

function SourceDetails({ source }: Readonly<{ source: ChatSource }>) {
	return (
		<div className='grid gap-1.5 text-xs'>
			<p className='flex items-center gap-1.5 font-medium text-sm'>
				<FileText aria-hidden className='size-3.5 text-muted-foreground' />
				<span className='min-w-0'>{source.title}</span>
			</p>
			{source.kind ? (
				<p className='text-muted-foreground'>{source.kind}</p>
			) : null}
			{source.excerpt ? (
				<p className='border-border border-l-2 pl-2 text-muted-foreground leading-relaxed'>
					{source.excerpt}
				</p>
			) : null}
			{source.href ? (
				<a
					className='inline-flex w-fit items-center gap-1 text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
					href={source.href}
					{...(isExternal(source.href)
						? { rel: 'noreferrer noopener', target: '_blank' }
						: {})}
				>
					開く
					{isExternal(source.href) ? (
						<ExternalLink aria-hidden className='size-3' />
					) : null}
				</a>
			) : null}
		</div>
	)
}

interface CitationMarkProps {
	source: ChatSource
	/** 印に出す文字。既定は source.id（例「1」→「[1]」の形）。 */
	label?: React.ReactNode
	className?: string
}

/** 返事の中の小さな出典の印。触れる・押す・キーボードで、その資料の中身が開く。 */
function CitationMark({
	source,
	label,
	className,
}: Readonly<CitationMarkProps>) {
	const { open, setOpen, hover } = useHoverOpen()
	const text = typeof source.title === 'string' ? source.title : ''
	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				aria-label={`出典 ${label ?? source.id}${text ? `: ${text}` : ''}`}
				className={cn(
					'mx-0.5 inline-flex h-4 min-w-4 -translate-y-[0.15em] items-center justify-center rounded-sm bg-muted px-1 align-baseline font-medium text-[10px] text-muted-foreground tabular-nums leading-none transition-colors duration-fast hover:bg-selected hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
					className,
				)}
				type='button'
				{...hover}
			>
				{label ?? source.id}
			</PopoverTrigger>
			<PopoverContent align='start' className='w-72' {...hover}>
				<SourceDetails source={source} />
			</PopoverContent>
		</Popover>
	)
}

interface SourceListProps {
	sources: ChatSource[]
	/** 見出し。既定は「出典・参照」。例「操作した記録」「分析の根拠」。 */
	title?: React.ReactNode
	/** これより多いときは先頭だけ出し、「ほか N 件」と書く。 */
	max?: number
	className?: string
}

/** 返事の下に並べる、元の資料・記録の一覧。変えた記録を先に並べる。 */
function SourceList({
	sources,
	title = '出典・参照',
	max,
	className,
}: Readonly<SourceListProps>) {
	if (sources.length === 0) return null
	const sorted = [...sources].sort(
		(a, b) => Number(Boolean(b.changed)) - Number(Boolean(a.changed)),
	)
	const shown = max !== undefined ? sorted.slice(0, max) : sorted
	const rest = sorted.length - shown.length
	return (
		<section className={cn('grid gap-1.5', className)}>
			<p className='font-medium text-muted-foreground text-xs'>
				{title}
				<span className='ml-1 tabular-nums'>{sources.length} 件</span>
			</p>
			<ol className='grid gap-1'>
				{shown.map(source => {
					const body = (
						<>
							<span className='grid h-4 min-w-4 shrink-0 place-items-center rounded-sm bg-muted px-1 font-medium text-[10px] text-muted-foreground tabular-nums'>
								{source.id}
							</span>
							{source.kind ? (
								<span className='shrink-0 text-muted-foreground'>
									{source.kind}
								</span>
							) : null}
							<span className='min-w-0 truncate'>{source.title}</span>
							{source.changed ? (
								<span className='shrink-0 rounded-sm bg-selected px-1 text-[10px] text-primary'>
									変えた
								</span>
							) : null}
							{isExternal(source.href) ? (
								<ExternalLink
									aria-hidden
									className='size-3 shrink-0 text-muted-foreground'
								/>
							) : source.href ? (
								<Link2
									aria-hidden
									className='size-3 shrink-0 text-muted-foreground'
								/>
							) : null}
						</>
					)
					return (
						<li key={source.id}>
							{source.href ? (
								<a
									className='flex min-w-0 items-center gap-1.5 rounded-md px-1 py-0.5 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'
									href={source.href}
									{...(isExternal(source.href)
										? { rel: 'noreferrer noopener', target: '_blank' }
										: {})}
								>
									{body}
								</a>
							) : (
								<span className='flex min-w-0 items-center gap-1.5 px-1 py-0.5 text-xs'>
									{body}
								</span>
							)}
						</li>
					)
				})}
			</ol>
			{rest > 0 ? (
				<p className='px-1 text-muted-foreground text-xs'>ほか {rest} 件</p>
			) : null}
		</section>
	)
}

export {
	type ChatSource,
	CitationMark,
	type CitationMarkProps,
	SourceList,
	type SourceListProps,
}
