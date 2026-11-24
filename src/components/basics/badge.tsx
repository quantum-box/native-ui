import { type VariantProps, cva } from 'class-variance-authority'
import type * as React from 'react'

import { cn } from '../../lib/utils'

const badgeVariants = cva(
	'inline-flex h-5 select-none items-center gap-1 rounded-sm px-1.5 text-2xs font-medium',
	{
		variants: {
			variant: {
				// Quiet neutral chip — the default for statuses and counts
				neutral: 'bg-muted text-muted-foreground',
				accent: 'bg-selected text-primary',
				outline: 'border border-border text-muted-foreground',
				success: 'bg-success/15 text-success',
				warning: 'bg-warning/15 text-warning',
				destructive: 'bg-destructive/15 text-destructive',
			},
		},
		defaultVariants: {
			variant: 'neutral',
		},
	},
)

export interface BadgeProps
	extends React.HTMLAttributes<HTMLSpanElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<span className={cn(badgeVariants({ variant }), className)} {...props} />
	)
}

export { Badge, badgeVariants }
