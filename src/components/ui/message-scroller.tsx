'use client'

import { ArrowDown } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'
import { Button, type ButtonProps } from './button'

/*
 * 会話の流れをスクロールして見せる枠。
 * - 開いたときは、いちばん新しい発言（下端）を見せる。
 * - `scrollAnchor` を付けた発言が新しく足されると、その発言を枠の上端に合わせる
 *   （質問を上に置いて、下に答えが伸びていく見せ方）。
 * - `autoScroll` を付けると、下端を見ている間は答えが伸びるのに合わせて下へ付いていく。
 *   上へ戻って読んでいるときは動かさない。
 * - 下端から離れると、下端へ戻るボタンが出る。
 * shadcn の message-scroller と同じ形で使えるよう、外の部品に頼らず作ってある。
 */

/** 端から何 px 以内なら「端にいる」と見なすか。 */
const EDGE_THRESHOLD = 8

interface MessageScrollerState {
	/** 上端を見ているか。 */
	atStart: boolean
	/** 下端を見ているか。 */
	atEnd: boolean
	/** 中身が枠より長く、スクロールできるか。 */
	scrollable: boolean
}

interface MessageScrollerContextValue extends MessageScrollerState {
	autoScroll: boolean
	viewportRef: React.MutableRefObject<HTMLDivElement | null>
	/** 下端を見ていたか（中身が伸びる直前の状態）。 */
	pinnedRef: React.MutableRefObject<boolean>
	/** 最初の表示が済んだか。済む前に足された発言には合わせない。 */
	readyRef: React.MutableRefObject<boolean>
	/** いちばん新しく上端に合わせた発言。 */
	anchorRef: React.MutableRefObject<HTMLElement | null>
	/** 発言の下に足す余白。最後の質問も上端まで上げられるようにする。 */
	spacerRef: React.MutableRefObject<HTMLDivElement | null>
	/** 余白の高さを今の中身に合わせて計り直す。 */
	fitSpacer: () => void
	update: () => void
	scrollToEnd: (behavior?: ScrollBehavior) => void
	scrollToStart: (behavior?: ScrollBehavior) => void
	scrollToMessage: (messageId: string, behavior?: ScrollBehavior) => void
}

const MessageScrollerContext =
	React.createContext<MessageScrollerContextValue | null>(null)

function useMessageScrollerContext(part: string) {
	const context = React.useContext(MessageScrollerContext)
	if (!context) {
		throw new Error(`${part} は MessageScrollerProvider の中で使ってください。`)
	}
	return context
}

interface MessageScrollerProviderProps {
	/** 下端を見ている間、中身が伸びるのに合わせて下へ付いていく。 */
	autoScroll?: boolean
	children: React.ReactNode
}

