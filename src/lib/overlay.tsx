'use client'

import * as React from 'react'

import { Slot } from './slot'

/**
 * 重なる物（Dialog・Popover・Tooltip・DropdownMenu など）を base-ui で作るときの、
 * Radix と同じ使い方を残すための道具。
 *
 * - `compatRender`: base-ui の `render` に渡す関数を作る。Radix と同じ
 *   `data-state` などの属性を足し、`asChild` なら子の要素を使う。
 * - `useDismissCompat` / `useDismissHandlers`: Radix の `onEscapeKeyDown`・
 *   `onPointerDownOutside`・`onFocusOutside`・`onInteractOutside` を、base-ui の
 *   `onOpenChange` の理由（reason）から呼ぶ。`preventDefault()` で閉じるのを止められる。
 * - `useRadixOpenFocus` / `useRadixCloseFocus` / `radixLoopTab`: 開いた・閉じたときの
 *   フォーカスと Tab の動きを Radix と同じにする（`onOpenAutoFocus`・`onCloseAutoFocus` も受ける）。
 * - `positionerCompat`: Radix の位置の props（`side`・`align`・`sideOffset` など）を、
 *   base-ui の Positioner の props に直す。
 */

type Attrs = Record<string, string | undefined>
type RenderProps = React.HTMLAttributes<HTMLElement> & {
	ref?: React.Ref<HTMLElement>
}

export function compatRender<State>(
	tag: keyof React.JSX.IntrinsicElements,
	asChild: boolean | undefined,
	child: React.ReactNode,
	attrs: (state: State) => Attrs,
) {
	return (props: RenderProps, state: State) => {
		const extra = attrs(state)
		if (asChild) {
			const { children: _ignored, ...rest } = props
			return (
				<Slot {...rest} {...extra}>
					{child}
				</Slot>
			)
		}
		return React.createElement(tag, { ...props, ...extra })
	}
}

/** `open` の真偽を Radix の `data-state`（open／closed）に直す */
export const openState = (state: { open: boolean }): Attrs => ({
	'data-state': state.open ? 'open' : 'closed',
})

/** asChild の子が <button> でないときは、base-ui に知らせる（nativeButton={false}） */
export function isNativeButtonChild(
	asChild: boolean | undefined,
	child: React.ReactNode,
) {
	if (!asChild || !React.isValidElement(child)) return true
	return typeof child.type !== 'string' || child.type === 'button'
}

export interface DismissHandlers {
	/** Esc で閉じる前に呼ぶ。`preventDefault()` で閉じない */
	onEscapeKeyDown?(event: KeyboardEvent): void
	/** 外側を押して閉じる前に呼ぶ。`preventDefault()` で閉じない */
	onPointerDownOutside?(event: Event): void
	/** フォーカスが外へ出て閉じる前に呼ぶ。`preventDefault()` で閉じない */
	onFocusOutside?(event: Event): void
	/** 外側を押した・フォーカスが外へ出たときに呼ぶ。`preventDefault()` で閉じない */
	onInteractOutside?(event: Event): void
}

interface DismissState {
	handlers: React.MutableRefObject<DismissHandlers>
	/** 外を押した・フォーカスが外へ出たことで閉じたか */
	closedOutside: React.MutableRefObject<boolean>
	modal: boolean
	/** 開くボタン（ここへのフォーカスは外とみなさない。Radix と同じ） */
	triggers: Set<Element>
	/** フォーカスが外へ出たので閉じる（Radix の onFocusOutside） */
	closeOnFocusOutside: (event: FocusEvent) => void
}

const DismissContext = React.createContext<DismissState | null>(null)

interface ChangeDetails {
	reason: string
	event: Event
	cancel: () => void
}

