import {
	type FocusEvent,
	type KeyboardEvent,
	type PointerEvent,
	type ReactElement,
	type ReactNode,
	useEffect,
	useId,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'
import { Popover, PopoverAnchor, PopoverContent } from './popover'

const FOCUSABLE = 'a[href], button, [tabindex]:not([tabindex="-1"])'

export type HoverPeekTriggerProps = {
	ref: (node: HTMLElement | null) => void
	'aria-describedby': string
	'aria-expanded': boolean
	'aria-haspopup': 'dialog'
	onPointerEnter: (event: PointerEvent) => void
	onPointerLeave: (event: PointerEvent) => void
	onFocus: (event: FocusEvent) => void
	onBlur: (event: FocusEvent) => void
	onKeyDown: (event: KeyboardEvent) => void
}

/**
 * 触れる・フォーカスすると、小さな枠（要点・式など）を出す。記録の要点の枠と、計算した値の式で使う。
 * キーボードでは ↓ で枠の中の操作へ移り、Esc で戻る。Tab で枠の端を越えると閉じて記録に戻る。
 */
export function HoverPeek({
	label,
	hint = '下矢印キーで、要点と開く操作へ移ります',
	width = 'w-80',
	renderTrigger,
	children,
}: {
	label: string
	/** 読み上げに伝える、枠の中へ移る方法。 */
	hint?: string
	/** 枠の幅（Tailwind の class）。 */
	width?: string
	renderTrigger: (props: HoverPeekTriggerProps) => ReactElement
	children: ReactNode
}) {
	const [open, setOpen] = useState(false)
	const timer = useRef<ReturnType<typeof setTimeout>>()
	const anchor = useRef<HTMLElement | null>(null)
	const content = useRef<HTMLDivElement>(null)
	const focusOnOpen = useRef(false)
	// 枠から記録へ戻したときは、フォーカスで枠を開き直さない。
	const returning = useRef(false)
	const hintId = useId()
	useEffect(() => () => clearTimeout(timer.current), [])

	function later(next: boolean, delay: number) {
		clearTimeout(timer.current)
		timer.current = setTimeout(() => setOpen(next), delay)
	}
	function focusables() {
		return Array.from(
			content.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
		)
	}
	function focusFirst() {
		;(focusables()[0] ?? content.current)?.focus()
	}
	/** 枠の中の最初の操作へ移る。枠がまだ無ければ、出たときに移る。 */
	function enter() {
		clearTimeout(timer.current)
		if (open && content.current) return focusFirst()
		focusOnOpen.current = true
		setOpen(true)
	}
	function leaveTo(target: EventTarget | null) {
		const node = target as Node | null
		return !(
			node &&
			(content.current?.contains(node) || anchor.current?.contains(node))
		)
	}
	function back() {
		clearTimeout(timer.current)
		setOpen(false)
		returning.current = true
		anchor.current?.focus()
		returning.current = false
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverAnchor asChild>
				{renderTrigger({
					ref: node => {
						anchor.current = node
					},
					'aria-describedby': hintId,
					'aria-expanded': open,
					'aria-haspopup': 'dialog',
					onPointerEnter: event => {
						if (event.pointerType === 'mouse') later(true, 400)
					},
					onPointerLeave: event => {
						if (event.pointerType === 'mouse') later(false, 150)
					},
					onFocus: event => {
						// キーボードでフォーカスしたときだけ出す（押したときは移るので出さない）。
						if (returning.current) return
						let keyboard = false
						try {
							keyboard = event.currentTarget.matches(':focus-visible')
						} catch {}
						if (keyboard) later(true, 400)
					},
					onBlur: event => {
						if (leaveTo(event.relatedTarget)) later(false, 150)
					},
					onKeyDown: event => {
						// リンクでない記録は Enter・Space でも枠の操作へ移る。
						// リンクやボタンは Enter・Space で自分の動き（移る・押す）をするので、↓ だけで枠へ移る。
						const isLink =
							['A', 'BUTTON'].indexOf(event.currentTarget.tagName) >= 0
						if (
							event.key === 'ArrowDown' ||
							(!isLink && (event.key === 'Enter' || event.key === ' '))
						) {
							event.preventDefault()
							enter()
						} else if (event.key === 'Escape' && open) {
							event.preventDefault()
							clearTimeout(timer.current)
							setOpen(false)
						}
					},
				})}
			</PopoverAnchor>
			<span id={hintId} className='sr-only'>
				{hint}
			</span>
			<PopoverContent
				ref={content}
				tabIndex={-1}
				align='start'
				className={cn(width, 'overflow-hidden p-0')}
				aria-label={label}
				onOpenAutoFocus={event => {
					// 触れて出たときはフォーカスを動かさない。キーボードで入ったときだけ最初の操作へ。
					event.preventDefault()
					if (focusOnOpen.current) focusFirst()
					focusOnOpen.current = false
				}}
				onCloseAutoFocus={event => event.preventDefault()}
				onEscapeKeyDown={event => {
					event.preventDefault()
					back()
				}}
				onPointerEnter={() => clearTimeout(timer.current)}
				onPointerLeave={event => {
					if (event.pointerType === 'mouse') later(false, 150)
				}}
				onBlur={event => {
					if (leaveTo(event.relatedTarget)) later(false, 150)
				}}
				onKeyDown={event => {
					if (event.key !== 'Tab') return
					const list = focusables()
					const first = list[0]
					const last = list[list.length - 1]
					const active = document.activeElement
					if (
						!list.length ||
						(event.shiftKey && active === first) ||
						(!event.shiftKey && active === last)
					) {
						event.preventDefault()
						back()
					}
				}}
			>
				{children}
			</PopoverContent>
		</Popover>
	)
}