/** 枠の状態を持つ。`MessageScroller` とボタン・フックはこの中に置く。 */
function MessageScrollerProvider({
	autoScroll = false,
	children,
}: MessageScrollerProviderProps) {
	const viewportRef = React.useRef<HTMLDivElement | null>(null)
	const pinnedRef = React.useRef(true)
	const readyRef = React.useRef(false)
	const anchorRef = React.useRef<HTMLElement | null>(null)
	const spacerRef = React.useRef<HTMLDivElement | null>(null)
	const [state, setState] = React.useState<MessageScrollerState>({
		atStart: true,
		atEnd: true,
		scrollable: false,
	})

	const update = React.useCallback(() => {
		const viewport = viewportRef.current
		if (!viewport) return
		const { scrollTop, scrollHeight, clientHeight } = viewport
		const next = {
			atStart: scrollTop <= EDGE_THRESHOLD,
			atEnd: scrollHeight - scrollTop - clientHeight <= EDGE_THRESHOLD,
			scrollable: scrollHeight > clientHeight + EDGE_THRESHOLD,
		}
		pinnedRef.current = next.atEnd
		setState(previous =>
			previous.atStart === next.atStart &&
			previous.atEnd === next.atEnd &&
			previous.scrollable === next.scrollable
				? previous
				: next,
		)
	}, [])

	const fitSpacer = React.useCallback(() => {
		const viewport = viewportRef.current
		const spacer = spacerRef.current
		const anchor = anchorRef.current
		const content = spacer?.parentElement
		const last = spacer?.previousElementSibling
		if (!viewport || !spacer) return
		if (!anchor?.isConnected || !content || !last) {
			spacer.style.display = 'none'
			return
		}
		// 質問の上端から中身の下端までが枠の高さに足りない分だけ、余白を足す。
		const style = getComputedStyle(content)
		const gap = Number.parseFloat(style.rowGap) || 0
		const paddingBottom = Number.parseFloat(style.paddingBottom) || 0
		const below =
			last.getBoundingClientRect().bottom - anchor.getBoundingClientRect().top
		const height = viewport.clientHeight - below - paddingBottom - gap
		spacer.style.display = height > 0 ? 'block' : 'none'
		spacer.style.height = `${Math.max(0, height)}px`
	}, [])

	const scrollToEnd = React.useCallback(
		(behavior: ScrollBehavior = 'smooth') => {
			const viewport = viewportRef.current
			if (!viewport) return
			pinnedRef.current = true
			viewport.scrollTo({ top: viewport.scrollHeight, behavior })
		},
		[],
	)

	const scrollToStart = React.useCallback(
		(behavior: ScrollBehavior = 'smooth') => {
			viewportRef.current?.scrollTo({ top: 0, behavior })
		},
		[],
	)

	const scrollToMessage = React.useCallback(
		(messageId: string, behavior: ScrollBehavior = 'smooth') => {
			const viewport = viewportRef.current
			if (!viewport) return
			const item = Array.from(
				viewport.querySelectorAll<HTMLElement>('[data-message-id]'),
			).find(element => element.dataset.messageId === messageId)
			if (!item) return
			const top =
				item.getBoundingClientRect().top -
				viewport.getBoundingClientRect().top +
				viewport.scrollTop
			viewport.scrollTo({ top, behavior })
		},
		[],
	)

	const value = React.useMemo<MessageScrollerContextValue>(
		() => ({
			...state,
			autoScroll,
			viewportRef,
			pinnedRef,
			readyRef,
			anchorRef,
			spacerRef,
			fitSpacer,
			update,
			scrollToEnd,
			scrollToStart,
			scrollToMessage,
		}),
		[
			state,
			autoScroll,
			fitSpacer,
			update,
			scrollToEnd,
			scrollToStart,
			scrollToMessage,
		],
	)

	return (
		<MessageScrollerContext.Provider value={value}>
			{children}
		</MessageScrollerContext.Provider>
	)
}

/** 枠の外側。ボタンを重ねて置けるよう `relative` になっている。 */
function MessageScroller({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot='message-scroller'
			className={cn(
				'group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden',
				className,
			)}
			{...props}
		/>
	)
}

/** スクロールする部分。 */
function MessageScrollerViewport({
	className,
	onScroll,
	...props
}: React.ComponentProps<'div'>) {
	const { viewportRef, update, scrollToEnd, readyRef } =
		useMessageScrollerContext('MessageScrollerViewport')

	// 開いたときは下端から見せる。描く前に合わせるので、ちらつかない。
	React.useLayoutEffect(() => {
		scrollToEnd('instant')
		update()
		readyRef.current = true
		return () => {
			readyRef.current = false
		}
	}, [scrollToEnd, update, readyRef])

	return (
		<div
			ref={viewportRef}
			data-slot='message-scroller-viewport'
			className={cn(
				'size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]',
				className,
			)}
			onScroll={event => {
				update()
				onScroll?.(event)
			}}
			{...props}
		/>
	)
}

