'use client'

import { Sparkles } from 'lucide-react'
import type * as React from 'react'

import { useHoverOpen } from '../../lib/use-hover-open'
import { cn } from '../../lib/utils'
import {
	type AiReasoning,
	AiReasoningDetails,
	hasReasoning,
	isLowConfidence,
	reasoningSentence,
} from './ai-reasoning'
import { Popover, PopoverContent, PopoverTrigger } from '../overlays/popover'

/*
 * AI が出した物は、どの画面でも同じ見た目（紫〜青のグラデーションと
 * きらめきの印）で出す。普通の検索結果や人が入れた値と見分けられるようにする。
 */

interface AiSuggestionProps {
	/** 見出し。既定は「AI のおすすめ」。 */
	title?: string
	/** 見出しの下の説明。何を基に選んだか、確かめてほしい点など。 */
	description?: React.ReactNode
	/** 候補の並び。画面ごとに渡す。 */
	children: React.ReactNode
	className?: string
}

/** AI が出した候補の囲み。グラデーションの枠と見出しを付ける。 */
function AiSuggestion({
	title = 'AI のおすすめ',
	description,
	children,
	className,
}: Readonly<AiSuggestionProps>) {
	return (
		<section
			aria-label={title}
			className={cn(
				'rounded-lg nui-ai-gradient p-px shadow-ai-2/20 dark:shadow-none shadow-sm',
				className,
			)}
		>
			<div className='overflow-hidden rounded-[7px] bg-background'>
				<div className='flex items-start gap-2 nui-ai-gradient-soft px-3 py-2'>
					<span className='mt-0.5 grid size-5 shrink-0 place-items-center rounded-full nui-ai-gradient text-white'>
						<Sparkles aria-hidden className='size-3' />
					</span>
					<div className='min-w-0'>
						<p className='font-semibold text-ai-foreground text-sm'>{title}</p>
						{description ? (
							<p className='text-muted-foreground text-xs'>{description}</p>
						) : null}
					</div>
				</div>
				{children}
			</div>
		</section>
	)
}

interface AiBestMatchBadgeProps {
	/** 印の文言。既定は「いちばん近い」。 */
	children?: React.ReactNode
	className?: string
}

/** AI の候補のうち、いちばん近いものに付ける印。 */
function AiBestMatchBadge({
	children = 'いちばん近い',
	className,
}: Readonly<AiBestMatchBadgeProps>) {
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center gap-0.5 rounded-full nui-ai-gradient px-1.5 py-px font-medium text-[10px] text-white',
				className,
			)}
		>
			<Sparkles aria-hidden className='size-2.5' />
			{children}
		</span>
	)
}

const aiLabelClass =
	'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-ai-border nui-ai-gradient-soft px-1.5 align-middle font-medium text-[10px] text-ai-foreground leading-4'

interface AiLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** 印の文言。既定は「AI」。例: 「AI の判定」「AI の推測」。 */
	children?: React.ReactNode
	/** 理由や判断の材料。渡すと、触れる・押すと中身が開く。 */
	reasoning?: AiReasoning
}

/**
 * 文の中や表のセルに置く小さな印。その値を AI が決めたこと・推し量ったことを
 * 示す。「AI の判定」「AI の推測」などを、どの画面でも同じ見た目で出す。
 */
function AiLabel({
	children = 'AI',
	reasoning,
	className,
	...props
}: AiLabelProps) {
	const { open, setOpen, hover } = useHoverOpen()
	const content = (
		<>
			<Sparkles aria-hidden className='size-2.5' />
			{children}
		</>
	)
	if (!hasReasoning(reasoning)) {
		return (
			<span className={cn(aiLabelClass, className)} {...props}>
				{content}
			</span>
		)
	}
	const title = typeof children === 'string' ? children : 'AI の推測'
	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				className={cn(
					aiLabelClass,
					'cursor-pointer transition-colors duration-fast hover:border-ai-2/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
					className,
				)}
				type='button'
				{...hover}
			>
				{content}
				<span className='sr-only'>
					（{reasoningSentence(reasoning)}詳しく見る）
				</span>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-72' {...hover}>
				<AiReasoningDetails reasoning={reasoning} title={title} />
			</PopoverContent>
		</Popover>
	)
}

interface AiValueProps {
	/** 値そのもの。例「渋谷店」。 */
	children: React.ReactNode
	/** 読み上げで伝える種類。既定は「AI の推測」。例「AI の判定」。 */
	kind?: string
	/** 理由や判断の材料。渡すと、触れる・押す・キーボードで中身が開く。 */
	reasoning?: AiReasoning
	className?: string
}

/**
 * 文の中に置く控えめな形。札は出さず、値そのものを紫の文字と点線の下線にし、
 * 後ろに小さなきらめきの絵を付ける。文の高さや行の間は変えない。
 * `reasoning` を渡すと、触れると理由や判断の材料が開く。確からしさが低いときは
 * 点線と絵が橙になる。
 */
function AiValue({
	children,
	kind = 'AI の推測',
	reasoning,
	className,
}: Readonly<AiValueProps>) {
	const { open, setOpen, hover } = useHoverOpen()
	const low = isLowConfidence(reasoning)
	const classes = cn(
		'text-ai-foreground underline decoration-dotted decoration-1 underline-offset-[3px]',
		low
			? 'decoration-amber-500 dark:decoration-amber-400'
			: 'decoration-ai-2/70',
		className,
	)
	const icon = (
		<Sparkles
			aria-hidden
			className={cn(
				'ml-0.5 inline size-[0.75em] align-baseline',
				low ? 'text-amber-600 dark:text-amber-400' : 'opacity-70',
			)}
		/>
	)

	if (!hasReasoning(reasoning)) {
		return (
			<span className={classes} title={kind}>
				{children}
				{icon}
				<span className='sr-only'>（{kind}）</span>
			</span>
		)
	}

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger
				className={cn(
					classes,
					'inline cursor-pointer rounded-sm bg-transparent p-0 text-left leading-[inherit] hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
				)}
				type='button'
				{...hover}
			>
				{children}
				{icon}
				<span className='sr-only'>
					（{kind}。{reasoningSentence(reasoning)}）
				</span>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-72' {...hover}>
				<AiReasoningDetails reasoning={reasoning} title={kind} />
			</PopoverContent>
		</Popover>
	)
}

export {
	AiBestMatchBadge,
	type AiBestMatchBadgeProps,
	AiLabel,
	type AiLabelProps,
	AiSuggestion,
	type AiSuggestionProps,
	AiValue,
	type AiValueProps,
}
