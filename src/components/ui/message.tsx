import type * as React from 'react'

import { cn } from '../../lib/utils'

/*
 * AI とのやりとりの 1 件分の並び。`align='end'` で右寄せ（自分の発言）になる。
 * shadcn の message を元に、native-ui のデザイントークンに合わせてある。
 */

/** 続けて並ぶ発言をまとめる。 */
function MessageGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-group'
			className={cn('flex min-w-0 flex-col gap-2', className)}
			{...props}
		/>
	)
}

interface MessageProps extends React.ComponentProps<'div'> {
	/** `start` は左寄せ（相手・AI）、`end` は右寄せ（自分）。 */
	align?: 'start' | 'end'
}

function Message({ className, align = 'start', ...props }: MessageProps) {
	return (
		<div
			data-slot='message'
			data-align={align}
			className={cn(
				'group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse',
				className,
			)}
			{...props}
		/>
	)
}

/** 発言者の顔や頭文字。 */
function MessageAvatar({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-avatar'
			className={cn(
				'flex size-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-muted text-muted-foreground text-xs group-has-[[data-slot=message-footer]]/message:-translate-y-6',
				className,
			)}
			{...props}
		/>
	)
}

/** 本文。吹き出しや経過の表示を縦に並べる。 */
function MessageContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-content'
			className={cn(
				'flex w-full min-w-0 flex-col gap-2.5 break-words group-data-[align=end]/message:[&>[data-slot]]:self-end',
				className,
			)}
			{...props}
		/>
	)
}

/** 本文の上の小さな行（名前・時刻など）。 */
function MessageHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-header'
			className={cn(
				'flex min-w-0 max-w-full items-center px-3 font-medium text-muted-foreground text-xs group-has-[[data-variant=ghost]]/message:px-0',
				className,
			)}
			{...props}
		/>
	)
}

/** 本文の下の小さな行（送った時刻・既読など）。 */
function MessageFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-footer'
			className={cn(
				'flex min-w-0 max-w-full items-center px-3 font-medium text-muted-foreground text-xs group-has-[[data-variant=ghost]]/message:px-0 group-data-[align=end]/message:justify-end',
				className,
			)}
			{...props}
		/>
	)
}

export {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageGroup,
	MessageHeader,
	type MessageProps,
}
