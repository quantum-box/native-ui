'use client'

import * as React from 'react'

import { cn } from '../../lib/utils'

/*
 * 長い文の入力欄。Input と同じ見た目と密度（text-sm・角丸 md・同じ枠と輪）。
 * - 中身に合わせて高さが伸び縮みする（minRows〜maxRows 行。超えたら欄の中でスクロール）。
 * - 無効（disabled）・読むだけ（readOnly）・誤り（error か aria-invalid）の見た目を持つ。
 * - showCount で文字数を出す。softLimit は目安で、超えると赤くなるが打つのは止めない
 *   （打つのを止めたいときは、ふつうの maxLength を使う）。
 */

export interface TextareaProps
	extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
	/** 誤りの文。渡すと aria-invalid が付き、欄の下に出る */
	error?: string
	/** 中身に合わせて高さを伸び縮みさせる。既定は true */
	autoResize?: boolean
	/** いちばん低いときの行数。既定は rows か 3 */
	minRows?: number
	/** いちばん高いときの行数。これを超えたら欄の中でスクロールする */
	maxRows?: number
	/** 文字数を出す。分母は softLimit か maxLength */
	showCount?: boolean
	/** 文字数の目安。超えると数と枠が赤くなる（打つのは止めない） */
	softLimit?: number
}

