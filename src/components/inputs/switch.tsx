'use client'

import { Switch as SwitchPrimitive } from '@base-ui/react/switch'
import * as React from 'react'

import { cn } from '../../lib/utils'

// 中身は base-ui の Switch。使い方（checked・onCheckedChange・data-state）は Radix のときと同じ。
// Radix と同じく <button role="switch"> を描く。

export interface SwitchProps
	extends Omit<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		'checked' | 'defaultChecked' | 'value' | 'onChange'
	> {
	checked?: boolean
	defaultChecked?: boolean
	onCheckedChange?(checked: boolean): void
	required?: boolean
	name?: string
	/** フォームで送る値。既定は "on" */
	value?: string
}

const stateAttr = (state: { checked: boolean }) =>
	state.checked ? 'checked' : 'unchecked'

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
	({ className, onCheckedChange, value = 'on', ...props }, ref) => (
		<SwitchPrimitive.Root
			ref={ref}
			nativeButton
			value={value}
			onCheckedChange={(next: boolean) => onCheckedChange?.(next)}
			className={cn(
				'peer inline-flex h-4 w-7 shrink-0 cursor-pointer items-center rounded-full bg-muted p-0.5 transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary',
				className,
			)}
			render={(
				rootProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
				state: { checked: boolean },
			) => (
				<button type='button' {...rootProps} data-state={stateAttr(state)} />
			)}
			{...(props as Record<string, unknown>)}
		>
			<SwitchPrimitive.Thumb
				className='pointer-events-none block size-3 rounded-full bg-background shadow-sm transition-transform duration-fast data-[state=checked]:translate-x-3 data-[state=unchecked]:translate-x-0 dark:data-[state=checked]:bg-primary-foreground'
				render={(
					thumbProps: React.HTMLAttributes<HTMLSpanElement>,
					state: { checked: boolean },
				) => <span {...thumbProps} data-state={stateAttr(state)} />}
			/>
		</SwitchPrimitive.Root>
	),
)
Switch.displayName = 'Switch'

export { Switch }
