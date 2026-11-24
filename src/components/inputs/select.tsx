'use client'

import { Select as SelectPrimitive } from '@base-ui/react/select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import * as React from 'react'
import { createPortal } from 'react-dom'

import {
	type PositionProps,
	compatRender,
	openState,
	positionerCompat,
	radixCssVars,
} from '../../lib/overlay'
import { cn } from '../../lib/utils'

// 中身は base-ui の Select。使い方（value・onValueChange・SelectValue の placeholder・
// position・data-state）は Radix のときと同じ。
//
// Radix は、閉じているあいだも項目を見えない所に描いて、選んだ項目の文字を
// SelectValue に出す。ここでも同じく、閉じているあいだは項目を DOM の外
// （DocumentFragment）に描き、値ごとの文字を覚えておく。

interface SelectCompat {
	open: boolean
	/** 一覧を描いておくときは true（開いている間と、閉じる動きが終わるまで） */
	present: boolean
	labels: Map<string, React.ReactNode>
	register: (value: string, label: React.ReactNode) => void
}
const SelectCompatContext = React.createContext<SelectCompat | null>(null)
/** 閉じているあいだに、項目の文字だけを集めるときは true */
const CollectContext = React.createContext(false)

export interface SelectProps {
	value?: string
	defaultValue?: string
	onValueChange?(value: string): void
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	disabled?: boolean
	required?: boolean
	name?: string
	autoComplete?: string
	form?: string
	dir?: 'ltr' | 'rtl'
	children?: React.ReactNode
}

/** Radix と同じく、空の文字は「選んでいない」 */
const toBase = (value: string | undefined) =>
	value === undefined ? undefined : value === '' ? null : value

function Select({
	value,
	defaultValue,
	onValueChange,
	open,
	defaultOpen,
	onOpenChange,
	dir: _dir,
	children,
	...props
}: SelectProps) {
	const [innerOpen, setInnerOpen] = React.useState(defaultOpen ?? false)
	const isOpen = open ?? innerOpen
	// base-ui は一度開いた一覧を、閉じたあとも見えない形で DOM に残す。
	// 残った一覧を画面の読み上げや検索が拾ってしまうので、閉じる動きが
	// 終わったら一覧ごと外す。開いたら、その描画のうちに描き直す
	const [present, setPresent] = React.useState(isOpen)
	if (isOpen && !present) setPresent(true)
	const [labels, setLabels] = React.useState(
		() => new Map<string, React.ReactNode>(),
	)
	const register = React.useCallback(
		(itemValue: string, label: React.ReactNode) => {
			setLabels(prev => {
				if (prev.get(itemValue) === label) return prev
				const next = new Map(prev)
				next.set(itemValue, label)
				return next
			})
		},
		[],
	)
	const compat = React.useMemo(
		() => ({ open: isOpen, present: isOpen || present, labels, register }),
		[isOpen, present, labels, register],
	)
	return (
		<SelectPrimitive.Root
			value={toBase(value)}
			defaultValue={toBase(defaultValue)}
			onValueChange={(next: string | null) => onValueChange?.(next ?? '')}
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={(next: boolean) => {
				setInnerOpen(next)
				onOpenChange?.(next)
			}}
			onOpenChangeComplete={(next: boolean) => {
				if (!next) setPresent(false)
			}}
			{...props}
		>
			<SelectCompatContext.Provider value={compat}>
				{children}
			</SelectCompatContext.Provider>
		</SelectPrimitive.Root>
	)
}

const SelectGroupContext = React.createContext(false)

const SelectGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
	if (React.useContext(CollectContext)) return <>{children}</>
	return (
		<SelectPrimitive.Group ref={ref} {...props}>
			<SelectGroupContext.Provider value>
				{children}
			</SelectGroupContext.Provider>
		</SelectPrimitive.Group>
	)
})
SelectGroup.displayName = 'SelectGroup'

export interface SelectValueProps
	extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
	/** 選んでいないときに出す文字 */
	placeholder?: React.ReactNode
	/** 渡せば、選んだ項目の文字の代わりにこれを出す */
	children?: React.ReactNode
}

const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
	({ placeholder, children, style, ...props }, ref) => {
		const compat = React.useContext(SelectCompatContext)
		return (
			<SelectPrimitive.Value
				ref={ref}
				style={{ pointerEvents: 'none', ...style }}
				{...props}
			>
				{(current: string | null) =>
					current === null || current === undefined
						? placeholder
						: (children ?? compat?.labels.get(current) ?? null)
				}
			</SelectPrimitive.Value>
		)
	},
)
SelectValue.displayName = 'SelectValue'

const SelectTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => (
	<SelectPrimitive.Trigger
		ref={ref}
		className={cn(
			'flex h-7 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors duration-fast placeholder:text-subtle-foreground hover:bg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className,
		)}
		render={compatRender(
			'button',
			asChild,
			children,
			(state: { open: boolean; placeholder: boolean; disabled?: boolean }) => ({
				...openState(state),
				'data-placeholder': state.placeholder ? '' : undefined,
				'data-disabled': state.disabled ? '' : undefined,
			}),
		)}
		{...props}
	>
		{asChild ? undefined : (
			<>
				{children}
				<ChevronDown
					aria-hidden
					className='size-3.5 shrink-0 text-subtle-foreground'
				/>
			</>
		)}
	</SelectPrimitive.Trigger>
))
SelectTrigger.displayName = 'SelectTrigger'

const SelectScrollUpButton = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollUpArrow
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className,
		)}
		{...props}
	>
		<ChevronUp className='size-3.5' />
	</SelectPrimitive.ScrollUpArrow>
))
SelectScrollUpButton.displayName = 'SelectScrollUpButton'

