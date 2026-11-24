import {
	type ReactNode,
	useCallback,
	useLayoutEffect,
	useRef,
	useState,
} from 'react'

import { cn } from '../../lib/utils'

export type DataTableOverflowItem = {
	key: string
	node: ReactNode
	/** 幅を測るときに使う形（操作の無い軽い形）。無ければ `node`。 */
	measure?: ReactNode
}

/**
 * いくつかの物（記録・タグなど）を折り返さずに 1 行で並べる。入りきらない分は「+N」にまとめる。
 * どこで切るかはセルの幅を測って決めるので、行の高さは中身で変わらない。
 */
export function DataTableOverflowList({
	items,
	max = Number.POSITIVE_INFINITY,
	renderMore,
	className,
}: {
	items: readonly DataTableOverflowItem[]
	/** 並べる数の上限（幅に余裕があっても、これより多くは並べない）。 */
	max?: number
	/** 入りきらなかった数を受け取り、「+N」の部品を返す。 */
	renderMore: (hidden: number) => ReactNode
	className?: string
}) {
	const container = useRef<HTMLDivElement>(null)
	const measure = useRef<HTMLDivElement>(null)
	const limit = Math.min(max, items.length)
	const [shown, setShown] = useState(limit)

	const fit = useCallback(() => {
		const box = container.current
		const ruler = measure.current
		if (!box || !ruler) return
		const available = box.clientWidth
		const widths = Array.from(ruler.children).map(
			node => (node as HTMLElement).offsetWidth,
		)
		const more = widths.pop() ?? 0
		const gap = Number.parseFloat(getComputedStyle(ruler).columnGap) || 0
		// 幅が測れないとき（表示される前など）は、上限まで並べる。
		if (!available || widths.every(width => width === 0)) {
			setShown(limit)
			return
		}
		let used = 0
		let count = 0
		for (let index = 0; index < limit; index += 1) {
			const next = used + (index ? gap : 0) + widths[index]
			const rest = limit - (index + 1) + (items.length - limit)
			const reserve = rest > 0 ? gap + more : 0
			if (next + reserve > available) break
			used = next
			count = index + 1
		}
		// 1 つも入らないときも、1 つは出して「…」で省く。
		setShown(Math.max(1, count))
	}, [items.length, limit])

	useLayoutEffect(() => {
		// 測るだけの並びは、読み上げ・フォーカスの対象にしない。
		measure.current?.setAttribute('inert', '')
		fit()
		const box = container.current
		if (!box || typeof ResizeObserver === 'undefined') return
		const observer = new ResizeObserver(() => fit())
		observer.observe(box)
		return () => observer.disconnect()
	}, [fit])

	const hidden = items.length - shown
	return (
		<div
			ref={container}
			className={cn(
				'relative flex min-w-0 items-center gap-x-3 overflow-hidden whitespace-nowrap',
				className,
			)}
		>
			{items.slice(0, shown).map((item, index) => (
				<span
					key={item.key}
					className={cn(
						'inline-flex min-w-0',
						// 最後の 1 つは、入りきらなければ縮めて「…」で省く。
						index === shown - 1 ? 'shrink' : 'shrink-0',
					)}
				>
					{item.node}
				</span>
			))}
			{hidden > 0 ? (
				<span className='shrink-0'>{renderMore(hidden)}</span>
			) : null}
			{/* 幅を測るための見えない並び（同じ物と「+N」を、縮めずに並べる）。 */}
			<div
				ref={measure}
				aria-hidden
				className={cn(
					'pointer-events-none invisible absolute top-0 left-0 flex gap-x-3 whitespace-nowrap',
					className,
				)}
			>
				{items.slice(0, limit).map(item => (
					<span key={item.key} className='inline-flex shrink-0'>
						{item.measure ?? item.node}
					</span>
				))}
				<span className='shrink-0'>{renderMore(items.length)}</span>
			</div>
		</div>
	)
}
