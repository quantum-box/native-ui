import { Maximize2, Minus, X } from 'lucide-react'
import {
	type HTMLAttributes,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from 'react'
import { cn } from '../../lib/utils'
import { Button } from './button'

export type FloatingPanelSize = { width: number; height: number }

const MIN_SIZE: FloatingPanelSize = { width: 320, height: 240 }

/** Keep a dragged size inside the viewport and above the minimum. */
export function clampFloatingPanelSize(
	size: FloatingPanelSize,
	viewport: FloatingPanelSize,
): FloatingPanelSize {
	return {
		width: Math.round(
			Math.min(Math.max(size.width, MIN_SIZE.width), viewport.width - 16),
		),
		height: Math.round(
			Math.min(Math.max(size.height, MIN_SIZE.height), viewport.height - 48),
		),
	}
}

function loadSize(key: string | undefined): FloatingPanelSize | null {
	if (!key) return null
	try {
		const raw = localStorage.getItem(key)
		return raw ? (JSON.parse(raw) as FloatingPanelSize) : null
	} catch {
		return null
	}
}

export type FloatingPanelLabels = {
	minimize: string
	restore: string
	close: string
	resize: string
}

const DEFAULT_LABELS: FloatingPanelLabels = {
	minimize: 'チャットを最小化',
	restore: 'チャットを元に戻す',
	close: 'チャットを閉じる',
	resize: 'ドラッグでサイズを変更',
}

export type FloatingPanelProps = {
	open: boolean
	onClose: () => void
	/** Accessible name of the panel region and its heading. */
	title: string
	icon?: ReactNode
	/** Shown next to the title while minimized, e.g. progress. */
	minimizedStatus?: ReactNode
	/** Buttons placed before minimize and close. */
	actions?: ReactNode
	children: ReactNode
	footer?: ReactNode
	/** Rendered over the panel, e.g. a drop target overlay. */
	overlay?: ReactNode
	id?: string
	/** Accessible name of the outer landmark. */
	landmarkLabel?: string
	/** Remember the dragged size under this localStorage key. */
	sizeStorageKey?: string
	minimized?: boolean
	onMinimizedChange?: (minimized: boolean) => void
	/** Extra props for the panel section, e.g. drag-and-drop handlers. */
	panelProps?: HTMLAttributes<HTMLElement>
	labels?: Partial<FloatingPanelLabels>
	/** Classes for the outer fixed strip, e.g. its bottom offset. */
	className?: string
}

/**
 * A window anchored to the bottom-right corner that the viewer can resize,
 * minimize and close. It fades while the page behind it scrolls.
 */
export function FloatingPanel({
	open,
	onClose,
	title,
	icon,
	minimizedStatus,
	actions,
	children,
	footer,
	overlay,
	id,
	landmarkLabel,
	sizeStorageKey,
	minimized: controlledMinimized,
	onMinimizedChange,
	panelProps,
	labels: labelOverrides,
	className,
}: FloatingPanelProps) {
	const labels = { ...DEFAULT_LABELS, ...labelOverrides }
	const [ownMinimized, setOwnMinimized] = useState(false)
	const minimized = controlledMinimized ?? ownMinimized
	const setMinimized = (value: boolean) => {
		setOwnMinimized(value)
		onMinimizedChange?.(value)
	}
	const [faded, setFaded] = useState(false)
	const [size, setSize] = useState(() => loadSize(sizeStorageKey))
	const panel = useRef<HTMLElement>(null)
	const resize = useRef<{
		x: number
		y: number
		start: FloatingPanelSize
	} | null>(null)

	useEffect(() => {
		if (!open) return
		const onScroll = (event: Event) => {
			if (!panel.current?.contains(event.target as Node)) setFaded(true)
		}
		// Capture: pages often scroll inside their own containers.
		document.addEventListener('scroll', onScroll, true)
		return () => document.removeEventListener('scroll', onScroll, true)
	}, [open])

	const storeSize = (value: FloatingPanelSize | null) => {
		if (!sizeStorageKey) return
		try {
			if (value) localStorage.setItem(sizeStorageKey, JSON.stringify(value))
			else localStorage.removeItem(sizeStorageKey)
		} catch {
			// The size is only a convenience.
		}
	}
	const onResizeStart = (event: ReactPointerEvent<HTMLDivElement>) => {
		const rect = panel.current?.getBoundingClientRect()
		if (!rect) return
		event.currentTarget.setPointerCapture(event.pointerId)
		resize.current = {
			x: event.clientX,
			y: event.clientY,
			start: { width: rect.width, height: rect.height },
		}
	}
	const onResizeMove = (event: ReactPointerEvent<HTMLDivElement>) => {
		const drag = resize.current
		if (!drag) return
		// Anchored bottom-right, so dragging up and left grows the panel.
		setSize(
			clampFloatingPanelSize(
				{
					width: drag.start.width - (event.clientX - drag.x),
					height: drag.start.height - (event.clientY - drag.y),
				},
				{ width: window.innerWidth, height: window.innerHeight },
			),
		)
	}
	const onResizeEnd = () => {
		if (!resize.current) return
		resize.current = null
		storeSize(size)
	}

	return (
		<aside
			aria-label={landmarkLabel ?? title}
			// The full-width strip is transparent; only the panel takes clicks.
			className={cn(
				'pointer-events-none fixed inset-x-0 bottom-0 z-40 [&>*]:pointer-events-auto',
				className,
			)}
			onKeyDown={event => {
				if (event.key === 'Escape' && open) {
					event.stopPropagation()
					onClose()
				}
			}}
		>
			{open ? (
				<section
					{...panelProps}
					ref={panel}
					aria-label={title}
					id={id}
					onPointerDown={event => {
						setFaded(false)
						panelProps?.onPointerDown?.(event)
					}}
					onFocus={event => {
						setFaded(false)
						panelProps?.onFocus?.(event)
					}}
					className={cn(
						'relative ml-auto flex w-full flex-col border border-border bg-background shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-opacity duration-200 sm:rounded-tl-lg',
						faded && 'opacity-30 hover:opacity-60',
						!minimized && 'h-[min(70dvh,640px)]',
						!size && 'sm:max-w-xl',
						panelProps?.className,
					)}
					style={
						size
							? {
									maxWidth: `min(${size.width}px, 100%)`,
									...(minimized
										? {}
										: { height: `min(${size.height}px, 100dvh - 3rem)` }),
								}
							: undefined
					}
				>
					{minimized ? null : (
						<div
							aria-hidden='true'
							title={labels.resize}
							className='absolute -left-1 -top-1 z-10 hidden size-4 cursor-nwse-resize touch-none sm:block'
							onPointerDown={onResizeStart}
							onPointerMove={onResizeMove}
							onPointerUp={onResizeEnd}
							onPointerCancel={onResizeEnd}
							onDoubleClick={() => {
								setSize(null)
								storeSize(null)
							}}
						/>
					)}
					<header
						className={cn(
							'flex items-center gap-2 px-3 py-2',
							!minimized && 'border-b',
						)}
					>
						{icon}
						<h2 className='min-w-0 flex-1 truncate text-sm font-semibold'>
							{title}
							{minimized && minimizedStatus ? (
								<span className='ml-2 font-normal text-xs text-muted-foreground'>
									{minimizedStatus}
								</span>
							) : null}
						</h2>
						{actions}
						<Button
							aria-label={minimized ? labels.restore : labels.minimize}
							onClick={() => setMinimized(!minimized)}
							size='icon'
							variant='ghost'
						>
							{minimized ? <Maximize2 /> : <Minus />}
						</Button>
						<Button
							aria-label={labels.close}
							onClick={onClose}
							size='icon'
							variant='ghost'
						>
							<X />
						</Button>
					</header>
					<div
						className={cn(
							'min-h-0 flex-1 overflow-y-auto p-4',
							minimized && 'hidden',
						)}
					>
						{children}
					</div>
					{footer ? (
						<div className={cn('border-t p-3', minimized && 'hidden')}>
							{footer}
						</div>
					) : null}
					{overlay}
				</section>
			) : null}
		</aside>
	)
}
