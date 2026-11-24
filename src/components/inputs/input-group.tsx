'use client'

import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { Slot } from '../../lib/slot'
import { cn } from '../../lib/utils'
import { Button, type ButtonProps } from '../basics/button'
import { Input, type InputProps } from './input'
import { Textarea, type TextareaProps } from './textarea'

/*
 * 入力欄に、ボタンや印や文字を付ける囲み。
 * 使い方は shadcn の InputGroup と同じ（InputGroupAddon の align='block-end' など）。
 * 中は native-ui の Button・Input・Textarea で、密度と色は Input にそろえる。
 *
 * <InputGroup>
 *   <InputGroupTextarea placeholder='質問' />
 *   <InputGroupAddon align='block-end'>
 *     <InputGroupButton size='icon-xs' aria-label='送る'><ArrowUp /></InputGroupButton>
 *   </InputGroupAddon>
 * </InputGroup>
 *
 * - 枠と輪は囲みが持つ。中の欄にフォーカスがあると輪が出て、aria-invalid なら赤くなる。
 * - align が block-start・block-end の物があると、縦に並ぶ（欄の上や下に帯が付く）。
 */

export interface InputGroupProps extends React.HTMLAttributes<HTMLElement> {
	/**
	 * true なら、子の要素（form など）を囲みとして使う。
	 * 送る欄のように、囲みそのものを <form> にしたいときに使う
	 */
	asChild?: boolean
}

const InputGroup = React.forwardRef<HTMLDivElement, InputGroupProps>(
	({ className, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'div'
		return (
			<Comp
				ref={ref}
				data-slot='input-group'
				// 子の要素を使うときは、その要素の役割（form など）をそのまま残す
				role={asChild ? undefined : 'group'}
				className={cn(
					'group/input-group relative flex h-7 w-full min-w-0 items-center rounded-md border border-input bg-background text-sm text-foreground transition-colors duration-fast',
					// 中の欄にフォーカスがあるとき
					'has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-2 has-[[data-slot=input-group-control]:focus-visible]:ring-ring/25',
					// 誤り
					'has-[[data-slot=input-group-control][aria-invalid=true]]:border-destructive has-[[data-slot=input-group-control][aria-invalid=true]]:ring-destructive/25',
					// 無効
					'has-[[data-slot=input-group-control]:disabled]:opacity-50',
					// 読むだけ
					'has-[[data-slot=input-group-control]:read-only]:bg-surface',
					// 上や下に帯があるとき・長い文の欄のときは、縦に並べて高さを中身に任せる
					'has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:items-stretch has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:items-stretch has-[>textarea]:h-auto',
					// 横に付く物がある側は、欄の余白を詰める
					'has-[>[data-align=inline-end]]:[&>input]:pr-1 has-[>[data-align=inline-start]]:[&>input]:pl-1',
					className,
				)}
				{...props}
			/>
		)
	},
)
InputGroup.displayName = 'InputGroup'

const inputGroupAddonVariants = cva(
	"flex h-auto cursor-text select-none items-center justify-center gap-1.5 text-muted-foreground text-sm [&>kbd]:rounded-sm [&>svg:not([class*='size-'])]:size-3.5",
	{
		variants: {
			align: {
				'inline-start':
					'order-first pl-2 has-[>button]:ml-[-0.25rem] has-[>kbd]:ml-[-0.15rem]',
				'inline-end':
					'order-last pr-2 has-[>button]:mr-[-0.25rem] has-[>kbd]:mr-[-0.15rem]',
				'block-start':
					'order-first w-full justify-start px-2 pt-1.5 [.border-b]:pb-1.5',
				'block-end':
					'order-last w-full justify-start px-2 pb-1.5 [.border-t]:pt-1.5',
			},
		},
		defaultVariants: {
			align: 'inline-start',
		},
	},
)

export interface InputGroupAddonProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof inputGroupAddonVariants> {}

/** 欄に付ける印・文字・ボタンの置き場。押すと（ボタン以外なら）中の欄にフォーカスが移る */
const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
	({ className, align = 'inline-start', onClick, ...props }, ref) => (
		<div
			ref={ref}
			role='group'
			data-slot='input-group-addon'
			data-align={align}
			className={cn(inputGroupAddonVariants({ align }), className)}
			onClick={event => {
				onClick?.(event)
				if (event.defaultPrevented) return
				const target = event.target as HTMLElement
				if (target.closest('button, a, input, textarea, select, label')) return
				event.currentTarget.parentElement
					?.querySelector<HTMLElement>('[data-slot=input-group-control]')
					?.focus()
			}}
			{...props}
		/>
	),
)
InputGroupAddon.displayName = 'InputGroupAddon'

