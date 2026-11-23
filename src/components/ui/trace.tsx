'use client'

import { ChevronRight } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from './collapsible'

/*
 * AI が裏でしたこと（調べた・考えた・道具を使った）の経過を、1 行ずつ並べて出す。
 * 行を押すと中身が開く。shadcn の trace を元に、Radix の Collapsible で作り直してある。
 */

/** 経過の行をまとめる。 */
function Trace({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='trace'
			className={cn('flex w-full min-w-0 flex-col gap-2', className)}
			{...props}
		/>
	)
}

interface TraceLineProps extends React.ComponentProps<'span'> {
	/** `running` は動いている途中（文字が光って流れる）、`error` は失敗、`pending` はまだ。 */
	status?: 'running' | 'error' | 'pending'
}

/** 経過の 1 行。印・見出し・補足を横に並べる。 */
function TraceLine({ className, status, ...props }: TraceLineProps) {
	return (
		<span
			data-slot='trace-line'
			data-status={status}
			className={cn(
				'group/trace-line flex w-fit min-w-0 max-w-full items-center gap-2 text-muted-foreground text-sm leading-5 transition-colors duration-fast [button:hover_&]:text-foreground data-[status=error]:text-destructive data-[status=error]:[button:hover_&]:text-destructive data-[status=pending]:opacity-60',
				className,
			)}
			{...props}
		/>
	)
}

/** 行の先頭の印。 */
function TraceIcon({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot='trace-icon'
			aria-hidden='true'
			className={cn(
				'flex size-4 shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:size-4',
				className,
			)}
			{...props}
		/>
	)
}

/** 行の見出し。動いている途中は文字が光って流れる（動きを減らす設定では止まる）。 */
function TraceTitle({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot='trace-title'
			className={cn(
				'min-w-0 truncate group-data-[status=running]/trace-line:motion-safe:animate-trace-shimmer group-data-[status=running]/trace-line:motion-safe:bg-[length:200%_100%] group-data-[status=running]/trace-line:motion-safe:bg-[linear-gradient(90deg,currentColor_40%,hsl(var(--nui-foreground))_50%,currentColor_60%)] group-data-[status=running]/trace-line:motion-safe:bg-clip-text group-data-[status=running]/trace-line:motion-safe:[-webkit-text-fill-color:transparent]',
				className,
			)}
			{...props}
		/>
	)
}

/** 行の右の補足（かかった時間・件数など）。 */
function TraceDescription({
	className,
	...props
}: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot='trace-description'
			className={cn(
				'shrink-0 text-muted-foreground/70 tabular-nums',
				className,
			)}
			{...props}
		/>
	)
}

/** 押すと中身が開く行。`open` と `onOpenChange` で外から開け閉めもできる。 */
function TraceCollapsible({
	className,
	...props
}: React.ComponentPropsWithoutRef<typeof Collapsible>) {
	return (
		<Collapsible
			data-slot='trace-collapsible'
			className={cn('flex w-full min-w-0 flex-col', className)}
			{...props}
		/>
	)
}

/** 開け閉めの引き金になる行。右に向きの変わる矢印が付く。 */
const TraceCollapsibleTrigger = React.forwardRef<
	React.ElementRef<typeof CollapsibleTrigger>,
	React.ComponentPropsWithoutRef<typeof CollapsibleTrigger>
>(({ className, children, ...props }, ref) => (
	<CollapsibleTrigger
		ref={ref}
		data-slot='trace-collapsible-trigger'
		className={cn(
			'group/trace-trigger flex w-fit min-w-0 max-w-full cursor-pointer items-center gap-1 rounded-md text-left text-muted-foreground outline-none transition-colors duration-fast hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 has-[[data-status=error]]:text-destructive',
			className,
		)}
		{...props}
	>
		{children}
		<TraceIcon className='transition-transform duration-fast group-data-[state=open]/trace-trigger:rotate-90'>
			<ChevronRight />
		</TraceIcon>
	</CollapsibleTrigger>
))
TraceCollapsibleTrigger.displayName = 'TraceCollapsibleTrigger'

/** 開いたときに出る中身。左に縦線を引いて、どの行の中身か分かるようにする。 */
const TraceCollapsibleContent = React.forwardRef<
	React.ElementRef<typeof CollapsibleContent>,
	React.ComponentPropsWithoutRef<typeof CollapsibleContent>
>(({ className, children, ...props }, ref) => (
	<CollapsibleContent
		ref={ref}
		data-slot='trace-collapsible-content'
		className='min-w-0 overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'
		{...props}
	>
		<div
			data-slot='trace-collapsible-content-inner'
			className={cn(
				'mt-2 mb-1 ml-[7px] min-w-0 break-words border-border border-l pr-1 pl-4 text-muted-foreground leading-relaxed',
				className,
			)}
		>
			{children}
		</div>
	</CollapsibleContent>
))
TraceCollapsibleContent.displayName = 'TraceCollapsibleContent'

export {
	Trace,
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceDescription,
	TraceIcon,
	TraceLine,
	type TraceLineProps,
	TraceTitle,
}
