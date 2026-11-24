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

/**
 * 中身の文を選んでいるあいだ・選んだ文があるあいだは、指が離れても閉じない
 * （Radix と同じ。閉じると選んだ文が消えて写せないため）。外を押す・Esc では閉じる
 */
interface SelectionState {
	pointerDownOnContent: boolean
	hasSelection: boolean
}
const SelectionContext = React.createContext<
	React.MutableRefObject<SelectionState> | undefined
>(undefined)

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
	const selection = React.useRef<SelectionState>({
		pointerDownOnContent: false,
		hasSelection: false,
	})
	return (
		<PreviewCardPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={(
				next: boolean,
				details: PreviewCardPrimitive.Root.ChangeEventDetails,
			) => {
				const leaving =
					details.reason === 'trigger-hover' ||
					details.reason === 'trigger-focus'
				const selecting =
					selection.current.pointerDownOnContent ||
					selection.current.hasSelection
				if (!next && leaving && selecting) {
					details.cancel()
					return
				}
				if (!next) selection.current.hasSelection = false
				onOpenChange?.(next)
			}}
		>
			<SelectionContext.Provider value={selection}>
				<DelayContext.Provider value={delays}>{children}</DelayContext.Provider>
			</SelectionContext.Provider>
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
	) => {
		const selection = React.useContext(SelectionContext)
		// 中身の上で押したら、離すまで「文を選んでいる」とみなす。離したあと、
		// 選んだ文が残っていれば、指が離れても閉じない
		const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
			props.onPointerDown?.(event)
			if (!selection || event.button !== 0 || event.defaultPrevented) return
			selection.current.pointerDownOnContent = true
			const { body } = document
			const previous = body.style.userSelect
			// 選ぶ範囲が中身の外へ広がらないようにする（Radix と同じ）
			body.style.userSelect = 'none'
			event.currentTarget.style.userSelect = 'text'
			const content = event.currentTarget
			const onPointerUp = () => {
				document.removeEventListener('pointerup', onPointerUp)
				body.style.userSelect = previous
				content.style.userSelect = ''
				// 選んだ文は、離したあとに決まる。決まるまでは「選んでいる」のままにして、
				// その間に閉じないようにする
				window.setTimeout(() => {
					selection.current.hasSelection =
						(document.getSelection()?.toString() ?? '') !== ''
					selection.current.pointerDownOnContent = false
				}, 0)
			}
			document.addEventListener('pointerup', onPointerUp)
		}
		return (
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
						onPointerDown={onPointerDown}
					>
						{asChild ? undefined : children}
					</PreviewCardPrimitive.Popup>
				</PreviewCardPrimitive.Positioner>
			</PreviewCardPrimitive.Portal>
		)
	},
)
HoverCardContent.displayName = 'HoverCardContent'

export { HoverCard, HoverCardTrigger, HoverCardContent }
