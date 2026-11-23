'use client'

import { Menu as MenuPrimitive } from '@base-ui/react/menu'
import { Check, ChevronRight, Circle } from 'lucide-react'
import * as React from 'react'

import {
	type DismissHandlers,
	type PositionProps,
	compatRender,
	isNativeButtonChild,
	openState,
	positionerCompat,
	radixCssVars,
	useDismissCompat,
	useDismissHandlers,
	useRadixCloseFocus,
} from '../../lib/overlay'
import { Slot } from '../../lib/slot'
import { cn } from '../../lib/utils'

// 中身は base-ui の Menu。使い方（props・asChild・onSelect・data-state・位置の props）は
// Radix のときと同じ。

interface MenuCompat {
	/** onSelect で preventDefault() されたら、次の「項目を押して閉じる」を止める */
	keepOpenRef: React.MutableRefObject<boolean>
	setLoop: (loop: boolean) => void
}
const MenuCompatContext = React.createContext<MenuCompat | null>(null)

export interface DropdownMenuProps {
	open?: boolean
	defaultOpen?: boolean
	/** 開く・閉じるときに呼ぶ */
	onOpenChange?: (open: boolean) => void
	/** 既定は true（外を触れなくし、スクロールを止める） */
	modal?: boolean
	dir?: 'ltr' | 'rtl'
	children?: React.ReactNode
}

function DropdownMenu({
	open,
	defaultOpen,
	onOpenChange,
	modal = true,
	children,
}: DropdownMenuProps) {
	const keepOpenRef = React.useRef(false)
	const [loop, setLoop] = React.useState(false)
	const beforeChange = React.useCallback(
		(next: boolean, details: { reason: string }) => {
			if (!next && details.reason === 'item-press' && keepOpenRef.current) {
				keepOpenRef.current = false
				return false
			}
			return true
		},
		[],
	)
	const { handleOpenChange, DismissProvider } = useDismissCompat(
		onOpenChange,
		beforeChange,
		modal,
	)
	const compat = React.useMemo(() => ({ keepOpenRef, setLoop }), [])
	return (
		<MenuPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={handleOpenChange}
			modal={modal}
			loopFocus={loop}
		>
			<MenuCompatContext.Provider value={compat}>
				<DismissProvider>{children}</DismissProvider>
			</MenuCompatContext.Provider>
		</MenuPrimitive.Root>
	)
}

/** Radix の onSelect を、項目を押したとき（クリック・Enter・Space）に呼ぶ */
function useOnSelect(
	onSelect: ((event: Event) => void) | undefined,
	disabled: boolean | undefined,
) {
	const compat = React.useContext(MenuCompatContext)
	return React.useCallback(
		(event: React.MouseEvent) => {
			if (!onSelect || disabled) return
			const selectEvent = new CustomEvent('menu.itemSelect', {
				cancelable: true,
				detail: { originalEvent: event.nativeEvent },
			})
			onSelect(selectEvent)
			if (selectEvent.defaultPrevented && compat) {
				compat.keepOpenRef.current = true
				queueMicrotask(() => {
					compat.keepOpenRef.current = false
				})
			}
		},
		[onSelect, disabled, compat],
	)
}

const DropdownMenuTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
	<MenuPrimitive.Trigger
		ref={ref}
		nativeButton={isNativeButtonChild(asChild, children)}
		render={compatRender('button', asChild, children, openState)}
		{...props}
	>
		{asChild ? undefined : children}
	</MenuPrimitive.Trigger>
))
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

const DropdownMenuGroup = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
	<MenuPrimitive.Group
		ref={ref}
		render={compatRender('div', asChild, children, () => ({}))}
		{...props}
	>
		{asChild ? undefined : children}
	</MenuPrimitive.Group>
))
DropdownMenuGroup.displayName = 'DropdownMenuGroup'

/** Content はもとからポータルの中に出すので、これは中身をそのまま返す（Radix との互換のため残す） */
function DropdownMenuPortal({
	children,
}: {
	children?: React.ReactNode
	container?: HTMLElement | null
	forceMount?: boolean
}) {
	return <>{children}</>
}

export interface DropdownMenuSubProps {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	children?: React.ReactNode
}

function DropdownMenuSub({
	open,
	defaultOpen,
	onOpenChange,
	children,
}: DropdownMenuSubProps) {
	return (
		<MenuPrimitive.SubmenuRoot
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={next => onOpenChange?.(next)}
		>
			{children}
		</MenuPrimitive.SubmenuRoot>
	)
}

export interface DropdownMenuRadioGroupProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'defaultValue'> {
	value?: string
	defaultValue?: string
	onValueChange?: (value: string) => void
	asChild?: boolean
}

const DropdownMenuRadioGroup = React.forwardRef<
	HTMLDivElement,
	DropdownMenuRadioGroupProps