/** 呼んだ先で preventDefault() されたかを、前から止まっていた物と分けて調べる */
function callAndCheckPrevented(
	fn: ((event: never) => void) | undefined,
	event: Event | undefined,
) {
	if (!fn || !event) return false
	let prevented = false
	const original = event.preventDefault
	Object.defineProperty(event, 'preventDefault', {
		configurable: true,
		value: () => {
			prevented = true
			original.call(event)
		},
	})
	try {
		fn(event as never)
	} finally {
		Reflect.deleteProperty(event, 'preventDefault')
	}
	return prevented
}

/**
 * Root で使う。中の Content が出した閉じる前の呼び出しを受け、
 * Radix の `onOpenChange(open)` の形で外へ知らせる。
 */
export function useDismissCompat(
	onOpenChange: ((open: boolean) => void) | undefined,
	beforeChange?: (open: boolean, details: ChangeDetails) => boolean,
	modal = false,
) {
	const handlers = React.useRef<DismissHandlers>({})
	const closedOutside = React.useRef(false)
	const actionsRef = React.useRef<{ close: () => void } | null>(null)
	/** 自分で閉じるとき（フォーカスが外へ出た）は、base-ui からの理由をこれで読み替える */
	const forcedReason = React.useRef<string | null>(null)
	const handleOpenChange = React.useCallback(
		(open: boolean, rawDetails: ChangeDetails) => {
			const forced = forcedReason.current
			forcedReason.current = null
			if (forced && !open) {
				closedOutside.current = true
				onOpenChange?.(false)
				return
			}
			const details = rawDetails
			if (beforeChange && !beforeChange(open, details)) {
				details.cancel()
				return
			}
			// Radix は指で押したとき（pointerdown）だけを「外を押した」とみなす。
			// base-ui は click でも閉じるので、キーボードから出た click（Enter でリンクを
			// 押したときなど。detail が 0）は外を押したことにしない
			if (
				!open &&
				details.reason === 'outside-press' &&
				details.event?.type === 'click' &&
				(details.event as MouseEvent).detail === 0
			) {
				details.cancel()
				return
			}
			closedOutside.current =
				!open &&
				(details.reason === 'outside-press' || details.reason === 'focus-out')
			if (!open) {
				const h = handlers.current
				const event = details.event
				let prevented = false
				if (details.reason === 'escape-key') {
					prevented = callAndCheckPrevented(h.onEscapeKeyDown, event)
				} else if (details.reason === 'outside-press') {
					prevented = callAndCheckPrevented(h.onPointerDownOutside, event)
					prevented =
						callAndCheckPrevented(h.onInteractOutside, event) || prevented
				} else if (details.reason === 'focus-out') {
					prevented = callAndCheckPrevented(h.onFocusOutside, event)
					prevented =
						callAndCheckPrevented(h.onInteractOutside, event) || prevented
				}
				if (prevented) {
					details.cancel()
					return
				}
			}
			onOpenChange?.(open)
		},
		[onOpenChange, beforeChange],
	)
	const closeOnFocusOutside = React.useCallback((event: FocusEvent) => {
		const h = handlers.current
		let prevented = callAndCheckPrevented(h.onFocusOutside, event)
		prevented = callAndCheckPrevented(h.onInteractOutside, event) || prevented
		if (prevented) return
		forcedReason.current = 'focus-out'
		actionsRef.current?.close()
		forcedReason.current = null
	}, [])
	const value = React.useMemo(
		() => ({
			handlers,
			closedOutside,
			modal,
			triggers: new Set<Element>(),
			closeOnFocusOutside,
		}),
		[modal, closeOnFocusOutside],
	)
	const Provider = React.useCallback(
		({ children }: { children?: React.ReactNode }) => (
			<DismissContext.Provider value={value}>
				{children}
			</DismissContext.Provider>
		),
		[value],
	)
	return { handleOpenChange, DismissProvider: Provider, actionsRef }
}

