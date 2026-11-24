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
	/** 閉じているあいだの項目の写しを置く入れ物（頭の文字で選ぶときに読む） */
	collectorRef: React.MutableRefObject<DocumentFragment | null>
	/** 閉じたままの Trigger で打った文字。選んだら true */
	typeahead: (key: string) => boolean
	/** 頭の文字を打っている途中なら true（空白を文字として扱う） */
	typing: () => boolean
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

/** 閉じてから、一覧を必ず外すまでの時間（閉じる動きよりずっと長く取る） */
const CLOSE_FALLBACK_MS = 1000

/** 打った文字を、続けて打った物として扱う時間（Radix と同じ 1 秒） */
const TYPEAHEAD_RESET_MS = 1000

/**
 * Radix と同じやり方で、打った文字に合う次の項目を探す。
 * - 同じ文字を続けて打つと（"aaa"）、その文字で始まる項目を順に回る
 * - 今の項目から先を探し、端まで来たら頭へ戻る
 */
export function nextTypeaheadMatch(
	items: { value: string; text: string }[],
	search: string,
	current: string | undefined,
) {
	const repeated =
		search.length > 1 && Array.from(search).every(char => char === search[0])
	const normalized = (repeated ? search[0] : search)?.toLowerCase() ?? ''
	const currentIndex = items.findIndex(item => item.value === current)
	const start = Math.max(currentIndex, 0)
	let wrapped = [...items.slice(start), ...items.slice(0, start)]
	if (normalized.length === 1)
		wrapped = wrapped.filter(item => item.value !== current)
	const next = wrapped.find(item =>
		item.text.trim().toLowerCase().startsWith(normalized),
	)
	return next && next.value !== current ? next.value : undefined
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
	// 閉じたままの Trigger で頭の文字を打って選べるよう、値はいつもここで持つ
	// （外で持つ形なら、外の値に従う）
	const [innerValue, setInnerValue] = React.useState(defaultValue ?? '')
	const currentValue = value ?? innerValue
	const changeValue = React.useCallback(
		(next: string) => {
			setInnerValue(next)
			onValueChange?.(next)
		},
		[onValueChange],
	)
	// base-ui は一度開いた一覧を、閉じたあとも見えない形で DOM に残す。
	// 残った一覧を画面の読み上げや検索が拾ってしまうので、閉じる動きが
	// 終わったら一覧ごと外す。開いたら、その描画のうちに描き直す
	const [present, setPresent] = React.useState(isOpen)
	if (isOpen && !present) setPresent(true)
	// 閉じる動きの終わりが伝わらないときの逃げ道。閉じてから一定の時間が経ったら外す
	React.useEffect(() => {
		if (isOpen || !present) return
		const timer = window.setTimeout(() => setPresent(false), CLOSE_FALLBACK_MS)
		return () => window.clearTimeout(timer)
	}, [isOpen, present])
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
	// 閉じたままの Trigger で打った文字から、次の項目を選ぶ（Radix と同じ動き）。
	// base-ui は閉じた一覧が DOM に無いと探せないので、閉じているあいだの写しから探す
	const collectorRef = React.useRef<DocumentFragment | null>(null)
	const search = React.useRef({ text: '', timer: 0 })
	const valueRef = React.useRef(currentValue)
	valueRef.current = currentValue
	const typeahead = React.useCallback(
		(key: string) => {
			const fragment = collectorRef.current
			if (!fragment) return false
			window.clearTimeout(search.current.timer)
			search.current.text += key
			search.current.timer = window.setTimeout(() => {
				search.current.text = ''
			}, TYPEAHEAD_RESET_MS)
			const items = Array.from(
				fragment.querySelectorAll<HTMLElement>('[data-select-item]'),
			)
				.filter(el => !el.hasAttribute('data-disabled'))
				.map(el => ({
					value: el.dataset.selectItem ?? '',
					text: el.textContent ?? '',
				}))
			const next = nextTypeaheadMatch(
				items,
				search.current.text,
				valueRef.current || undefined,
			)
			if (next === undefined) return false
			changeValue(next)
			return true
		},
		[changeValue],
	)
	/** 打ち始めの空白は「開く」。打っている途中の空白は文字として扱う */
	const typing = React.useCallback(() => search.current.text !== '', [])
	React.useEffect(() => () => window.clearTimeout(search.current.timer), [])
	const compat = React.useMemo(
		() => ({
			open: isOpen,
			present: isOpen || present,
			labels,
			register,
			collectorRef,
			typeahead,
			typing,
		}),
		[isOpen, present, labels, register, typeahead, typing],
	)
	return (
		<SelectPrimitive.Root
			value={toBase(currentValue)}
			onValueChange={(next: string | null) => changeValue(next ?? '')}
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
>(({ className, children, asChild, onKeyDown, ...props }, ref) => {
	const compat = React.useContext(SelectCompatContext)
	return (
		<SelectPrimitive.Trigger
			ref={ref}
			onKeyDown={(event: React.KeyboardEvent<HTMLButtonElement>) => {
				onKeyDown?.(event)
				if (event.defaultPrevented || !compat || compat.open) return
				// 閉じたまま頭の文字を打つと、合う項目を選ぶ（Radix と同じ）。
				// 打ち始めの空白は、これまでどおり一覧を開く
				if (
					event.key.length !== 1 ||
					event.ctrlKey ||
					event.metaKey ||
					event.altKey
				)
					return
				if (event.key === ' ' && !compat.typing()) return
				event.preventDefault()
				compat.typeahead(event.key)
			}}
			className={cn(
				'flex h-7 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-input bg-background px-2 text-sm text-foreground transition-colors duration-fast placeholder:text-subtle-foreground hover:bg-muted/50 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
				className,
			)}
			render={compatRender(
				'button',
				asChild,
				children,
				(state: {
					open: boolean
					placeholder: boolean
					disabled?: boolean
				}) => ({
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
	)
})
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
	const compat = React.useContext(SelectCompatContext)
	// Radix と同じく、描いた後（ブラウザの中）で初めて DOM の外の入れ物を作る。
	// はじめの描画ではポータルを出さないので、サーバーや renderToStaticMarkup でも描ける
	const [fragment, setFragment] = React.useState<DocumentFragment | null>(null)
	React.useEffect(() => {
		setFragment(document.createDocumentFragment())
	}, [])
	// 閉じたまま頭の文字で選ぶとき、ここに描いた項目の写しを読む
	const collectorRef = compat?.collectorRef
	React.useEffect(() => {
		if (!collectorRef) return
		collectorRef.current = fragment
		return () => {
			if (collectorRef.current === fragment) collectorRef.current = null
		}
	}, [collectorRef, fragment])
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
		const closing = !!compat && !compat.open
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
								closing && 'pointer-events-none',
							)}
							// 閉じる動きの間（約 150ms）も一覧は画面に残る。そのすきに別の
							// Select を開いても、読み上げや役割での検索が閉じかけの一覧を
							// 拾わないよう、閉じたらすぐ読み上げから外し、押せなくする
							aria-hidden={closing || undefined}
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
	({ className, children, value, textValue, disabled, ...props }, ref) => {
		const compat = React.useContext(SelectCompatContext)
		const collecting = React.useContext(CollectContext)
		const register = compat?.register
		// 覚えた文字は消さない（閉じている時の項目と開いた時の項目が入れ替わる間も、
		// SelectValue に文字を出し続けるため）。新しく描かれたら上書きする
		React.useLayoutEffect(() => {
			register?.(value, children)
		}, [register, value, children])
		// 閉じているあいだは、頭の文字で選ぶための写しだけを描く（DOM の外なので見えない）
		if (collecting)
			return (
				<span
					data-select-item={value}
					data-disabled={disabled ? '' : undefined}
				>
					{textValue ?? children}
				</span>
			)
		return (
			<SelectPrimitive.Item
				disabled={disabled}
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