/** 欄の高さを、中身の行数に合わせる */
function fitHeight(
	textarea: HTMLTextAreaElement,
	minRows: number,
	maxRows: number | undefined,
) {
	const style = window.getComputedStyle(textarea)
	const fontSize = Number.parseFloat(style.fontSize) || 13
	const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.5
	const padding =
		(Number.parseFloat(style.paddingTop) || 0) +
		(Number.parseFloat(style.paddingBottom) || 0)
	const border =
		(Number.parseFloat(style.borderTopWidth) || 0) +
		(Number.parseFloat(style.borderBottomWidth) || 0)
	const min = minRows * lineHeight + padding + border
	// 行数の上限と、class で決めた高さの上限（max-h-*）の、低い方まで伸ばす
	const cssMax = Number.parseFloat(style.maxHeight)
	const max = Math.min(
		maxRows === undefined
			? Number.POSITIVE_INFINITY
			: maxRows * lineHeight + padding + border,
		Number.isNaN(cssMax) ? Number.POSITIVE_INFINITY : cssMax,
	)

	textarea.style.height = 'auto'
	const content = textarea.scrollHeight + border
	const height = Math.min(Math.max(content, min), max)
	textarea.style.height = `${height}px`
	textarea.style.overflowY = content > max ? 'auto' : 'hidden'
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
	(
		{
			className,
			error,
			autoResize = true,
			rows,
			minRows: minRowsProp,
			maxRows,
			showCount = false,
			softLimit,
			id,
			value,
			defaultValue,
			onChange,
			maxLength,
			'aria-describedby': describedBy,
			'aria-invalid': ariaInvalid,
			...props
		},
		forwardedRef,
	) => {
		const innerRef = React.useRef<HTMLTextAreaElement | null>(null)
		const setRefs = React.useCallback(
			(node: HTMLTextAreaElement | null) => {
				innerRef.current = node
				if (typeof forwardedRef === 'function') forwardedRef(node)
				else if (forwardedRef)
					(
						forwardedRef as React.MutableRefObject<HTMLTextAreaElement | null>
					).current = node
			},
			[forwardedRef],
		)
		const minRows = minRowsProp ?? rows ?? 3
		const generatedId = React.useId()
		const errorId = error ? `${id ?? generatedId}-error` : undefined
		const countId = showCount ? `${id ?? generatedId}-count` : undefined

		// 文字数を数えるため、外で持つ形でも中で持つ形でも、今の長さを覚えておく
		const [innerLength, setInnerLength] = React.useState(
			() => String(defaultValue ?? '').length,
		)
		const length = value !== undefined ? String(value).length : innerLength
		const limit = softLimit ?? maxLength
		const overLimit = softLimit !== undefined && length > softLimit
		const invalid =
			Boolean(error) ||
			overLimit ||
			ariaInvalid === true ||
			ariaInvalid === 'true'

		const resize = React.useCallback(() => {
			const textarea = innerRef.current
			if (!textarea) return
			if (autoResize) {
				fitHeight(textarea, minRows, maxRows)
				return
			}
			// 伸び縮みをやめたら、この部品が書いた高さとスクロールの指定を消し、
			// ふつうの textarea（rows で高さが決まる）に戻す
			textarea.style.height = ''
			textarea.style.overflowY = ''
		}, [autoResize, minRows, maxRows])

		// 中身が変わるたび（外で持つ形）と、出たときに測る
		// biome-ignore lint/correctness/useExhaustiveDependencies: 中身が変わるたびに測り直す
		React.useLayoutEffect(resize, [resize, value])

		// フォームの「元に戻す」は onChange を出さずに値を戻すので、
		// 戻ったあとの値で、文字数と高さを測り直す
		React.useEffect(() => {
			const form = innerRef.current?.form
			if (!form) return
			const onReset = () => {
				// reset の知らせは値が戻る前に来るので、戻ってから読む
				window.setTimeout(() => {
					const textarea = innerRef.current
					if (!textarea) return
					setInnerLength(textarea.value.length)
					resize()
				}, 0)
			}
			form.addEventListener('reset', onReset)
			return () => form.removeEventListener('reset', onReset)
		}, [resize])

		// 欄の幅が変わると折り返しが変わるので、測り直す
		React.useEffect(() => {
			const textarea = innerRef.current
			if (!autoResize || !textarea || typeof ResizeObserver === 'undefined')
				return
			let width = textarea.clientWidth
			const observer = new ResizeObserver(() => {
				if (textarea.clientWidth === width) return
				width = textarea.clientWidth
				resize()
			})
			observer.observe(textarea)
			return () => observer.disconnect()
		}, [autoResize, resize])

		const describedByIds =
			[describedBy, errorId, countId].filter(Boolean).join(' ') || undefined

		const textarea = (
			<textarea
				ref={setRefs}
				id={id}
				rows={autoResize ? 1 : (rows ?? minRows)}
				value={value}
				defaultValue={defaultValue}
				maxLength={maxLength}
				onChange={event => {
					setInnerLength(event.target.value.length)
					if (value === undefined) resize()
					onChange?.(event)
				}}
				data-slot='textarea'
				className={cn(
					'flex w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm text-foreground leading-relaxed transition-colors duration-fast placeholder:text-subtle-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 read-only:bg-surface read-only:focus-visible:border-border-strong read-only:focus-visible:ring-muted-foreground/15 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25',
					autoResize ? 'resize-none' : 'resize-y',
					className,
				)}
				aria-invalid={invalid || undefined}
				aria-describedby={describedByIds}
				{...props}
			/>
		)

		if (!error && !showCount) return textarea
		return (
			<>
				{textarea}
				<div className='mt-1 flex items-start gap-2 text-xs'>
					{error ? (
						<p id={errorId} className='text-destructive' role='alert'>
							{error}
						</p>
					) : null}
					{showCount ? (
						<span
							id={countId}
							className={cn(
								'ml-auto shrink-0 tabular-nums',
								overLimit ? 'text-destructive' : 'text-muted-foreground',
							)}
						>
							{length.toLocaleString('ja-JP')}
							{limit !== undefined ? ` / ${limit.toLocaleString('ja-JP')}` : ''}
							<span className='sr-only'>
								{overLimit ? ' 文字。目安を超えています' : ' 文字'}
							</span>
						</span>
					) : null}
				</div>
			</>
		)
	},
)
Textarea.displayName = 'Textarea'

export { Textarea }
