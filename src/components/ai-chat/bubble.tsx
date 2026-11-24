import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

/*
 * 発言の吹き出し。`Bubble` が色と寄せ方を決め、`BubbleContent` が中身の箱になる。
 * shadcn の bubble を元に、色を native-ui のデザイントークンに合わせてある。
 */

/** 続けて並ぶ吹き出しをまとめる。 */
function BubbleGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='bubble-group'
			className={cn('flex min-w-0 flex-col gap-2', className)}
			{...props}
		/>
	)
}

const bubbleVariants = cva(
	'group/bubble relative flex w-fit min-w-0 max-w-[80%] flex-col gap-1 data-[align=end]:self-end data-[variant=ghost]:max-w-full group-data-[align=end]/message:self-end',
	{
		variants: {
			variant: {
				default:
					'[&>[data-slot=bubble-content]]:bg-primary [&>[data-slot=bubble-content]]:text-primary-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-primary/90',
				secondary:
					'[&>[data-slot=bubble-content]]:border-border [&>[data-slot=bubble-content]]:bg-surface [&>[data-slot=bubble-content]]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted',
				muted:
					'[&>[data-slot=bubble-content]]:bg-muted [&>[data-slot=bubble-content]]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted/70',
				tinted:
					'[&>[data-slot=bubble-content]]:bg-selected [&>[data-slot=bubble-content]]:text-foreground [&>[data-slot=bubble-content]:is(button,a):hover]:bg-selected/80',
				outline:
					'[&>[data-slot=bubble-content]]:border-border [&>[data-slot=bubble-content]]:bg-background [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted',
				ghost:
					'[&>[data-slot=bubble-content]]:rounded-none [&>[data-slot=bubble-content]]:bg-transparent [&>[data-slot=bubble-content]]:p-0 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-muted',
				destructive:
					'[&>[data-slot=bubble-content]]:bg-destructive/10 [&>[data-slot=bubble-content]]:text-destructive dark:[&>[data-slot=bubble-content]]:bg-destructive/20 [&>[data-slot=bubble-content]:is(button,a):hover]:bg-destructive/20',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
)

interface BubbleProps
	extends React.ComponentProps<'div'>,
		VariantProps<typeof bubbleVariants> {
	/**
					'start' は左寄せ、`end` は右寄せ。`Message align='end'` の中では自動で右寄せ。 */
	align?: 'start' | 'end'
}

function Bubble({
	variant = 'default',
	align = 'start',
	className,
	...props
}: BubbleProps) {
	return (
		<div
			data-slot='bubble'
			data-variant={variant}
			data-align={align}
			className={cn(bubbleVariants({ variant }), className)}
			{...props}
		/>
	)
}

interface BubbleContentProps extends React.HTMLAttributes<HTMLElement> {
	/**
					'true' のとき、子の要素（ボタンやリンク）を吹き出しの箱として使う。 */
	asChild?: boolean
}

/** 吹き出しの中身の箱。押せる吹き出しにするときは
					'asChild' でボタンやリンクを渡す。 */
const BubbleContent = React.forwardRef<HTMLDivElement, BubbleContentProps>(
	({ className, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'div'
		return (
			<Comp
				ref={ref}
				data-slot='bubble-content'
				className={cn(
					'w-fit min-w-0 max-w-full overflow-hidden break-words rounded-xl border border-transparent px-3 py-2 text-sm leading-relaxed outline-none transition-colors duration-fast focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 group-data-[align=end]/bubble:self-end [&:is(button)]:text-left',
					className,
				)}
				{...props}
			/>
		)
	},
)
BubbleContent.displayName = 'BubbleContent'

const bubbleReactionsVariants = cva(
	'absolute z-10 flex w-fit shrink-0 items-center justify-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-sm ring-[3px] ring-background has-[button]:p-0',
	{
		variants: {
			side: {
				top: 'top-0 -translate-y-3/4',
				bottom: 'bottom-0 translate-y-3/4',
			},
			align: {
				start: 'left-3',
				end: 'right-3',
			},
		},
		defaultVariants: {
			side: 'bottom',
			align: 'end',
		},
	},
)

interface BubbleReactionsProps extends React.ComponentProps<'div'> {
	align?: 'start' | 'end'
	side?: 'top' | 'bottom'
}

/** 吹き出しの角に重ねる小さな反応（絵文字など）。 */
function BubbleReactions({
	side = 'bottom',
	align = 'end',
	className,
	...props
}: BubbleReactionsProps) {
	return (
		<div
			data-slot='bubble-reactions'
			data-align={align}
			data-side={side}
			className={cn(bubbleReactionsVariants({ side, align }), className)}
			{...props}
		/>
	)
}

export {
	Bubble,
	BubbleContent,
	type BubbleContentProps,
	BubbleGroup,
	type BubbleProps,
	BubbleReactions,
	type BubbleReactionsProps,
	bubbleVariants,
}
