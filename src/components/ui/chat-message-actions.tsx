'use client'

import { Pencil, RefreshCw, ThumbsDown, ThumbsUp } from 'lucide-react'
import type * as React from 'react'

import { cn } from '../../lib/utils'
import { Button } from './button'
import { CopyButton } from './chat-copy'

/*
 * 発言 1 件ごとの操作。コピー・もう一度作る・よい/よくない・直して送り直す。
 * 渡した操作だけを出す。マウスを乗せたときだけ見せたいときは、発言の側で
 * `group/message` と `opacity-0 group-hover/message:opacity-100` などを使う。
 */

type MessageFeedback = 'good' | 'bad' | null

interface MessageActionsProps {
	/** 渡すとコピーのボタンが出る。 */
	copyText?: string | (() => string)
	/** 渡すと「もう一度作る」が出る。 */
	onRegenerate?: () => void
	/** 今の評価。onFeedback と一緒に渡す。 */
	feedback?: MessageFeedback
	/** 渡すと「よい」「よくない」が出る。同じ物をもう一度押すと null で呼ぶ。 */
	onFeedback?: (feedback: MessageFeedback) => void
	/** 渡すと「直して送り直す」が出る。自分の発言に付ける。 */
	onEdit?: () => void
	/** 送っている途中などで押せないとき。 */
	disabled?: boolean
	/** 右に足す物。 */
	children?: React.ReactNode
	className?: string
}

function IconButton({
	label,
	pressed,
	children,
	...props
}: Readonly<
	{
		label: string
		pressed?: boolean
		children: React.ReactNode
	} & Omit<React.ComponentProps<typeof Button>, 'children'>
>) {
	return (
		<Button
			aria-label={label}
			aria-pressed={pressed}
			className={cn('w-6 px-0', pressed && 'bg-selected text-primary')}
			size='sm'
			title={label}
			type='button'
			variant='ghost'
			{...props}
		>
			{children}
		</Button>
	)
}

/** 発言 1 件ごとの操作の並び。 */
function MessageActions({
	copyText,
	onRegenerate,
	feedback = null,
	onFeedback,
	onEdit,
	disabled = false,
	children,
	className,
}: Readonly<MessageActionsProps>) {
	return (
		<div
			aria-label='この発言の操作'
			className={cn('flex items-center gap-0.5', className)}
			role='toolbar'
		>
			{copyText !== undefined ? (
				<CopyButton disabled={disabled} text={copyText} />
			) : null}
			{onRegenerate ? (
				<IconButton
					disabled={disabled}
					label='もう一度作る'
					onClick={onRegenerate}
				>
					<RefreshCw aria-hidden />
				</IconButton>
			) : null}
			{onFeedback ? (
				<>
					<IconButton
						disabled={disabled}
						label='よい'
						onClick={() => onFeedback(feedback === 'good' ? null : 'good')}
						pressed={feedback === 'good'}
					>
						<ThumbsUp aria-hidden />
					</IconButton>
					<IconButton
						disabled={disabled}
						label='よくない'
						onClick={() => onFeedback(feedback === 'bad' ? null : 'bad')}
						pressed={feedback === 'bad'}
					>
						<ThumbsDown aria-hidden />
					</IconButton>
				</>
			) : null}
			{onEdit ? (
				<IconButton disabled={disabled} label='直して送り直す' onClick={onEdit}>
					<Pencil aria-hidden />
				</IconButton>
			) : null}
			{children}
		</div>
	)
}

export { MessageActions, type MessageActionsProps, type MessageFeedback }
