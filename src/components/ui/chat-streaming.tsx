'use client'

import { Brain, ChevronRight } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from './collapsible'

/*
 * 返事が届いている途中の見せ方。
 * - StreamingText: 文字が流れてくる途中は、末尾に点滅する棒を出す。
 * - ThinkingIndicator: 返事がまだ 1 文字も来ていない間の「考えています」。
 * - ThinkingBlock: AI の考えた筋道。折りたためて、考えた時間を出す。
 */

interface StreamingTextProps extends React.HTMLAttributes<HTMLDivElement> {
	/** 届いている途中か。途中は末尾に点滅する棒を出し、読み上げは区切りごとにする。 */
	streaming?: boolean
	children: React.ReactNode
}

/** 届いている途中の返事。中身（文字やマークダウンを描いた物）はそのまま渡す。 */
function StreamingText({
	streaming = false,
	className,
	children,
	...props
}: StreamingTextProps) {
	return (
		<div
			aria-busy={streaming || undefined}
			className={cn(
				'whitespace-pre-wrap break-words text-sm leading-relaxed',
				streaming &&
					"after:ml-0.5 after:inline-block after:h-[1.1em] after:w-[2px] after:translate-y-[0.2em] after:bg-foreground/70 after:content-[''] motion-safe:after:animate-pulse",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

/** いま何秒たったかを 1 秒ごとに数える。active でない間は止まる。 */
function useElapsedSeconds(active: boolean, startedAt?: number) {
	const [now, setNow] = React.useState(() => Date.now())
	const start = React.useRef(startedAt ?? Date.now())
	React.useEffect(() => {
		if (startedAt !== undefined) start.current = startedAt
	}, [startedAt])
	React.useEffect(() => {
		if (!active) return
		if (startedAt === undefined) start.current = Date.now()
		setNow(Date.now())
		const timer = setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(timer)
	}, [active, startedAt])
	return Math.max(0, Math.floor((now - start.current) / 1000))
}

interface ThinkingIndicatorProps {
	/** 出す言葉。既定は「考えています」。例「表を調べています」。 */
	label?: React.ReactNode
	/** 経った秒数を出す。 */
	showElapsed?: boolean
	/** 数え始めた時刻（Date.now() の値）。渡さなければ出たときから数える。 */
	startedAt?: number
	className?: string
}

/** 返事がまだ届いていない間の印。3 つの点が順に光る。 */
function ThinkingIndicator({
	label = '考えています',
	showElapsed = false,
	startedAt,
	className,
}: Readonly<ThinkingIndicatorProps>) {
	const seconds = useElapsedSeconds(showElapsed, startedAt)
	return (
		<div
			aria-live='polite'
			className={cn(
				'flex items-center gap-2 text-muted-foreground text-sm',
				className,
			)}
			role='status'
		>
			<span aria-hidden className='flex gap-1'>
				{[0, 150, 300].map(delay => (
					<span
						className='size-1.5 rounded-full bg-current motion-safe:animate-pulse'
						key={delay}
						style={{ animationDelay: `${delay}ms` }}
					/>
				))}
			</span>
			<span>{label}</span>
			{showElapsed ? (
				<span className='tabular-nums text-xs opacity-70'>{seconds} 秒</span>
			) : null}
		</div>
	)
}

function durationText(seconds: number) {
	if (seconds < 60) return `${seconds} 秒`
	const minutes = Math.floor(seconds / 60)
	const rest = seconds % 60
	return rest ? `${minutes} 分 ${rest} 秒` : `${minutes} 分`
}

interface ThinkingBlockProps {
	/** 考えた筋道の中身。 */
	children: React.ReactNode
	/** 考えている途中か。途中は開いておき、見出しは「考えています…」になる。 */
	thinking?: boolean
	/** 考えた秒数。済んだあと見出しに「12 秒考えました」と出す。 */
	durationSeconds?: number
	/** 最初から開いておくか。既定は考えている途中だけ開く。 */
	defaultOpen?: boolean
	className?: string
}

/** AI の考えた筋道。折りたためる。 */
function ThinkingBlock({
	children,
	thinking = false,
	durationSeconds,
	defaultOpen,
	className,
}: Readonly<ThinkingBlockProps>) {
	const [open, setOpen] = React.useState(defaultOpen ?? thinking)
	const wasThinking = React.useRef(thinking)
	// 考え終わったら閉じる（人が開いていた場合も一度閉じる）。
	React.useEffect(() => {
		if (wasThinking.current && !thinking && defaultOpen === undefined)
			setOpen(false)
		if (thinking) setOpen(true)
		wasThinking.current = thinking
	}, [thinking, defaultOpen])

	const title = thinking
		? '考えています…'
		: durationSeconds !== undefined
			? `${durationText(durationSeconds)}考えました`
			: '考えた筋道'

	return (
		<Collapsible
			className={cn('grid min-w-0 gap-1', className)}
			onOpenChange={setOpen}
			open={open}
		>
			<CollapsibleTrigger className='group/thinking flex w-fit items-center gap-1.5 rounded-md text-muted-foreground text-sm transition-colors duration-fast hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50'>
				<Brain
					aria-hidden
					className={cn('size-4', thinking && 'motion-safe:animate-pulse')}
				/>
				<span>{title}</span>
				<ChevronRight
					aria-hidden
					className='size-4 transition-transform duration-fast group-data-[state=open]/thinking:rotate-90'
				/>
			</CollapsibleTrigger>
			<CollapsibleContent className='overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
				<div className='mt-1 ml-2 whitespace-pre-wrap border-border border-l pl-3 text-muted-foreground text-sm leading-relaxed'>
					{children}
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}

export {
	StreamingText,
	type StreamingTextProps,
	ThinkingBlock,
	type ThinkingBlockProps,
	ThinkingIndicator,
	type ThinkingIndicatorProps,
}
