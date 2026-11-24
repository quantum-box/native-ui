import type * as React from 'react'

import { cn } from '../../lib/utils'

export type KbdProps = React.HTMLAttributes<HTMLElement>

/**
 * Keyboard shortcut hint, e.g. `<Kbd>⌘</Kbd><Kbd>K</Kbd>`.
 * Keyboard-first UI should surface shortcuts next to their actions.
 */
function Kbd({ className, ...props }: KbdProps) {
	return (
		<kbd
			className={cn(
				'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm border border-border border-b-2 bg-muted px-1 font-mono text-2xs text-muted-foreground',
				className,
			)}
			{...props}
		/>
	)
}

export { Kbd }
