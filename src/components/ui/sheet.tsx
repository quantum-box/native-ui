'use client'

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * 画面の右端から出る詳細の画面。一覧をその場に残したまま、選んだ行の中身を
 * 横に出すために使う。中身は Radix の Dialog なので、×・Esc・外側を押すと閉じる。
 */
const Sheet = DialogPrimitive.Root

const SheetTrigger = DialogPrimitive.Trigger

const SheetClose = DialogPrimitive.Close

const SheetPortal = DialogPrimitive.Portal

/** 幅は 3 段。広い画面では上限の幅、狭い画面では画面いっぱいになる。 */
const SHEET_WIDTHS = {
	md: 'sm:max-w-xl',
	lg: 'sm:max-w-3xl',
	xl: 'sm:max-w-5xl',
} as const

type SheetWidth = keyof typeof SHEET_WIDTHS

const SheetOverlay = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Overlay>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Overlay
		ref={ref}
		className={cn(
			'fixed inset-0 z-50 bg-black/40 data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 dark:bg-black/60',
			className,
		)}
		{...props}
	/>
))
SheetOverlay.displayName = 'SheetOverlay'

interface SheetContentProps
	extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
	/** 右端から出る画面の幅。既定は `lg`。 */
	width?: SheetWidth
	/** 右上の × を出さないときは `true`。 */
	hideClose?: boolean
	/** × の読み上げ用の名前。 */
	closeLabel?: string
}

/**
 * 右端に張り付く本体。中は縦に並べ、`SheetHeader` は上に残したまま
 * `SheetBody` だけがスクロールする。
 */
const SheetContent = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Content>,
	SheetContentProps
>(
	(
		{
			className,
			children,
			width = 'lg',
			hideClose = false,
			closeLabel = '閉じる',
			...props
		},
		ref,
	) => (
		<SheetPortal>
			<SheetOverlay />
			<DialogPrimitive.Content
				ref={ref}
				className={cn(
					'fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-full flex-col overflow-hidden border-border border-l bg-background shadow-modal duration-slow data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full',
					SHEET_WIDTHS[width],
					className,
				)}
				{...props}
			>
				{children}
				{hideClose ? null : (
					<DialogPrimitive.Close className='absolute top-3 right-3 flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none'>
						<X className='size-4' />
						<span className='sr-only'>{closeLabel}</span>
					</DialogPrimitive.Close>
				)}
			</DialogPrimitive.Content>
		</SheetPortal>
	),
)
SheetContent.displayName = 'SheetContent'

/** 見出しの帯。右上の × と重ならないよう右側を空けてある。 */
const SheetHeader = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'grid shrink-0 gap-2 border-border border-b px-4 py-3 pr-12',
			className,
		)}
		{...props}
	/>
)
SheetHeader.displayName = 'SheetHeader'

/** 本文。ここだけがスクロールする。 */
const SheetBody = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('min-h-0 flex-1 overflow-y-auto', className)} {...props} />
)
SheetBody.displayName = 'SheetBody'

/** 下に固定する操作の帯（保存・取り消しなど）。 */
const SheetFooter = ({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn(
			'flex shrink-0 justify-end gap-2 border-border border-t px-4 py-3',
			className,
		)}
		{...props}
	/>
)
SheetFooter.displayName = 'SheetFooter'

const SheetTitle = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Title>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Title
		ref={ref}
		className={cn('truncate font-semibold text-base leading-6', className)}
		{...props}
	/>
))
SheetTitle.displayName = 'SheetTitle'

const SheetDescription = React.forwardRef<
	React.ElementRef<typeof DialogPrimitive.Description>,
	React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
	<DialogPrimitive.Description
		ref={ref}
		className={cn('text-muted-foreground text-xs', className)}
		{...props}
	/>
))
SheetDescription.displayName = 'SheetDescription'

interface DetailSheetProps {
	/** 開いているか。 */
	open: boolean
	/** ×・Esc・外側を押したときに呼ばれる。選んでいた行を外す処理を渡す。 */
	onClose: () => void
	title: React.ReactNode
	description?: React.ReactNode
	/** 見出しの下に置く操作（ボタンなど）。 */
	actions?: React.ReactNode
	width?: SheetWidth
	children: React.ReactNode
	className?: string
}

/**
 * 一覧で選んだ行の詳細を右から出す、組み立て済みの形。見出し・説明・操作・
 * 本文を渡すだけで使える。細かく組みたいときは `Sheet` と `SheetContent` を使う。
 */
function DetailSheet({
	open,
	onClose,
	title,
	description,
	actions,
	width = 'lg',
	children,
	className,
}: Readonly<DetailSheetProps>) {
	return (
		<Sheet onOpenChange={next => !next && onClose()} open={open}>
			<SheetContent
				className={className}
				width={width}
				{...(description ? {} : { 'aria-describedby': undefined })}
			>
				<SheetHeader>
					<SheetTitle>{title}</SheetTitle>
					{description ? (
						<SheetDescription>{description}</SheetDescription>
					) : null}
					{actions ? <div className='min-w-0'>{actions}</div> : null}
				</SheetHeader>
				<SheetBody>{children}</SheetBody>
			</SheetContent>
		</Sheet>
	)
}

export {
	DetailSheet,
	type DetailSheetProps,
	Sheet,
	SheetBody,
	SheetClose,
	SheetContent,
	type SheetContentProps,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetOverlay,
	SheetPortal,
	SheetTitle,
	SheetTrigger,
	type SheetWidth,
}
