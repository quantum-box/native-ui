'use client'

import { Dialog as DialogPrimitive } from '@base-ui/react/dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import {
	type DismissHandlers,
	compatRender,
	isNativeButtonChild,
	openState,
	useDismissCompat,
	useDismissHandlers,
	useRadixCloseFocus,
	useRadixOpenFocus,
} from '../../lib/overlay'
import { cn } from '../../lib/utils'

// 中身は base-ui の Dialog。使い方（props・asChild・data-state）は Radix のときと同じ。

export interface DialogProps {
	open?: boolean
	defaultOpen?: boolean
	/** 開く・閉じるときに呼ぶ */
	onOpenChange?: (open: boolean) => void
	/** 既定は true（外を触れなくし、スクロールを止める） */
	modal?: boolean
	children?: React.ReactNode
}

function Dialog({
	open,
	defaultOpen,
	onOpenChange,
	modal = true,
	children,
}: DialogProps) {
	const { handleOpenChange, DismissProvider } = useDismissCompat(
		onOpenChange,
		undefined,
		modal,
	)
	return (
		<DialogPrimitive.Root
			open={open}
			defaultOpen={defaultOpen}
			onOpenChange={handleOpenChange}
			modal={modal}
		>
			<DismissProvider>{children}</DismissProvider>
		</DialogPrimitive.Root>
	)
}

type ButtonLikeProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
	asChild?: boolean
}

const DialogTrigger = React.forwardRef<HTMLButtonElement, ButtonLikeProps>(
	({ asChild, children, ...props }, ref) => (
		<DialogPrimitive.Trigger
			ref={ref}
			nativeButton={isNativeButtonChild(asChild, children)}
			render={compatRender('button', asChild, children, openState)}
			{...props}
		>
			{asChild ? undefined : children}
		</DialogPrimitive.Trigger>
	),
)
DialogTrigger.displayName = 'DialogTrigger'

const DialogClose = React.forwardRef<HTMLButtonElement, ButtonLikeProps>(
	({ asChild, children, ...props }, ref) => (
		<DialogPrimitive.Close
			ref={ref}
			nativeButton={isNativeButtonChild(asChild, children)}
			render={compatRender('button', asChild, children, () => ({}))}
			{...props}
		>
			{asChild ? undefined : children}
		</DialogPrimitive.Close>
	),
)
DialogClose.displayName = 'DialogClose'

interface DialogPortalProps {
	children?: React.ReactNode
	/** 出す先。既定は document.body */
	container?: HTMLElement | null
	/** 閉じても DOM に残す */
	forceMount?: boolean
}

function DialogPortal({ children, container, forceMount }: DialogPortalProps) {
	return (
		<DialogPrimitive.Portal container={container} keepMounted={forceMount}>
			{children}
		</DialogPrimitive.Portal>
	)
}

type DialogOverlayProps = React.HTMLAttributes<HTMLDivElement> & {
	asChild?: boolean
	forceMount?: boolean
}

const DialogOverlay = React.forwardRef<HTMLDivElement, DialogOverlayProps>(
	(
		{ className, asChild, children, forceMount: _forceMount, ...props },
		ref,
	) => (
		<DialogPrimitive.Backdrop
			ref={ref}
			className={cn(
				'fixed inset-0 z-50 bg-black/40 dark:bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
				className,
			)}
			render={compatRender('div', asChild, children, openState)}
			{...props}
		/>
	),
)
DialogOverlay.displayName = 'DialogOverlay'

export interface DialogContentBaseProps
	extends React.HTMLAttributes<HTMLDivElement>,
		DismissHandlers {
	asChild?: boolean
	/** 閉じても DOM に残す */
	forceMount?: boolean
	/** 開いたときのフォーカス。`preventDefault()` で動かさない */
	onOpenAutoFocus?: (event: Event) => void
	/** 閉じたときのフォーカス。`preventDefault()` で動かさない */
	onCloseAutoFocus?: (event: Event) => void
}

/**
 * Dialog と Sheet の本体の中身（ポータルの中に置く物）。
 * Radix の Content の props を base-ui の Popup に直す。
 */
const DialogPopupCompat = React.forwardRef<
	HTMLDivElement,
	DialogContentBaseProps
>(
	(
		{
			asChild,
			children,
			forceMount: _forceMount,
			onOpenAutoFocus,
			onCloseAutoFocus,
			onEscapeKeyDown,
			onPointerDownOutside,
			onFocusOutside,
			onInteractOutside,
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
		const focus = useRadixOpenFocus(onOpenAutoFocus, ref)
		const finalFocus = useRadixCloseFocus(onCloseAutoFocus)
		return (
			<DialogPrimitive.Popup
				ref={focus.ref}
				initialFocus={focus.initialFocus}
				finalFocus={finalFocus}
				render={compatRender(
					'div',
					asChild,
					children,
					(state: { open: boolean }) => openState(state),
				)}
				{...props}
			>
				{asChild ? undefined : children}
			</DialogPrimitive.Popup>
		)
	},
)
DialogPopupCompat.displayName = 'DialogPopupCompat'

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentBaseProps>(
	({ className, children, forceMount, ...props }, ref) => (
		<DialogPortal forceMount={forceMount}>
			<DialogOverlay />
			<DialogPopupCompat
				ref={ref}
				className={cn(
					'fixed left-1/2 top-1/2 z-50 grid max-h-[100dvh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-xl border border-border bg-background p-5 shadow-modal duration-base data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
					className,
				)}
				{...props}
			>
				{children}
				<DialogClose className='absolute right-3 top-3 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none'>
					<X className='size-4' />
					<span className='sr-only'>Close</span>
				</DialogClose>
			</DialogPopupCompat>
		</DialogPortal>
	),
)
DialogContent.displayName = 'DialogContent'

const DialogHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col gap-1 text-left', className)} {...props} />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
			className,
		)}
		{...props}
	/>
)
DialogFooter.displayName = 'DialogFooter'

type TextProps<T> = React.HTMLAttributes<T> & { asChild?: boolean }

const DialogTitle = React.forwardRef<
	HTMLHeadingElement,
	TextProps<HTMLHeadingElement>
>(({ className, asChild, children, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn('text-lg font-semibold leading-6', className)}
		render={compatRender('h2', asChild, children, () => ({}))}
		{...props}
	>
		{asChild ? undefined : children}
	</DialogPrimitive.Title>
))
DialogTitle.displayName = 'DialogTitle'

const DialogDescription = React.forwardRef<
	HTMLParagraphElement,
	TextProps<HTMLParagraphElement>
>(({ className, asChild, children, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn('text-sm text-muted-foreground', className)}
		render={compatRender('p', asChild, children, () => ({}))}
		{...props}
	>
		{asChild ? undefined : children}
	</DialogPrimitive.Description>
))
DialogDescription.displayName = 'DialogDescription'

export {
	Dialog,
	DialogPortal,
	DialogOverlay,
	DialogClose,
	DialogTrigger,
	DialogContent,
	DialogPopupCompat,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
}
