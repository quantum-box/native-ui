import { Sparkles } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'

/*
 * 会話の始め。まだ何も話していない間の案内と、すぐ選べる問いの候補（チップ）。
 */

/** 問いの候補 1 つ。 */
interface PromptSuggestion {
	/** チップに出す短い言葉。 */
	label: React.ReactNode
	/** 選んだときに送る（または欄に入れる）問い。既定は label が文字ならそれ。 */
	prompt?: string
	/** 左に添える絵。 */
	icon?: React.ReactNode
}

interface PromptSuggestionsProps {
	suggestions: PromptSuggestion[]
	/** 選んだとき。送るか欄に入れるかは使う側が決める。 */
	onSelect: (prompt: string, suggestion: PromptSuggestion) => void
	/** 押せないとき（答えを待っている間など）。 */
	disabled?: boolean
	/** 読み上げの名前。 */
	label?: string
	className?: string
}

/** すぐ選べる問いの候補。丸いチップを横に並べ、はみ出したら折り返す。 */
function PromptSuggestions({
	suggestions,
	onSelect,
	disabled = false,
	label = '問いの候補',
	className,
}: Readonly<PromptSuggestionsProps>) {
	if (suggestions.length === 0) return null
	return (
		<ul aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
			{suggestions.map((suggestion, index) => {
				const prompt =
					suggestion.prompt ??
					(typeof suggestion.label === 'string' ? suggestion.label : '')
				return (
					<li key={index}>
						<button
							className='inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-left text-foreground text-xs transition-colors duration-fast hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'
							disabled={disabled || !prompt}
							onClick={() => onSelect(prompt, suggestion)}
							type='button'
						>
							{suggestion.icon}
							<span className='truncate'>{suggestion.label}</span>
						</button>
					</li>
				)
			})}
		</ul>
	)
}

interface ChatEmptyStateProps {
	/** 見出し。例「何をお手伝いしましょう」。 */
	title?: React.ReactNode
	/** 何を聞けるかの説明。 */
	description?: React.ReactNode
	/** 上に出す絵。既定はきらめき。 */
	icon?: React.ReactNode
	/** 問いの候補。onSelect と一緒に渡す。 */
	suggestions?: PromptSuggestion[]
	onSelect?: (prompt: string, suggestion: PromptSuggestion) => void
	/** 下に足す物。 */
	children?: React.ReactNode
	className?: string
}

/** まだ何も話していない会話の案内。 */
function ChatEmptyState({
	title = '何をお手伝いしましょう',
	description,
	icon,
	suggestions = [],
	onSelect,
	children,
	className,
}: Readonly<ChatEmptyStateProps>) {
	return (
		<div
			className={cn(
				'mx-auto grid w-full max-w-lg justify-items-center gap-3 px-4 py-8 text-center',
				className,
			)}
		>
			<span className='grid size-10 place-items-center rounded-full nui-ai-gradient text-white [&_svg]:size-5'>
				{icon ?? <Sparkles aria-hidden />}
			</span>
			<div className='grid gap-1'>
				<p className='font-semibold text-base'>{title}</p>
				{description ? (
					<p className='text-muted-foreground text-sm'>{description}</p>
				) : null}
			</div>
			{onSelect && suggestions.length ? (
				<PromptSuggestions
					className='justify-center'
					onSelect={onSelect}
					suggestions={suggestions}
				/>
			) : null}
			{children}
		</div>
	)
}

export {
	ChatEmptyState,
	type ChatEmptyStateProps,
	type PromptSuggestion,
	PromptSuggestions,
	type PromptSuggestionsProps,
}
