import * as React from 'react'

import { cn } from '../../lib/utils'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from './dialog'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

/**
 * Teaching people the keyboard shortcuts:
 * - `<ShortcutTooltip>` shows the name and keys when a button is hovered or focused
 * - `<KeyboardShortcutsDialog>` lists every shortcut of the app in one place
 * - `<ShortcutKeys>` draws the keys themselves (⌘ B)
 *
 * Shortcuts are written as one string of symbols, e.g. `⌘B`, `⌘⇧J`, `⌥1`, `Esc`.
 */

const MODIFIERS = new Set(['⌘', '⇧', '⌥', '⌃'])

/** `⌘⇧J` → `['⌘', '⇧', 'J']`, `Esc` → `['Esc']`. */
export function splitShortcut(shortcut: string): string[] {
	const keys: string[] = []
	let rest = ''
	for (const char of shortcut.trim()) {
		if (MODIFIERS.has(char) && rest === '') keys.push(char)
		else rest += char
	}
	if (rest) keys.push(rest)
	return keys
}

export interface ShortcutKeysProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	shortcut: string
	/** `inverted` sits on the dark tooltip surface. */
	tone?: 'default' | 'inverted'
}

function ShortcutKeys({
	shortcut,
	tone = 'default',
	className,
	...props
}: ShortcutKeysProps) {
	return (
		<span
			className={cn('inline-flex shrink-0 items-center gap-0.5', className)}
			{...props}
		>
			{splitShortcut(shortcut).map((key, index) => (
				<kbd
					key={index}
					className={cn(
						'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-sm px-1 font-sans text-2xs',
						tone === 'inverted'
							? 'bg-background/20 text-background'
							: 'border border-border border-b-2 bg-muted text-muted-foreground',
					)}
				>
					{key}
				</kbd>
			))}
		</span>
	)
}

export interface ShortcutTooltipProps {
	/** What the button does. */
	label: string
	/** Keys that do the same, e.g. `⌘B`. Omit to show the name only. */
	shortcut?: string
	side?: 'top' | 'right' | 'bottom' | 'left'
	/** Default 300ms: quicker than a plain Tooltip, since it teaches a key. */
	delayDuration?: number
	/** The button. It must take a ref and spread props. */
	children: React.ReactElement
}

function ShortcutTooltip({
	label,
	shortcut,
	side = 'bottom',
	delayDuration = 300,
	children,
}: ShortcutTooltipProps) {
	return (
		<Tooltip delayDuration={delayDuration}>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent className='flex items-center gap-2' side={side}>
				{label}
				{shortcut ? <ShortcutKeys shortcut={shortcut} tone='inverted' /> : null}
			</TooltipContent>
		</Tooltip>
	)
}

export type KeyboardShortcutItem = Readonly<{
	label: string
	/** One or more ways to do it, e.g. `['⌘K']` or `['⌥1', '⌥9']`. */
	shortcuts: readonly string[]
	/** Text between two shortcuts, e.g. `〜`. Default `/`. */
	separator?: string
}>

export type KeyboardShortcutGroup = Readonly<{
	title: string
	items: readonly KeyboardShortcutItem[]
}>

export interface KeyboardShortcutsDialogProps {
	open: boolean
	onOpenChange(open: boolean): void
	groups: readonly KeyboardShortcutGroup[]
	title?: string
	description?: string
}

function KeyboardShortcutsDialog({
	open,
	onOpenChange,
	groups,
	title = 'キーボードショートカット',
	description,
}: KeyboardShortcutsDialogProps) {
	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent className='max-w-md'>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description ? (
						<DialogDescription>{description}</DialogDescription>
					) : null}
				</DialogHeader>
				<div className='-mx-1 flex max-h-[60dvh] flex-col gap-4 overflow-y-auto px-1'>
					{groups.map(group => (
						<section key={group.title}>
							<h3 className='mb-1 font-medium text-subtle-foreground text-xs'>
								{group.title}
							</h3>
							<dl className='divide-y divide-border rounded-lg border border-border bg-surface'>
								{group.items.map(item => (
									<div
										className='flex min-h-9 items-center justify-between gap-3 px-3 py-1.5 text-sm'
										key={item.label}
									>
										<dt className='min-w-0 text-foreground'>{item.label}</dt>
										<dd className='flex shrink-0 items-center gap-1.5 text-subtle-foreground text-xs'>
											{item.shortcuts.map((shortcut, index) => (
												<React.Fragment key={shortcut}>
													{index > 0 ? (
														<span aria-hidden>{item.separator ?? '/'}</span>
													) : null}
													<ShortcutKeys shortcut={shortcut} />
												</React.Fragment>
											))}
										</dd>
									</div>
								))}
							</dl>
						</section>
					))}
				</div>
			</DialogContent>
		</Dialog>
	)
}

export { KeyboardShortcutsDialog, ShortcutKeys, ShortcutTooltip }
