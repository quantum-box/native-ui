import { PanelLeft } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button, type ButtonProps } from './button'

/**
 * Shared open / hide / resize behaviour for the app sidebar.
 *
 * The sidebar is either fully open (resizable) or fully hidden — there is no
 * icon-only rail. When hidden, the app shows a `<SidebarToggle />` at the top
 * left of the content so people can bring it back.
 *
 *   const layout = useSidebarLayout({ storageKey: 'my-app.sidebar' })
 *   <SidebarPanel layout={layout} className='fixed inset-y-0 left-0'>
 *     <Sidebar>
 *       <SidebarHeader>… <SidebarToggle layout={layout} /></SidebarHeader>
 *     </Sidebar>
 *     <SidebarResizeHandle layout={layout} />
 *   </SidebarPanel>
 *   {layout.open ? null : <SidebarToggle layout={layout} className='fixed left-2 top-2' />}
 *   <main style={{ paddingLeft: layout.panelWidth }}>…</main>
 */

export const SIDEBAR_DEFAULT_WIDTH = 240
export const SIDEBAR_MIN_WIDTH = 180
export const SIDEBAR_MAX_WIDTH = 360
/** Shown to people next to the toggle. */
export const SIDEBAR_TOGGLE_SHORTCUT_LABEL = '⌘B'

const DRAG_THRESHOLD_PX = 4

export type SidebarLayoutPreference = Readonly<{
	open: boolean
	width: number
}>

export type SidebarLayoutStorage = Pick<Storage, 'getItem' | 'setItem'>

export type SidebarWidthLimits = Readonly<{
	defaultWidth?: number
	minWidth?: number
	maxWidth?: number
	/** Starting state when nothing is stored. Default true. */
	defaultOpen?: boolean
}>

function limitsOf(limits: SidebarWidthLimits = {}) {
	return {
		defaultWidth: limits.defaultWidth ?? SIDEBAR_DEFAULT_WIDTH,
		minWidth: limits.minWidth ?? SIDEBAR_MIN_WIDTH,
		maxWidth: limits.maxWidth ?? SIDEBAR_MAX_WIDTH,
	}
}

export function clampSidebarWidth(
	width: number,
	limits?: SidebarWidthLimits,
): number {
	const { defaultWidth, maxWidth, minWidth } = limitsOf(limits)
	if (!Number.isFinite(width)) return defaultWidth
	return Math.min(maxWidth, Math.max(minWidth, Math.round(width)))
}

function defaultStorage(): SidebarLayoutStorage | null {
	try {
		if (typeof window === 'undefined') return null
		return window.localStorage ?? null
	} catch {
		return null
	}
}

/**
 * Reads `{ open, width }`. Also accepts the older `{ collapsed, width }`
 * shape so people who had collapsed the sidebar keep it hidden.
 */
export function readSidebarLayoutPreference(
	storageKey: string,
	limits?: SidebarWidthLimits,
	storage: SidebarLayoutStorage | null = defaultStorage(),
): SidebarLayoutPreference {
	const fallback = {
		open: limits?.defaultOpen ?? true,
		width: limitsOf(limits).defaultWidth,
	}
	if (!storage) return fallback
	try {
		const raw = storage.getItem(storageKey)
		if (!raw) return fallback
		const parsed = JSON.parse(raw) as {
			open?: unknown
			collapsed?: unknown
			width?: unknown
		}
		if (typeof parsed.width !== 'number') return fallback
		const open =
			typeof parsed.open === 'boolean'
				? parsed.open
				: typeof parsed.collapsed === 'boolean'
					? !parsed.collapsed
					: null
		if (open === null) return fallback
		return { open, width: clampSidebarWidth(parsed.width, limits) }
	} catch {
		return fallback
	}
}

export function writeSidebarLayoutPreference(
	storageKey: string,
	preference: SidebarLayoutPreference,
	limits?: SidebarWidthLimits,
	storage: SidebarLayoutStorage | null = defaultStorage(),
): void {
	if (!storage) return
	try {
		storage.setItem(
			storageKey,
			JSON.stringify({
				open: preference.open,
				width: clampSidebarWidth(preference.width, limits),
			}),
		)
	} catch {
		// Best effort: quota or privacy mode may block storage.
	}
}

type ShortcutEvent = Pick<
	KeyboardEvent,
	'key' | 'code' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'
