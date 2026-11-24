'use client'

import { PreviewCard as PreviewCardPrimitive } from '@base-ui/react/preview-card'
import * as React from 'react'

import {
	type PositionProps,
	compatRender,
	openState,
	positionerCompat,
	radixCssVars,
} from '../../lib/overlay'
import { cn } from '../../lib/utils'

// 中身は base-ui の PreviewCard。使い方（openDelay・closeDelay・asChild・data-state・
// 位置の props）は Radix の HoverCard のときと同じ。

/** Radix と同じ既定の待ち時間（ミリ秒） */
const DEFAULT_OPEN_DELAY = 700
const DEFAULT_CLOSE_DELAY = 300

const DelayContext = React.createContext({
	openDelay: DEFAULT_OPEN_DELAY,
	closeDelay: DEFAULT_CLOSE_DELAY,
})

export interface HoverCardProps {
	open?: boolean
	defaultOpen?: boolean
	onOpenChange?(open: boolean): void
	/** 触れてから出るまでの時間。既定は 700 */
	openDelay?: number
	/** 離れてから消えるまでの時間。既定は 300 */
	closeDelay?: number
	children?: React.ReactNode
}

/** 触れると出る小さな枠。補足を見せるだけで、大事な操作は置かない。 */
function HoverCard({
	open,
	defaultOpen,
	onOpenChange,
	openDelay = DEFAULT_OPEN_DELAY,
	closeDelay = DEFAULT_CLOSE_DELAY,
	children,
}: HoverCardProps) {
	const delays = React.useMemo(
		() => ({ openDelay, closeDelay }),
		[openDelay, closeDelay],
	)
	return (
		<PreviewCardPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={(next: boolean) => onOpenChange?.(next)}
		>
			<DelayContext.Provider value={delays}>{children}</DelayContext.Provider>
		</PreviewCardPrimitive.Root>
	)
}

const HoverCardTrigger = React.forwardRef<
	HTMLAnchorElement,
	React.AnchorHTMLAttributes<HTMLAnchorElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
	const { openDelay, closeDelay } = React.useContext(DelayContext)
	return (
		<PreviewCardPrimitive.Trigger
			ref={ref}
			delay={openDelay}
			closeDelay={closeDelay}
			render={compatRender('a', asChild, children, openState)}
			{...props}
		>
			{asChild ? undefined : children}
		</PreviewCardPrimitive.Trigger>
	)
})
HoverCardTrigger.displayName = 'HoverCardTrigger'

export interface HoverCardContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		PositionProps {
	asChild?: boolean
	forceMount?: boolean
}

const HoverCardContent = React.forwardRef<
	HTMLDivElement,
	HoverCardContentProps
>(
	(
		{
			className,
			style,
			asChild,
			children,
			forceMount,
			side = 'bottom',
			sideOffset = 4,
			align = 'start',
			alignOffset,
			avoidCollisions,
			collisionBoundary,
			collisionPadding,
			sticky,
			hideWhenDetached,
			...props
		},
		ref,
	) => (
		<PreviewCardPrimitive.Portal keepMounted={forceMount}>
			<PreviewCardPrimitive.Positioner
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
				<PreviewCardPrimitive.Popup
					ref={ref}
					className={cn(
						'z-50 w-72 rounded-lg border border-border bg-popover p-3 text-popover-foreground text-sm shadow-overlay outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
						className,
					)}
					style={{ ...radixCssVars('hover-card'), ...style }}
					render={compatRender('div', asChild, children, openState)}
					{...props}
				>
					{asChild ? undefined : children}
				</PreviewCardPrimitive.Popup>
			</PreviewCardPrimitive.Positioner>
		</PreviewCardPrimitive.Portal>
	),
)
HoverCardContent.displayName = 'HoverCardContent'

export { HoverCard, HoverCardTrigger, HoverCardContent }
