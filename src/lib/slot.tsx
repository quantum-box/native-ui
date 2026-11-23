'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'

/**
 * `asChild` の受け口。子の要素 1 つに、自分の props（class・イベント・ref など）を
 * 足して描く。Radix の Slot と同じ使い方ができる。
 *
 * 中では base-ui の `useRender` に子の要素を `render` として渡している。
 * 混ぜ方も Radix と同じ:
 * - ふつうの props は子の物が勝つ
 * - `className` はつなげる（並び順は Radix と逆で子が先。CSS の効き方は変わらない）
 * - `style` は重ねる（子が勝つ）
 * - イベントは両方呼ぶ（子が先、Slot 側が後）
 * - ref は両方に渡す
 */
export type SlotProps = React.HTMLAttributes<HTMLElement> & {
	children?: React.ReactNode
}

const Slot = React.forwardRef<HTMLElement, SlotProps>(
	({ children, ...props }, ref) => {
		const child = React.Children.only(children)
		if (!React.isValidElement(child)) {
			throw new Error('asChild には要素を 1 つだけ渡してください。')
		}
		return useRender({
			render: child as React.ReactElement,
			props: props as Record<string, unknown>,
			ref,
		})
	},
)
Slot.displayName = 'Slot'

export { Slot }