/** Trigger で使う。開くボタンを覚えておく（ここへのフォーカスは外とみなさない） */
export function useRegisterTrigger() {
	const context = React.useContext(DismissContext)
	const current = React.useRef<Element | null>(null)
	return React.useCallback(
		(el: Element | null) => {
			if (!context) return
			if (current.current) context.triggers.delete(current.current)
			current.current = el
			if (el) context.triggers.add(el)
		},
		[context],
	)
}

/** Content で使う。閉じる前の呼び出しを Root に渡す */
export function useDismissHandlers(handlers: DismissHandlers, enabled = true) {
	const context = React.useContext(DismissContext)
	if (context && enabled) context.handlers.current = handlers
}

/**
 * 閉じたときのフォーカスを Radix と同じにする。ふつうは開いたボタンへ戻すが、
 * modal でない物で、開いているあいだに外を押した・フォーカスが外へ出たときは戻さない
 * （閉じた理由が何でも。たとえば外から open を false にされたときも）。
 * `onCloseAutoFocus` で `preventDefault()` されたら動かさない。
 *
 * 返す `popupRef` を中身の要素に付ける（外かどうかを調べるため）。
 */
export function useRadixCloseFocus(
	onCloseAutoFocus: ((event: Event) => void) | undefined,
) {
	const context = React.useContext(DismissContext)
	const interactedOutside = React.useRef(false)
	const [popup, setPopup] = React.useState<HTMLElement | null>(null)
	// React の木の上で中身の中（ポータルの先の入れ子の物も含む）で起きたイベント。
	// Radix と同じく、入れ子の重なる物へ移っても「外」とはみなさない
	const insideEvent = React.useRef<Event | null>(null)
	const markInside = React.useCallback((event: React.SyntheticEvent) => {
		insideEvent.current = event.nativeEvent
	}, [])
	React.useEffect(() => {
		if (!popup || !context) return
		interactedOutside.current = false
		const isInside = (event: Event) =>
			insideEvent.current === event ||
			popup.contains(event.target as Node | null)
		const onPointerDown = (event: Event) => {
			if (!isInside(event)) interactedOutside.current = true
		}
		const onFocusIn = (event: FocusEvent) => {
			if (isInside(event)) return
			const target = event.target as Element | null
			if (target?.hasAttribute?.('data-base-ui-focus-guard')) return
			interactedOutside.current = true
			if (context.modal) return
			for (const trigger of context.triggers)
				if (target && trigger.contains(target)) return
			context.closeOnFocusOutside(event)
		}
		// React の中のイベントの後に見るため、document の泡立ちの段で受ける
		document.addEventListener('pointerdown', onPointerDown)
		document.addEventListener('focusin', onFocusIn)
		return () => {
			document.removeEventListener('pointerdown', onPointerDown)
			document.removeEventListener('focusin', onFocusIn)
		}
	}, [popup, context])
	const finalFocus = React.useCallback(() => {
		if (onCloseAutoFocus) {
			const event = new Event('focusScope.autoFocusOnUnmount', {
				cancelable: true,
			})
			onCloseAutoFocus(event)
			if (event.defaultPrevented) return false
		}
		if (
			context &&
			!context.modal &&
			(context.closedOutside.current || interactedOutside.current)
		)
			return false
		return true
	}, [onCloseAutoFocus, context])
	return {
		finalFocus,
		popupRef: setPopup,
		popup,
		/** 中身の要素に付ける（onFocusCapture・onPointerDownCapture） */
		insideProps: {
			onFocusCapture: markInside,
			onPointerDownCapture: markInside,
		},
	}
}

/**
 * base-ui は、modal でない Popover のそばに見えないフォーカスの番人（focus guard）を置き、
 * 開いているあいだ Trigger から Tab で中身へ入るようにしている。Radix には無い動きで、
 * Tab はふつうのページの順に進む。ここでは、中身の外にフォーカスがあるときの Tab を、
 * 番人を飛ばしたふつうの順に戻す。
 */
