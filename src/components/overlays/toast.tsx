'use client'

import * as React from 'react'
import { Toaster as Sonner, toast } from 'sonner'

import { cn } from '../../lib/utils'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({
	className,
	style,
	toastOptions,
	...props
}: ToasterProps) => (
	<Sonner
		className={cn('toaster group', className)}
		style={
			{
				'--normal-bg': 'hsl(var(--nui-popover))',
				'--normal-text': 'hsl(var(--nui-popover-foreground))',
				'--normal-border': 'hsl(var(--nui-border))',
				...style,
			} as React.CSSProperties
		}
		toastOptions={{
			...toastOptions,
			classNames: {
				...toastOptions?.classNames,
				toast: cn(
					'group toast group-[.toaster]:border-border group-[.toaster]:bg-popover group-[.toaster]:text-popover-foreground group-[.toaster]:shadow-overlay',
					toastOptions?.classNames?.toast,
				),
				description: cn(
					'group-[.toast]:text-muted-foreground',
					toastOptions?.classNames?.description,
				),
				actionButton: cn(
					'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
					toastOptions?.classNames?.actionButton,
				),
				cancelButton: cn(
					'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
					toastOptions?.classNames?.cancelButton,
				),
			},
		}}
		{...props}
	/>
)
Toaster.displayName = 'Toaster'

export { Toaster, type ToasterProps, toast }