const inputGroupButtonSizes = {
	xs: 'h-6 gap-1 rounded-sm px-1.5 text-xs',
	sm: 'h-7 px-2',
	'icon-xs': 'size-6 rounded-sm p-0',
	'icon-sm': 'size-7 p-0',
} as const

export interface InputGroupButtonProps
	extends Omit<ButtonProps, 'size' | 'variant' | 'type'> {
	/** xs（既定）・sm・icon-xs・icon-sm */
	size?: keyof typeof inputGroupButtonSizes
	/**
	 * native-ui の Button の種類。shadcn の書き方の default（= primary）と
	 * outline（= secondary）も受け取る。既定は ghost
	 */
	variant?: ButtonProps['variant'] | 'default' | 'outline'
	type?: 'button' | 'submit' | 'reset'
}

const toButtonVariant = (
	variant: InputGroupButtonProps['variant'],
): ButtonProps['variant'] =>
	variant === 'default'
		? 'primary'
		: variant === 'outline'
			? 'secondary'
			: variant

/** 欄に付けるボタン。中身は native-ui の Button */
const InputGroupButton = React.forwardRef<
	HTMLButtonElement,
	InputGroupButtonProps
>(
	(
		{ className, type = 'button', variant = 'ghost', size = 'xs', ...props },
		ref,
	) => (
		<Button
			ref={ref}
			type={type}
			data-size={size}
			variant={toButtonVariant(variant)}
			size={size === 'xs' ? 'sm' : 'md'}
			className={cn(
				'shadow-none [&_svg]:size-3.5',
				inputGroupButtonSizes[size],
				className,
			)}
			{...props}
		/>
	),
)
InputGroupButton.displayName = 'InputGroupButton'

/** 欄に付ける文字（単位や前置きなど） */
const InputGroupText = React.forwardRef<
	HTMLSpanElement,
	React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
	<span
		ref={ref}
		className={cn(
			"flex items-center gap-1.5 text-muted-foreground text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-3.5",
			className,
		)}
		{...props}
	/>
))
InputGroupText.displayName = 'InputGroupText'

/** 囲みの中の 1 行の欄。中身は native-ui の Input（枠と輪は囲みが持つ） */
const InputGroupInput = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, ...props }, ref) => (
		<Input
			ref={ref}
			data-slot='input-group-control'
			className={cn(
				'h-full min-w-0 flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 read-only:bg-transparent',
				className,
			)}
			{...props}
		/>
	),
)
InputGroupInput.displayName = 'InputGroupInput'

/** 囲みの中の長い文の欄。中身は native-ui の Textarea（枠と輪は囲みが持つ） */
const InputGroupTextarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	({ className, minRows, rows, ...props }, ref) => (
		<Textarea
			ref={ref}
			data-slot='input-group-control'
			rows={rows}
			// 囲みの中は、何も渡されなければ 2 行から。rows を渡せばそれが最小
			minRows={minRows ?? (rows === undefined ? 2 : undefined)}
			className={cn(
				'flex-auto resize-none rounded-none border-0 bg-transparent px-2 py-1.5 shadow-none focus-visible:ring-0 read-only:bg-transparent',
				className,
			)}
			{...props}
		/>
	),
)
InputGroupTextarea.displayName = 'InputGroupTextarea'

export {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupText,
	InputGroupInput,
	InputGroupTextarea,
}
