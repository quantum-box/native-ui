'use client'

import { useRender } from '@base-ui/react/use-render'
import * as React from 'react'

import { cn } from '../../lib/utils'

export interface LabelProps
	extends React.LabelHTMLAttributes<HTMLLabelElement> {
	/** 子の要素 1 つを label の代わりに使う */
	asChild?: boolean
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
	({ className, asChild = false, children, onMouseDown, ...props }, ref) => {
		return useRender({
			defaultTagName: 'label',
			render: asChild ? (children as React.ReactElement) : undefined,
			ref,
			props: {
				...props,
				children: asChild ? undefined : children,
				className: cn(
					'text-xs font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
					className,
				),
				// Radix の Label と同じ: 2 回押しで文字が選ばれないようにする
				onMouseDown: (event: React.MouseEvent<HTMLLabelElement>) => {
					const target = event.target as HTMLElement
					if (target.closest('button, input, select, textarea')) return
					onMouseDown?.(event)
					if (!event.defaultPrevented && event.detail > 1)
						event.preventDefault()
				},
			},
		})
	},
)
Label.displayName = 'Label'

export { Label }
