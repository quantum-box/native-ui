'use client'

import { Separator as SeparatorPrimitive } from '@base-ui/react/separator'
import * as React from 'react'

import { cn } from '../../lib/utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
	orientation?: 'horizontal' | 'vertical'
	/**
	 * 見た目だけの線にする（読み上げでは飛ばす）。既定は true。
	 * false にすると role="separator" になる。
	 */
	decorative?: boolean
	/** 子の要素 1 つを線の代わりに使う */
	asChild?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
	(
		{
			className,
			orientation = 'horizontal',
			decorative = true,
			asChild = false,
			children,
			...props
		},
		ref,
	) => (
		<SeparatorPrimitive
			ref={ref}
			render={asChild ? (children as React.ReactElement) : undefined}
			orientation={orientation}
			// Radix と同じ: 見た目だけなら role="none"。縦のときだけ aria-orientation を付ける
			role={decorative ? 'none' : 'separator'}
			aria-orientation={
				decorative || orientation === 'horizontal' ? undefined : orientation
			}
			className={cn(
				'shrink-0 bg-border',
				orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
				className,
			)}
			{...props}
		>
			{asChild ? undefined : children}
		</SeparatorPrimitive>
	),
)
Separator.displayName = 'Separator'

export { Separator }