>

/** ⌘B on macOS, Ctrl+B elsewhere. */
export function isSidebarToggleShortcut(event: ShortcutEvent): boolean {
	if (event.altKey || event.shiftKey) return false
	if (!(event.metaKey || event.ctrlKey)) return false
	return event.code === 'KeyB' || event.key.toLowerCase() === 'b'
}

function isEditableTarget(target: EventTarget | null): boolean {
	if (!(target instanceof HTMLElement)) return false
	if (target.isContentEditable) return true
	const tag = target.tagName
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

export type UseSidebarLayoutOptions = SidebarWidthLimits & {
	/** localStorage key. Omit to keep the state in memory only. */
	storageKey?: string
	/** Listen for ⌘B / Ctrl+B. Default true. */
	shortcut?: boolean
}

type DragState = {
	pointerId: number
	originX: number
	originWidth: number
	startedOpen: boolean
	moved: boolean
}

export type SidebarLayout = Readonly<{
	open: boolean
	/** Remembered width, also while hidden. */
	width: number
	/** Width the panel takes on screen: 0 while hidden. */
	panelWidth: number
	/** True while the resize handle is being dragged (turn off transitions). */
	dragging: boolean
	setOpen: (open: boolean) => void
	toggle: () => void
	resizeHandleProps: Pick<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		| 'onPointerDown'
		| 'onPointerMove'
		| 'onPointerUp'
		| 'onPointerCancel'
		| 'onKeyDown'
	>
}>

export function useSidebarLayout(
	options: UseSidebarLayoutOptions = {},
): SidebarLayout {
	const { shortcut = true, storageKey } = options
	const limits: SidebarWidthLimits = {
		defaultOpen: options.defaultOpen,
		defaultWidth: options.defaultWidth,
		maxWidth: options.maxWidth,
		minWidth: options.minWidth,
	}
	const limitsRef = React.useRef(limits)
	limitsRef.current = limits

	const [preference, setPreference] = React.useState<SidebarLayoutPreference>(
		() =>
			storageKey
				? readSidebarLayoutPreference(storageKey, limits)
				: {
						open: limits.defaultOpen ?? true,
						width: limitsOf(limits).defaultWidth,
					},
	)
	const [dragging, setDragging] = React.useState(false)
	const dragRef = React.useRef<DragState | null>(null)

	React.useEffect(() => {
		if (storageKey) {
			writeSidebarLayoutPreference(storageKey, preference, limitsRef.current)
		}
	}, [preference, storageKey])

	const setOpen = React.useCallback((open: boolean) => {
		setPreference(current =>
			current.open === open ? current : { ...current, open },
		)
	}, [])
	const toggle = React.useCallback(() => {
		setPreference(current => ({ ...current, open: !current.open }))
	}, [])

	React.useEffect(() => {
		if (!shortcut) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || !isSidebarToggleShortcut(event)) return
			if (isEditableTarget(event.target)) return
			event.preventDefault()
			toggle()
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [shortcut, toggle])

	const finishDrag = (event: React.PointerEvent<HTMLButtonElement>) => {
		const drag = dragRef.current
		if (!drag || drag.pointerId !== event.pointerId) return
		if (event.currentTarget.hasPointerCapture(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId)
		}
		// A click without dragging hides or shows the sidebar.
		if (!drag.moved && event.type === 'pointerup') toggle()
		dragRef.current = null
		setDragging(false)
	}

	const resizeHandleProps: SidebarLayout['resizeHandleProps'] = {
		onPointerDown: event => {
			if (event.button !== 0) return
			event.preventDefault()
			event.currentTarget.setPointerCapture(event.pointerId)
			dragRef.current = {
				moved: false,
				originWidth: preference.width,
				originX: event.clientX,
				pointerId: event.pointerId,
				startedOpen: preference.open,
			}
			setDragging(true)
		},
		onPointerMove: event => {
			const drag = dragRef.current
			if (!drag || drag.pointerId !== event.pointerId) return
			const delta = event.clientX - drag.originX
			if (!drag.moved && Math.abs(delta) < DRAG_THRESHOLD_PX) return
			drag.moved = true
			if (!drag.startedOpen) {
				// Dragging out from the hidden edge opens it at the dragged width.
				if (delta <= 0) return
				setPreference({
					open: true,
					width: clampSidebarWidth(delta, limitsRef.current),
				})
				return
			}
			setPreference(current => ({
				...current,
				width: clampSidebarWidth(drag.originWidth + delta, limitsRef.current),
			}))
		},
		onPointerUp: finishDrag,
		onPointerCancel: finishDrag,
		onKeyDown: event => {
			const step = event.shiftKey ? 40 : 10
			if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
				event.preventDefault()
				const delta = event.key === 'ArrowLeft' ? -step : step
				setPreference(current => ({
					open: true,
					width: clampSidebarWidth(current.width + delta, limitsRef.current),
				}))
			}
		},
	}

	return {
		dragging,
		open: preference.open,
		panelWidth: preference.open ? preference.width : 0,
		resizeHandleProps,
		setOpen,
		toggle,
		width: preference.width,
	}
}

