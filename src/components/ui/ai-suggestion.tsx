import { Sparkles } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'

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
				'rounded-lg bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500 p-px shadow-fuchsia-500/20 shadow-sm',
				className,
			)}
		>
			<div className='overflow-hidden rounded-[7px] bg-background'>
				<div className='flex items-start gap-2 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-sky-500/10 px-3 py-2'>
					<span className='mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white'>
						<Sparkles aria-hidden className='size-3' />
					</span>
					<div className='min-w-0'>
						<p className='bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-600 bg-clip-text font-semibold text-sm text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-sky-300'>
							{title}
						</p>
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
				'inline-flex shrink-0 items-center gap-0.5 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-1.5 py-px font-medium text-[10px] text-white',
				className,
			)}
		>
			<Sparkles aria-hidden className='size-2.5' />
			{children}
		</span>
	)
}

interface AiLabelProps extends React.HTMLAttributes<HTMLSpanElement> {
	/** 印の文言。既定は「AI」。例: 「AI の判定」「AI の推測」。 */
	children?: React.ReactNode
}

/**
 * 文の中や表のセルに置く小さな印。その値を AI が決めたこと・推し量ったことを
 * 示す。「AI の判定」「AI の推測」などを、どの画面でも同じ見た目で出す。
 */
function AiLabel({ children = 'AI', className, ...props }: AiLabelProps) {
	return (
		<span
			className={cn(
				'inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border border-fuchsia-500/30 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-sky-500/10 px-1.5 align-middle font-medium text-[10px] text-fuchsia-700 leading-4 dark:border-fuchsia-400/30 dark:text-fuchsia-300',
				className,
			)}
			{...props}
		>
			<Sparkles aria-hidden className='size-2.5' />
			{children}
		</span>
	)
}

export {
	AiBestMatchBadge,
	type AiBestMatchBadgeProps,
	AiLabel,
	type AiLabelProps,
	AiSuggestion,
	type AiSuggestionProps,
}
