import { Slot } from '@radix-ui/react-slot'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '../../lib/utils'

const buttonVariants = cva(
	'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				primary:
					'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
				// Default: quiet bordered button, the workhorse of native-style UI
				secondary:
					'border border-border bg-surface text-foreground hover:bg-muted active:bg-muted/70',
				ghost:
					'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted/70',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				sm: 'h-6 gap-1 rounded-sm px-2 text-xs [&_svg]:size-3.5',
				md: 'h-7 px-2.5',
				lg: 'h-8 px-3',
				icon: 'h-7 w-7',
			},
		},
		defaultVariants: {
			variant: 'secondary',
			size: 'md',
		},
	},
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Button.displayName = 'Button'

export { Button, buttonVariants }