>(({ asChild, children, onValueChange, ...props }, ref) => (
	<MenuPrimitive.RadioGroup
		ref={ref}
		onValueChange={(value: string) => onValueChange?.(value)}
		render={compatRender('div', asChild, children, () => ({}))}
		{...props}
	>
		{asChild ? undefined : children}
	</MenuPrimitive.RadioGroup>
))
DropdownMenuRadioGroup.displayName = 'DropdownMenuRadioGroup'

const menuContentClass =
	'z-50 min-w-[10rem] overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1'

// base-ui は data-highlighted も付けるので、フォーカスと同じ見た目にする
const menuItemClass =
	'relative flex h-7 cursor-default select-none items-center gap-2 rounded-sm px-2 text-sm outline-none transition-colors duration-fast focus:bg-muted focus:text-foreground data-[highlighted]:bg-muted data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:size-3.5 [&_svg]:shrink-0 [&_svg]:text-muted-foreground'

export interface DropdownMenuSubTriggerProps
	extends React.HTMLAttributes<HTMLDivElement> {
	inset?: boolean
	disabled?: boolean
	textValue?: string
	asChild?: boolean
}

const DropdownMenuSubTrigger = React.forwardRef<
	HTMLDivElement,
	DropdownMenuSubTriggerProps
>(({ className, inset, children, asChild, textValue, ...props }, ref) => (
	<MenuPrimitive.SubmenuTrigger
		ref={ref}
		label={textValue}
		className={cn(
			menuItemClass,
			'data-[state=open]:bg-muted',
			inset && 'pl-8',
			className,
		)}
		render={compatRender('div', asChild, children, openState)}
		{...props}
	>
		{asChild ? undefined : (
			<>
				{children}
				<ChevronRight className='ml-auto' />
			</>
		)}
	</MenuPrimitive.SubmenuTrigger>
))
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger'

export interface DropdownMenuContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		PositionProps,
		DismissHandlers {
	asChild?: boolean
	/** 矢印で端まで行ったら反対の端へ戻る。既定は false */
	loop?: boolean
	forceMount?: boolean
	/** 閉じたときのフォーカス。`preventDefault()` で動かさない */
	onCloseAutoFocus?: (event: Event) => void
}

interface MenuPopupProps extends DropdownMenuContentProps {
	sub?: boolean
}

const MenuPopupCompat = React.forwardRef<HTMLDivElement, MenuPopupProps>(
	(
		{
			sub,
			className,
			style,
			asChild,
			children,
			loop,
			forceMount,
			onCloseAutoFocus,
			onEscapeKeyDown,
			onPointerDownOutside,
			onFocusOutside,
			onInteractOutside,
			side,
			sideOffset,
			align,
			alignOffset,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			onKeyDown,
			...props
		},
		ref,
	) => {
		const finalFocus = useRadixCloseFocus(onCloseAutoFocus)
		const handlers = {
			onEscapeKeyDown,
			onPointerDownOutside,
			onFocusOutside,
			onInteractOutside,
		}
		// 子のメニューの中身は、親の閉じる前の呼び出しを上書きしない
		useDismissHandlers(handlers, !sub)
		const setLoop = React.useContext(MenuCompatContext)?.setLoop
		React.useEffect(() => {
			if (!sub) setLoop?.(loop ?? false)
		}, [sub, loop, setLoop])
		return (
			<MenuPrimitive.Portal keepMounted={forceMount}>
				<MenuPrimitive.Positioner
					className={cn(
						'z-50',
						hideWhenDetached && 'data-[anchor-hidden]:invisible',
					)}
					{...positionerCompat({
						side: side ?? (sub ? 'right' : 'bottom'),
						sideOffset,
						align: align ?? (sub ? 'start' : 'center'),
						alignOffset,
						avoidCollisions,
						collisionBoundary,
						collisionPadding,
						sticky,
					})}
				>
					<MenuPrimitive.Popup
						ref={ref}
						finalFocus={finalFocus}
						onKeyDown={event => {
							onKeyDown?.(event)
							// Radix と同じく、メニューの中では Tab でフォーカスを動かさない
							if (event.key === 'Tab') event.preventDefault()
						}}
						className={cn(menuContentClass, className)}
						style={{ ...radixCssVars('dropdown-menu'), ...style }}
						render={compatRender('div', asChild, children, openState)}
						{...props}
					>
						{asChild ? undefined : children}
					</MenuPrimitive.Popup>
				</MenuPrimitive.Positioner>
			</MenuPrimitive.Portal>
		)
	},
)
MenuPopupCompat.displayName = 'MenuPopupCompat'

const DropdownMenuSubContent = React.forwardRef<
	HTMLDivElement,
	DropdownMenuContentProps
>((props, ref) => <MenuPopupCompat ref={ref} sub {...props} />)
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent'

const DropdownMenuContent = React.forwardRef<
	HTMLDivElement,
	DropdownMenuContentProps
>(({ sideOffset = 4, ...props }, ref) => (
	<MenuPopupCompat ref={ref} sideOffset={sideOffset} {...props} />
))
DropdownMenuContent.displayName = 'DropdownMenuContent'