/** 発言を縦に並べる部分。中身が伸びたら、必要に応じて下へ付いていく。 */
function MessageScrollerContent({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) {
	const { autoScroll, fitSpacer, pinnedRef, scrollToEnd, spacerRef, update } =
		useMessageScrollerContext('MessageScrollerContent')
	const contentRef = React.useRef<HTMLDivElement | null>(null)

	React.useEffect(() => {
		const content = contentRef.current
		if (!content || typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(() => {
			fitSpacer()
			if (autoScroll && pinnedRef.current) scrollToEnd('instant')
			update()
		})
		observer.observe(content)
		return () => observer.disconnect()
	}, [autoScroll, fitSpacer, pinnedRef, scrollToEnd, update])

	return (
		<div
			ref={contentRef}
			data-slot='message-scroller-content'
			className={cn('flex h-max min-h-full flex-col gap-6', className)}
			{...props}
		>
			{children}
			<div
				aria-hidden
				className='pointer-events-none hidden shrink-0'
				data-slot='message-scroller-spacer'
				ref={spacerRef}
			/>
		</div>
	)
}

interface MessageScrollerItemProps extends React.ComponentProps<'div'> {
	/** 発言を見分ける名前。`scrollToMessage` で使う。 */
	messageId?: string
	/** 新しく足されたとき、この発言を枠の上端に合わせる。 */
	scrollAnchor?: boolean
}

/** 発言 1 件（またはひとまとまり）を包む。 */
function MessageScrollerItem({
	className,
	messageId,
	scrollAnchor = false,
	...props
}: MessageScrollerItemProps) {
	const {
		anchorRef,
		autoScroll,
		fitSpacer,
		pinnedRef,
		readyRef,
		scrollToEnd,
		viewportRef,
	} = useMessageScrollerContext('MessageScrollerItem')
	const itemRef = React.useRef<HTMLDivElement | null>(null)

	// 足されたときに 1 回だけ合わせる。最初の表示のときにすでにある発言には
	// 合わせない（下端を見せる）。
	React.useLayoutEffect(() => {
		if (!scrollAnchor || !readyRef.current) return
		const item = itemRef.current
		const viewport = viewportRef.current
		if (!item || !viewport) return
		if (autoScroll && pinnedRef.current) {
			scrollToEnd()
			return
		}
		anchorRef.current = item
		fitSpacer()
		const top =
			item.getBoundingClientRect().top -
			viewport.getBoundingClientRect().top +
			viewport.scrollTop
		pinnedRef.current = false
		viewport.scrollTo({ top, behavior: 'smooth' })
	}, [])

	return (
		<div
			ref={itemRef}
			data-slot='message-scroller-item'
			data-message-id={messageId}
			className={cn('min-w-0 shrink-0', className)}
			{...props}
		/>
	)
}

interface MessageScrollerButtonProps extends Omit<ButtonProps, 'asChild'> {
	/** `end` は下端へ、`start` は上端へ戻るボタン。 */
	direction?: 'start' | 'end'
}

/** 端から離れたときに出る、端へ戻るボタン。 */
function MessageScrollerButton({
	direction = 'end',
	className,
	children,
	variant = 'secondary',
	size = 'icon',
	onClick,
	...props
}: MessageScrollerButtonProps) {
	const { atEnd, atStart, scrollToEnd, scrollToStart } =
		useMessageScrollerContext('MessageScrollerButton')
	const active = direction === 'end' ? !atEnd : !atStart

	return (
		<Button
			type='button'
			data-slot='message-scroller-button'
			data-direction={direction}
			data-active={active}
			aria-hidden={!active}
			tabIndex={active ? undefined : -1}
			variant={variant}
			size={size}
			className={cn(
				'absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-background shadow-overlay transition-[translate,scale,opacity] duration-base data-[direction=end]:bottom-4 data-[direction=start]:top-4 data-[active=false]:pointer-events-none data-[active=false]:scale-95 data-[active=false]:opacity-0 data-[active=true]:scale-100 data-[active=true]:opacity-100 data-[direction=end]:data-[active=false]:translate-y-full data-[direction=start]:data-[active=false]:-translate-y-full data-[direction=start]:[&_svg]:rotate-180',
				className,
			)}
			onClick={event => {
				onClick?.(event)
				if (event.defaultPrevented) return
				if (direction === 'end') scrollToEnd()
				else scrollToStart()
			}}
			{...props}
		>
			{children ?? (
				<>
					<ArrowDown />
					<span className='sr-only'>
						{direction === 'end' ? '最新の発言へ' : '最初の発言へ'}
					</span>
				</>
			)}
		</Button>
	)
}

/**
 * 枠の様子と動かし方を返す。ボタンを自分で作りたいときなどに使う。
 * `atStart`・`atEnd`・`scrollable` と、`scrollToEnd`・`scrollToStart`・`scrollToMessage`。
 */
function useMessageScroller() {
	const {
		atStart,
		atEnd,
		scrollable,
		scrollToEnd,
		scrollToStart,
		scrollToMessage,
	} = useMessageScrollerContext('useMessageScroller')
	return {
		atStart,
		atEnd,
		scrollable,
		scrollToEnd,
		scrollToStart,
		scrollToMessage,
	}
}

export {
	MessageScroller,
	MessageScrollerButton,
	type MessageScrollerButtonProps,
	MessageScrollerContent,
	MessageScrollerItem,
	type MessageScrollerItemProps,
	MessageScrollerProvider,
	type MessageScrollerProviderProps,
	MessageScrollerViewport,
	useMessageScroller,
}
