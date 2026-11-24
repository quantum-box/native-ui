'use client'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'
import * as React from 'react'

import { cn } from '../../lib/utils'

// 中身は base-ui の Checkbox。使い方（checked・onCheckedChange・'indeterminate'・data-state）は
// Radix のときと同じ。Radix と同じく <button role="checkbox"> を描くので、
// <Label htmlFor> で押せ、disabled: や peer-disabled: の class も効く。

export type CheckedState = boolean | 'indeterminate'

export interface CheckboxProps
	extends Omit<
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		'checked' | 'defaultChecked' | 'value' | 'onChange'
	> {
	checked?: CheckedState
	defaultChecked?: CheckedState
	onCheckedChange?(checked: CheckedState): void
	required?: boolean
	name?: string
	/** フォームで送る値。既定は "on" */
	value?: string
}

const checkedAttr = (checked: boolean, indeterminate: boolean) =>
	indeterminate ? 'indeterminate' : checked ? 'checked' : 'unchecked'

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
	(
		{
			className,
			checked,
			defaultChecked,
			onCheckedChange,
			value = 'on',
			...props
		},
		ref,
	) => {
		const indeterminate = checked === 'indeterminate'
		return (
			<CheckboxPrimitive.Root
				ref={ref}
				nativeButton
				value={value}
				checked={checked === undefined ? undefined : checked === true}
				defaultChecked={
					defaultChecked === undefined ? undefined : defaultChecked === true
				}
				indeterminate={indeterminate}
				onCheckedChange={(next: boolean) => onCheckedChange?.(next)}
				className={cn(
					'peer size-4 shrink-0 rounded-sm border border-input bg-background transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground aria-invalid:border-destructive aria-invalid:ring-destructive/25',
					className,
				)}
				render={(
					rootProps: React.ButtonHTMLAttributes<HTMLButtonElement>,
					state: { checked: boolean; indeterminate: boolean },
				) => (
					<button
						type='button'
						{...rootProps}
						data-state={checkedAttr(state.checked, state.indeterminate)}
					/>
				)}
				{...(props as Record<string, unknown>)}
			>
				<CheckboxPrimitive.Indicator
					className='flex items-center justify-center text-current'
					render={(
						indicatorProps: React.HTMLAttributes<HTMLSpanElement>,
						state: { checked: boolean; indeterminate: boolean },
					) => (
						<span
							{...indicatorProps}
							data-state={checkedAttr(state.checked, state.indeterminate)}
						/>
					)}
				>
					<Check className='size-3.5' />
				</CheckboxPrimitive.Indicator>
			</CheckboxPrimitive.Root>
		)
	},
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