interface ItemCompatProps
	extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
	disabled?: boolean
	/** 押したとき（クリック・Enter・Space）に呼ぶ。`preventDefault()` で閉じない */
	onSelect?: (event: Event) => void
	/** 頭の文字で探すときの文字 */
	textValue?: string
	asChild?: boolean
}

export interface DropdownMenuItemProps extends ItemCompatProps {
	inset?: boolean
}

const DropdownMenuItem = React.forwardRef<
	HTMLDivElement,
	DropdownMenuItemProps
>(
	(
		{ className, inset, asChild, children, onSelect, textValue, ...props },
		ref,
	) => {
		const handleSelect = useOnSelect(onSelect, props.disabled)
		return (
			<MenuPrimitive.Item
				ref={ref}
				label={textValue}
				onClickCapture={handleSelect}
				className={cn(menuItemClass, inset && 'pl-8', className)}
				render={compatRender('div', asChild, children, () => ({}))}
				{...props}
			>
				{asChild ? undefined : children}
			</MenuPrimitive.Item>
		)
	},
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

/** Radix の data-state（checked／unchecked／indeterminate） */
const checkedState =
	(checked: boolean | 'indeterminate' | undefined) =>
	(state: { checked: boolean }): Record<string, string> => ({
		'data-state':
			checked === 'indeterminate'
				? 'indeterminate'
				: state.checked
					? 'checked'
					: 'unchecked',
	})

export interface DropdownMenuCheckboxItemProps extends ItemCompatProps {
	checked?: boolean | 'indeterminate'
	onCheckedChange?: (checked: boolean) => void
}

const DropdownMenuCheckboxItem = React.forwardRef<
	HTMLDivElement,
	DropdownMenuCheckboxItemProps
>(
	(
		{
			className,
			children,
			checked,
			onCheckedChange,
			onSelect,
			textValue,
			asChild: _asChild,
			...props
		},
		ref,
	) => {
		const handleSelect = useOnSelect(onSelect, props.disabled)
		return (
			<MenuPrimitive.CheckboxItem
				ref={ref}
				label={textValue}
				// Radix と同じく、押したらメニューを閉じる
				closeOnClick
				checked={checked === 'indeterminate' ? true : checked}
				onCheckedChange={(next: boolean) => onCheckedChange?.(next)}
				onClickCapture={handleSelect}
				className={cn(menuItemClass, 'pl-7', className)}
				render={compatRender('div', false, null, checkedState(checked))}
				{...props}
			>
				<span className='absolute left-2 flex size-3.5 items-center justify-center'>
					<MenuPrimitive.CheckboxItemIndicator>
						<Check className='size-3.5 text-foreground' />
					</MenuPrimitive.CheckboxItemIndicator>
				</span>
				{children}
			</MenuPrimitive.CheckboxItem>
		)
	},
)
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem'

export interface DropdownMenuRadioItemProps extends ItemCompatProps {
	value: string
}

const DropdownMenuRadioItem = React.forwardRef<
	HTMLDivElement,
	DropdownMenuRadioItemProps
>(
	(
		{ className, children, onSelect, textValue, asChild: _asChild, ...props },
		ref,
	) => {
		const handleSelect = useOnSelect(onSelect, props.disabled)
		return (
			<MenuPrimitive.RadioItem
				ref={ref}
				label={textValue}
				// Radix と同じく、押したらメニューを閉じる
				closeOnClick
				onClickCapture={handleSelect}
				className={cn(menuItemClass, 'pl-7', className)}
				render={compatRender('div', false, null, checkedState(undefined))}
				{...props}
			>
				<span className='absolute left-2 flex size-3.5 items-center justify-center'>
					<MenuPrimitive.RadioItemIndicator>
						<Circle className='size-1.5 fill-current text-foreground' />
					</MenuPrimitive.RadioItemIndicator>
				</span>
				{children}
			</MenuPrimitive.RadioItem>
		)
	},
)
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem'

const DropdownMenuLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { inset?: boolean; asChild?: boolean }
>(({ className, inset, asChild, ...props }, ref) => {
	const Comp = asChild ? Slot : 'div'
	return (
		<Comp
			ref={ref}
			className={cn(
				'px-2 py-1.5 text-2xs font-medium uppercase tracking-wider text-subtle-foreground',
				inset && 'pl-8',
				className,
			)}
			{...props}
		/>
	)
})
DropdownMenuLabel.displayName = 'DropdownMenuLabel'

const DropdownMenuSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<MenuPrimitive.Separator
		ref={ref}
		className={cn('-mx-1 my-1 h-px bg-border', className)}
		{...props}
	/>
))
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn(
				'ml-auto font-mono text-2xs text-subtle-foreground',
				className,
			)}
			{...props}
		/>
	)
}
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'

export {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuCheckboxItem,
	DropdownMenuRadioItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuGroup,
	DropdownMenuPortal,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuRadioGroup,
}