export function useNaturalTabOrder(
	popup: HTMLElement | null,
	enabled: boolean,
) {
	React.useEffect(() => {
		if (!popup || !enabled) return
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey)
				return
			const active = document.activeElement as HTMLElement | null
			if (!active || popup.contains(active)) return
			const all = radixTabbables(document.body).filter(
				el => !el.hasAttribute('data-base-ui-focus-guard'),
			)
			const index = all.indexOf(active)
			if (index === -1) return
			const next = all[index + (event.shiftKey ? -1 : 1)]
			if (!next) return
			event.preventDefault()
			next.focus()
		}
		document.addEventListener('keydown', onKeyDown, true)
		return () => document.removeEventListener('keydown', onKeyDown, true)
	}, [popup, enabled])
}

/** いくつかの ref を 1 つにまとめる */
export function useMergedRefs<T>(
	...refs: Array<React.Ref<T> | undefined>
): React.RefCallback<T> {
	return React.useCallback((el: T | null) => {
		for (const ref of refs) {
			if (typeof ref === 'function') ref(el)
			else if (ref) (ref as React.MutableRefObject<T | null>).current = el
		}
	}, refs)
}

/** Radix の FocusScope と同じ、Tab で止まる物の一覧（見えない物は除く） */
function radixTabbables(container: HTMLElement) {
	const nodes: HTMLElement[] = []
	const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT, {
		acceptNode: node => {
			const el = node as HTMLElement & { disabled?: boolean; type?: string }
			const isHiddenInput = el.tagName === 'INPUT' && el.type === 'hidden'
			if (el.disabled || el.hidden || isHiddenInput)
				return NodeFilter.FILTER_SKIP
			return el.tabIndex >= 0
				? NodeFilter.FILTER_ACCEPT
				: NodeFilter.FILTER_SKIP
		},
	})
	while (walker.nextNode()) nodes.push(walker.currentNode as HTMLElement)
	const isHidden = (el: HTMLElement) => {
		if (getComputedStyle(el).visibility === 'hidden') return true
		for (
			let n: HTMLElement | null = el;
			n && n !== container;
			n = n.parentElement
		)
			if (getComputedStyle(n).display === 'none') return true
		return false
	}
	return nodes.filter(el => !isHidden(el))
}

function focusAndSelect(el: HTMLElement) {
	el.focus({ preventScroll: true })
	if (el instanceof HTMLInputElement) el.select()
}

/**
 * Radix の FocusScope（loop）と同じく、Tab で中身の端まで来たら反対の端へ戻す。
 * 中に止まる物が無く、中身そのものにフォーカスがあるときは Tab で外へ出さない。
 */
export function radixLoopTab(event: React.KeyboardEvent<HTMLElement>) {
	if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey)
		return
	const container = event.currentTarget
	const focused = document.activeElement
	const all = radixTabbables(container)
	if (all.length === 0) {
		if (focused === container) event.preventDefault()
		return
	}
	const first = all[0]
	const last = all[all.length - 1]
	if (!event.shiftKey && focused === last) {
		event.preventDefault()
		focusAndSelect(first)
	} else if (event.shiftKey && focused === first) {
		event.preventDefault()
		focusAndSelect(last)
	}
}

/**
 * 開いたときのフォーカスを決める。中の最初の操作できる物（リンクと、部品が自分で付ける
 * 右上の × は除く）へ置き、文字の入力欄なら中の文字を選ぶ。無ければ中身そのものへ置く。
 * × を除くのは、開いた直後に Enter や Space を押して、そのまま閉じてしまわないため。
 * Tab では × にも止まる。
 * `onOpenAutoFocus` で `preventDefault()` されたら動かさない。
 */
/** Dialog・Sheet が自分で付ける右上の × の印。開いたときのフォーカスの先から外す。 */
export const CORNER_CLOSE_ATTR = 'data-corner-close'

