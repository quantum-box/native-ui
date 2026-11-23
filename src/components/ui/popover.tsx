'use client'

import { Popover as PopoverPrimitive } from '@base-ui/react/popover'
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
	radixLoopTab,
	useMergedRefs,
	useRadixCloseFocus,
	useRadixOpenFocus,
} from '../../lib/overlay'
import { Slot } from '../../lib/slot'
import { cn } from '../../lib/utils'

// 中身は base-ui の Popover。使い方（props・asChild・data-state・位置の props）は
// Radix のときと同じ。

const AnchorContext = React.createContext<{
	anchor: Element | null
	setAnchor: (el: Element | null) => void
} | null>(null)

export interface PopoverProps {
	open?: boolean
	defaultOpen?: boolean
	/** 開く・閉じるときに呼ぶ */
	onOpenChange?: (open: boolean) => void
	/** 既定は false。true で外を触れなくし、スクロールを止める */
	modal?: boolean
	children?: React.ReactNode
}

function Popover({
	open,
	defaultOpen,
	onOpenChange,
	modal = false,
	children,
}: PopoverProps) {
	const { handleOpenChange, DismissProvider } = useDismissCompat(
		onOpenChange,
		undefined,
		modal,
	)
	const [anchor, setAnchor] = React.useState<Element | null>(null)
	const anchorValue = React.useMemo(() => ({ anchor, setAnchor }), [anchor])
	return (
		<PopoverPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={handleOpenChange}
			modal={modal}
		>
			<AnchorContext.Provider value={anchorValue}>
				<DismissProvider>{children}</DismissProvider>
			</AnchorContext.Provider>
		</PopoverPrimitive.Root>
	)
}

const PopoverTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => (
	<PopoverPrimitive.Trigger
		ref={ref}
		nativeButton={isNativeButtonChild(asChild, children)}
		render={compatRender('button', asChild, children, openState)}
		{...props}
	>
		{asChild ? undefined : children}
	</PopoverPrimitive.Trigger>
))
PopoverTrigger.displayName = 'PopoverTrigger'

/** 位置の基準にする要素。置くと Trigger ではなくこれの横に出る */
const PopoverAnchor = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ asChild, ...props }, ref) => {
	const context = React.useContext(AnchorContext)
	const setAnchor = context?.setAnchor
	const mergedRef = React.useCallback(
		(el: HTMLDivElement | null) => {
			setAnchor?.(el)
			if (typeof ref === 'function') ref(el)
			else if (ref) ref.current = el
		},
		[ref, setAnchor],
	)
	const Comp = asChild ? Slot : 'div'
	return <Comp ref={mergedRef} {...props} />
})
PopoverAnchor.displayName = 'PopoverAnchor'

export interface PopoverContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		PositionProps,
		DismissHandlers {
	asChild?: boolean
	/** 閉じても DOM に残す */
	forceMount?: boolean
	/** 開いたときのフォーカス。`preventDefault()` で動かさない */
	onOpenAutoFocus?: (event: Event) => void
	/** 閉じたときのフォーカス。`preventDefault()` で動かさない */
	onCloseAutoFocus?: (event: Event) => void
}

const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
	(
		{
			className,
			style,
			asChild,
			children,
			forceMount,
			onOpenAutoFocus,
			onCloseAutoFocus,
			onEscapeKeyDown,
			onPointerDownOutside,
			onFocusOutside,
			onInteractOutside,
			side,
			sideOffset = 4,
			align = 'center',
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
		useDismissHandlers({
			onEscapeKeyDown,
			onPointerDownOutside,
			onFocusOutside,
			onInteractOutside,
		})
		const anchor = React.useContext(AnchorContext)?.anchor
		const focus = useRadixOpenFocus(onOpenAutoFocus, ref)
		const { finalFocus, popupRef } = useRadixCloseFocus(onCloseAutoFocus)
		const mergedRef = useMergedRefs(focus.ref, popupRef)
		return (
			<PopoverPrimitive.Portal keepMounted={forceMount}>
				<PopoverPrimitive.Positioner
					className={cn(
						'z-50',
						hideWhenDetached && 'data-[anchor-hidden]:invisible',
					)}
					anchor={anchor ?? undefined}
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
					<PopoverPrimitive.Popup
						ref={mergedRef}
						initialFocus={focus.initialFocus}
						finalFocus={finalFocus}
						onKeyDown={event => {
							onKeyDown?.(event)
							if (!event.defaultPrevented) radixLoopTab(event)
						}}
						className={cn(
							'z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-overlay outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
							className,
						)}
						style={{ ...radixCssVars('popover'), ...style }}
						render={compatRender('div', asChild, children, openState)}
						{...props}
					>
						{asChild ? undefined : children}
					</PopoverPrimitive.Popup>
				</PopoverPrimitive.Positioner>
			</PopoverPrimitive.Portal>
		)
	},
)
PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
