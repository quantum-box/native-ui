'use client'

import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip'
import * as React from 'react'

import {
	type DismissHandlers,
	type PositionProps,
	compatRender,
	positionerCompat,
	radixCssVars,
	useDismissCompat,
	useDismissHandlers,
} from '../../lib/overlay'
import { cn } from '../../lib/utils'

// 中身は base-ui の Tooltip。使い方（props・asChild・data-state）は Radix のときと同じ。

/** Radix と同じ既定の待ち時間（ミリ秒） */
const DEFAULT_DELAY = 700

const DelayContext = React.createContext<number | undefined>(undefined)

/** 読み上げで Trigger と中身をつなぐ id（Radix と同じく aria-describedby で） */
const ContentIdContext = React.createContext<string | undefined>(undefined)

export interface TooltipProviderProps {
	children?: React.ReactNode
	/** 触れてから出るまでの時間。既定は 700 */
	delayDuration?: number
	/** 1 つ閉じてから、次を待たずに出せる時間。既定は 300 */
	skipDelayDuration?: number
	disableHoverableContent?: boolean
}

function TooltipProvider({
	children,
	delayDuration = DEFAULT_DELAY,
	skipDelayDuration = 300,
}: TooltipProviderProps) {
	return (
		<TooltipPrimitive.Provider
			delay={delayDuration}
			timeout={skipDelayDuration}
		>
			<DelayContext.Provider value={delayDuration}>
				{children}
			</DelayContext.Provider>
		</TooltipPrimitive.Provider>
	)
}

export interface TooltipProps {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?: (open: boolean) => void
	/** 触れてから出るまでの時間。指定が無ければ Provider の値 */
	delayDuration?: number
	/** true なら、出た中身の上に指を移しても残さない */
	disableHoverableContent?: boolean
	children?: React.ReactNode
}

function Tooltip({
	open,
	defaultOpen,
	onOpenChange,
	delayDuration,
	disableHoverableContent,
	children,
}: TooltipProps) {
	const { handleOpenChange, DismissProvider } = useDismissCompat(onOpenChange)
	const providerDelay = React.useContext(DelayContext)
	const contentId = React.useId()
	return (
		<TooltipPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={handleOpenChange}
			disableHoverablePopup={disableHoverableContent}
		>
			<DelayContext.Provider
				value={delayDuration ?? providerDelay ?? DEFAULT_DELAY}
			>
				<ContentIdContext.Provider value={contentId}>
					<DismissProvider>{children}</DismissProvider>
				</ContentIdContext.Provider>
			</DelayContext.Provider>
		</TooltipPrimitive.Root>
	)
}

/** Radix の data-state（closed／delayed-open／instant-open）に直す */
const tooltipState = (state: {
	open: boolean
	instant?: string
}): Record<string, string> => ({
	'data-state': state.open
		? state.instant
			? 'instant-open'
			: 'delayed-open'
		: 'closed',
})

const TooltipTrigger = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
	const delay = React.useContext(DelayContext)
	const contentId = React.useContext(ContentIdContext)
	return (
		<TooltipPrimitive.Trigger
			ref={ref}
			delay={delay ?? DEFAULT_DELAY}
			render={compatRender(
				'button',
				asChild,
				children,
				(state: { open: boolean }) => ({
					...tooltipState(state),
					'aria-describedby': state.open ? contentId : undefined,
				}),
			)}
			{...props}
		>
			{asChild ? undefined : children}
		</TooltipPrimitive.Trigger>
	)
})
TooltipTrigger.displayName = 'TooltipTrigger'

export interface TooltipContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		PositionProps,
		Pick<DismissHandlers, 'onEscapeKeyDown' | 'onPointerDownOutside'> {
	asChild?: boolean
	forceMount?: boolean
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
	(
		{
			className,
			style,
			asChild,
			children,
			forceMount,
			onEscapeKeyDown,
			onPointerDownOutside,
			side = 'top',
			sideOffset = 6,
			align,
			alignOffset,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			...props
		},
		ref,
	) => {
		useDismissHandlers({ onEscapeKeyDown, onPointerDownOutside })
		const contentId = React.useContext(ContentIdContext)
		return (
			<TooltipPrimitive.Portal keepMounted={forceMount}>
				<TooltipPrimitive.Positioner
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
					<TooltipPrimitive.Popup
						ref={ref}
						id={contentId}
						role='tooltip'
						className={cn(
							// Inverted surface reads as "native" in both themes
							'z-50 overflow-hidden rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-overlay animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
							className,
						)}
						style={{ ...radixCssVars('tooltip'), ...style }}
						render={compatRender('div', asChild, children, tooltipState)}
						{...props}
					>
						{asChild ? undefined : children}
					</TooltipPrimitive.Popup>
				</TooltipPrimitive.Positioner>
			</TooltipPrimitive.Portal>
		)
	},
)
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