export function useRadixOpenFocus<T extends HTMLElement>(
	onOpenAutoFocus: ((event: Event) => void) | undefined,
	forwardedRef: React.ForwardedRef<T>,
) {
	const popupRef = React.useRef<T | null>(null)
	const ref = React.useCallback(
		(el: T | null) => {
			popupRef.current = el
			if (typeof forwardedRef === 'function') forwardedRef(el)
			else if (forwardedRef) forwardedRef.current = el
		},
		[forwardedRef],
	)
	const initialFocus = React.useCallback(() => {
		if (onOpenAutoFocus) {
			const event = new Event('focusScope.autoFocusOnMount', {
				cancelable: true,
			})
			onOpenAutoFocus(event)
			if (event.defaultPrevented) return false
		}
		const container = popupRef.current
		if (!container) return true
		const before = document.activeElement
		// Radix と同じく、はじめはリンクには置かない。右上の × にも置かない
		const candidates = radixTabbables(container).filter(
			el => el.tagName !== 'A' && !el.hasAttribute(CORNER_CLOSE_ATTR),
		)
		for (const candidate of candidates) {
			candidate.focus({ preventScroll: true })
			if (document.activeElement !== before) {
				if (candidate instanceof HTMLInputElement) candidate.select()
				return false
			}
		}
		container.focus({ preventScroll: true })
		return false
	}, [onOpenAutoFocus])
	return { ref, initialFocus }
}

export interface PositionProps {
	side?: 'top' | 'right' | 'bottom' | 'left'
	sideOffset?: number
	align?: 'start' | 'center' | 'end'
	alignOffset?: number
	avoidCollisions?: boolean
	collisionBoundary?: Element | null | Array<Element | null>
	collisionPadding?:
		| number
		| Partial<Record<'top' | 'right' | 'bottom' | 'left', number>>
	sticky?: 'partial' | 'always'
	hideWhenDetached?: boolean
}

/** Radix の位置の props を base-ui の Positioner の props に直す（既定も Radix に合わせる） */
export function positionerCompat(
	{
		side = 'bottom',
		sideOffset = 0,
		align = 'center',
		alignOffset = 0,
		avoidCollisions = true,
		collisionBoundary,
		collisionPadding = 0,
		sticky = 'partial',
	}: PositionProps,
	defaults?: Pick<PositionProps, 'side' | 'align'>,
) {
	// Radix は、指定が無ければ画面（viewport）の端だけを見て位置をずらす。
	// base-ui の既定はスクロールする親の端も見るので、空の配列を渡して Radix に合わせる
	const boundary = Array.isArray(collisionBoundary)
		? collisionBoundary.filter((el): el is Element => el != null)
		: collisionBoundary
			? [collisionBoundary]
			: []
	return {
		side: side ?? defaults?.side,
		sideOffset,
		align: align ?? defaults?.align,
		alignOffset,
		collisionPadding,
		collisionBoundary: boundary,
		sticky: sticky === 'always',
		// Radix と同じく、はみ出すときは上下（左右）を反対へ返し、揃え方は変えずに
		// はみ出さない所まで滑らせる（base-ui の既定は揃え方も反対へ返す）
		collisionAvoidance: avoidCollisions
			? ({ side: 'flip', align: 'shift', fallbackAxisSide: 'none' } as const)
			: ({ side: 'none', align: 'none' } as const),
	}
}

/** Radix のときの CSS 変数の名前も使えるようにする（中身は base-ui の変数） */
export function radixCssVars(prefix: string): React.CSSProperties {
	return {
		[`--radix-${prefix}-content-transform-origin`]: 'var(--transform-origin)',
		[`--radix-${prefix}-content-available-width`]: 'var(--available-width)',
		[`--radix-${prefix}-content-available-height`]: 'var(--available-height)',
		[`--radix-${prefix}-trigger-width`]: 'var(--anchor-width)',
		[`--radix-${prefix}-trigger-height`]: 'var(--anchor-height)',
	} as React.CSSProperties
}
