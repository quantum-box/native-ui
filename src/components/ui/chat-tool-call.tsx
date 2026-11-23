'use client'

import { AlertCircle, Check, Circle, Loader2, Wrench } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'
import {
	TraceCollapsible,
	TraceCollapsibleContent,
	TraceCollapsibleTrigger,
	TraceDescription,
	TraceIcon,
	TraceLine,
	TraceTitle,
} from './trace'

/*
 * AI が道具（検索・計算・記録の読み書きなど）を使った記録。`Trace` の 1 行として出し、
 * 押すと「渡した物」と「返ってきた物」が開く。
 */

type ToolCallStatus = 'pending' | 'running' | 'done' | 'error'

const STATUS_TEXT: Record<ToolCallStatus, string> = {
	pending: '待ち',
	running: '実行中',
	done: '済み',
	error: '失敗',
}

interface ToolCallProps {
	/** 使った道具の名前。人が読める言葉で。例「仕訳を探す」。 */
	name: React.ReactNode
	status: ToolCallStatus
	/** 渡した物。文字か、JSON にできる値。 */
	input?: unknown
	/** 返ってきた物。文字か、JSON にできる値。 */
	output?: unknown
	/** 失敗したときの説明。 */
	error?: React.ReactNode
	/** かかった時間など、右に添える補足。例「1.2 秒」。 */
	description?: React.ReactNode
	/** 最初から開いておく。 */
	defaultOpen?: boolean
	className?: string
}

function show(value: unknown) {
	if (value === undefined || value === null) return ''
	if (typeof value === 'string') return value
	try {
		return JSON.stringify(value, null, 2)
	} catch {
		return String(value)
	}
}

function StatusIcon({ status }: Readonly<{ status: ToolCallStatus }>) {
	if (status === 'running')
		return <Loader2 className='motion-safe:animate-spin' />
	if (status === 'done') return <Check />
	if (status === 'error') return <AlertCircle />
	return <Circle />
}

function Section({
	title,
	value,
}: Readonly<{ title: string; value: unknown }>) {
	const text = show(value)
	if (!text) return null
	return (
		<div className='grid gap-1'>
			<p className='font-medium text-foreground text-xs'>{title}</p>
			<pre className='max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted px-2 py-1.5 font-mono text-[11px] text-foreground leading-relaxed'>
				{text}
			</pre>
		</div>
	)
}

/** 道具を使った記録 1 件。`Trace` の中に並べる。 */
function ToolCall({
	name,
	status,
	input,
	output,
	error,
	description,
	defaultOpen,
	className,
}: Readonly<ToolCallProps>) {
	const traceStatus =
		status === 'running'
			? 'running'
			: status === 'error'
				? 'error'
				: status === 'pending'
					? 'pending'
					: undefined
	const line = (
		<TraceLine status={traceStatus}>
			<TraceIcon>
				<StatusIcon status={status} />
			</TraceIcon>
			<TraceIcon className='-ml-1 opacity-60'>
				<Wrench className='size-3.5' />
			</TraceIcon>
			<TraceTitle>{name}</TraceTitle>
			<TraceDescription>
				{description ?? STATUS_TEXT[status]}
				<span className='sr-only'>（{STATUS_TEXT[status]}）</span>
			</TraceDescription>
		</TraceLine>
	)
	const hasDetails = show(input) || show(output) || error
	if (!hasDetails) return <div className={className}>{line}</div>
	return (
		<TraceCollapsible className={className} defaultOpen={defaultOpen}>
			<TraceCollapsibleTrigger>{line}</TraceCollapsibleTrigger>
			<TraceCollapsibleContent>
				<div className='grid gap-2'>
					<Section title='渡した物' value={input} />
					<Section title='返ってきた物' value={output} />
					{error ? <p className='text-destructive text-xs'>{error}</p> : null}
				</div>
			</TraceCollapsibleContent>
		</TraceCollapsible>
	)
}

interface ToolCallGroupProps {
	/** 見出し。既定は「実行履歴」。 */
	title?: React.ReactNode
	/** 使った回数。見出しに「（3 件）」と出す。 */
	count?: number
	/** 失敗した回数。1 以上なら見出しに「・失敗 1 件」と足し、赤くする。 */
	failed?: number
	/** 動いている途中か。途中は開いておく。 */
	running?: boolean
	defaultOpen?: boolean
	/** 中に並べる `ToolCall`。 */
	children: React.ReactNode
	className?: string
}

/** 済んだ道具の記録をひとまとめに折りたたむ。「実行履歴（3 件・失敗 1 件）」。 */
function ToolCallGroup({
	title = '実行履歴',
	count,
	failed = 0,
	running = false,
	defaultOpen,
	children,
	className,
}: Readonly<ToolCallGroupProps>) {
	const summary = [
		count !== undefined ? `${count} 件` : null,
		failed > 0 ? `失敗 ${failed} 件` : null,
	]
		.filter(Boolean)
		.join('・')
	return (
		<TraceCollapsible
			className={className}
			defaultOpen={defaultOpen ?? running}
		>
			<TraceCollapsibleTrigger>
				<TraceLine
					status={running ? 'running' : failed > 0 ? 'error' : undefined}
				>
					<TraceIcon>
						{running ? (
							<Loader2 className='motion-safe:animate-spin' />
						) : (
							<Wrench />
						)}
					</TraceIcon>
					<TraceTitle>
						{title}
						{summary ? `（${summary}）` : null}
					</TraceTitle>
				</TraceLine>
			</TraceCollapsibleTrigger>
			<TraceCollapsibleContent>
				<div className='grid gap-2'>{children}</div>
			</TraceCollapsibleContent>
		</TraceCollapsible>
	)
}

export {
	ToolCall,
	ToolCallGroup,
	type ToolCallGroupProps,
	type ToolCallProps,
	type ToolCallStatus,
}