export interface SidebarPanelProps
	extends React.HTMLAttributes<HTMLDivElement> {
	layout: SidebarLayout
}

/**
 * Holds the Sidebar and its resize handle. Animates between the stored width
 * and 0; while hidden its contents are `inert` so focus never lands there.
 * Position it (fixed / sticky / in a flex row) with `className`.
 */
const SidebarPanel = React.forwardRef<HTMLDivElement, SidebarPanelProps>(
	({ className, layout, style, children, ...props }, ref) => (
		<div
			ref={ref}
			data-state={layout.open ? 'open' : 'closed'}
			data-dragging={layout.dragging || undefined}
			className={cn(
				'relative shrink-0 transition-[width] duration-slow ease-in-out data-[dragging]:transition-none',
				className,
			)}
			style={{ width: layout.panelWidth, ...style }}
			{...props}
		>
			<div
				className='h-full overflow-hidden'
				// React 18 types lack `inert`; the attribute is what browsers read.
				{...(layout.open ? {} : { inert: '' as unknown as boolean })}
				aria-hidden={layout.open ? undefined : true}
			>
				<div className='h-full' style={{ width: layout.width }}>
					{children}
				</div>
			</div>
			<SidebarResizeHandle layout={layout} />
		</div>
	),
)
SidebarPanel.displayName = 'SidebarPanel'

export interface SidebarResizeHandleProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	layout: SidebarLayout
}

/** Thin strip on the panel's right edge: drag to resize, click to hide/show. */
const SidebarResizeHandle = React.forwardRef<
	HTMLButtonElement,
	SidebarResizeHandleProps
>(({ className, layout, ...props }, ref) => (
	<button
		ref={ref}
		type='button'
		aria-expanded={layout.open}
		aria-label={
			layout.open
				? 'サイドバーの幅を変える。クリックで隠す'
				: 'サイドバーを開く'
		}
		className={cn(
			'absolute inset-y-0 right-0 z-10 w-1.5 translate-x-1/2 cursor-col-resize touch-none border-0 bg-transparent p-0 transition-colors hover:bg-primary/20 focus-visible:bg-primary/25 focus-visible:outline-none',
			className,
		)}
		{...layout.resizeHandleProps}
		{...props}
	/>
))
SidebarResizeHandle.displayName = 'SidebarResizeHandle'

export interface SidebarToggleProps extends Omit<ButtonProps, 'children'> {
	layout: SidebarLayout
}

/**
 * Icon button that hides / shows the sidebar. Put one in the sidebar header
 * (to hide) and one at the top left of the content while hidden (to open).
 */
const SidebarToggle = React.forwardRef<HTMLButtonElement, SidebarToggleProps>(
	({ className, layout, onClick, ...props }, ref) => {
		const label = layout.open ? 'サイドバーを隠す' : 'サイドバーを開く'
		return (
			<Button
				ref={ref}
				type='button'
				size='icon'
				variant='ghost'
				aria-expanded={layout.open}
				aria-keyshortcuts='Meta+B Control+B'
				aria-label={label}
				title={`${label} (${SIDEBAR_TOGGLE_SHORTCUT_LABEL})`}
				className={cn('shrink-0 text-muted-foreground', className)}
				onClick={event => {
					onClick?.(event)
					if (!event.defaultPrevented) layout.toggle()
				}}
				{...props}
			>
				<PanelLeft />
			</Button>
		)
	},
)
SidebarToggle.displayName = 'SidebarToggle'

export { SidebarPanel, SidebarResizeHandle, SidebarToggle }