const SelectScrollDownButton = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<SelectPrimitive.ScrollDownArrow
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className,
		)}
		{...props}
	>
		<ChevronDown className='size-3.5' />
	</SelectPrimitive.ScrollDownArrow>
))
SelectScrollDownButton.displayName = 'SelectScrollDownButton'

/** 閉じているあいだ、項目を DOM の外に描いて文字を集める（Radix と同じやり方） */
function SelectCollector({ children }: { children?: React.ReactNode }) {
	// Radix と同じく、描いた後（ブラウザの中）で初めて DOM の外の入れ物を作る。
	// はじめの描画ではポータルを出さないので、サーバーや renderToStaticMarkup でも描ける
	const [fragment, setFragment] = React.useState<DocumentFragment | null>(null)
	React.useEffect(() => {
		setFragment(document.createDocumentFragment())
	}, [])
	if (!fragment) return null
	return createPortal(
		<CollectContext.Provider value>
			<div>{children}</div>
		</CollectContext.Provider>,
		fragment,
	)
}

export interface SelectContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		PositionProps {
	/** popper（既定）: Trigger の下に出す。item-aligned: 選んだ項目を Trigger に重ねる */
	position?: 'popper' | 'item-aligned'
}

const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
	(
		{
			className,
			children,
			position = 'popper',
			style,
			side,
			sideOffset,
			align = 'start',
			alignOffset,
			avoidCollisions,
			collisionBoundary,
			collisionPadding = 10,
			sticky,
			hideWhenDetached,
			...props
		},
		ref,
	) => {
		const compat = React.useContext(SelectCompatContext)
		return (
			<>
				{compat && !compat.open ? (
					<SelectCollector>{children}</SelectCollector>
				) : null}
				{compat && !compat.present ? null : (
					<SelectPrimitive.Portal>
						<SelectPrimitive.Positioner
							alignItemWithTrigger={position === 'item-aligned'}
							className={cn(
								'z-50',
								hideWhenDetached && 'data-[anchor-hidden]:invisible',
							)}
							{...positionerCompat({
								side,
								sideOffset,
								align,
								alignOffset,
								avoidCollisions,
								collisionBoundary,
								collisionPadding,
								sticky,
							})}
						>
							<SelectPrimitive.Popup
								ref={ref}
								className={cn(
									'relative z-50 flex max-h-96 min-w-[8rem] flex-col overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
									position === 'popper' &&
										'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
									className,
								)}
								style={{ ...radixCssVars('select'), ...style }}
								render={compatRender('div', false, null, openState)}
								{...props}
							>
								<SelectScrollUpButton />
								<SelectPrimitive.List
									// Radix の Viewport と同じ並べ方（スクロールの線は出さない）
									style={{
										position: 'relative',
										flex: 1,
										overflow: 'hidden auto',
									}}
									className={cn(
										'p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
										position === 'popper' &&
											'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]',
									)}
								>
									{children}
								</SelectPrimitive.List>
								<SelectScrollDownButton />
							</SelectPrimitive.Popup>
						</SelectPrimitive.Positioner>
					</SelectPrimitive.Portal>
				)}
			</>
		)
	},
)
SelectContent.displayName = 'SelectContent'

const labelClass =
	'px-2 py-1.5 text-2xs font-medium uppercase tracking-wider text-subtle-foreground'

const SelectLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const inGroup = React.useContext(SelectGroupContext)
	if (React.useContext(CollectContext)) return null
	if (!inGroup)
		return <div ref={ref} className={cn(labelClass, className)} {...props} />
	return (
		<SelectPrimitive.GroupLabel
			ref={ref}
			className={cn(labelClass, className)}
			{...props}
		/>
	)
})
SelectLabel.displayName = 'SelectLabel'

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
	value: string
	disabled?: boolean
	/** 頭の文字で探すときの文字 */
	textValue?: string
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
	({ className, children, value, textValue, ...props }, ref) => {
		const compat = React.useContext(SelectCompatContext)
		const collecting = React.useContext(CollectContext)
		const register = compat?.register
		// 覚えた文字は消さない（閉じている時の項目と開いた時の項目が入れ替わる間も、
		// SelectValue に文字を出し続けるため）。新しく描かれたら上書きする
		React.useLayoutEffect(() => {
			register?.(value, children)
		}, [register, value, children])
		if (collecting) return null
		return (
			<SelectPrimitive.Item
				ref={ref}
				value={value}
				label={textValue}
				className={cn(
					'relative flex h-7 w-full cursor-default select-none items-center rounded-sm pl-7 pr-2 text-sm outline-none transition-colors duration-fast focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
					className,
				)}
				render={compatRender(
					'div',
					false,
					null,
					(state: { selected: boolean }) => ({
						'data-state': state.selected ? 'checked' : 'unchecked',
					}),
				)}
				{...props}
			>
				<span className='absolute left-2 flex size-3.5 items-center justify-center'>
					<SelectPrimitive.ItemIndicator>
						<Check className='size-3.5' />
					</SelectPrimitive.ItemIndicator>
				</span>

				<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
			</SelectPrimitive.Item>
		)
	},
)
SelectItem.displayName = 'SelectItem'

const SelectSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	if (React.useContext(CollectContext)) return null
	return (
		<SelectPrimitive.Separator
			ref={ref}
			className={cn('-mx-1 my-1 h-px bg-border', className)}
			{...props}
		/>
	)
})
SelectSeparator.displayName = 'SelectSeparator'

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
}
