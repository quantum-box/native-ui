import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

import { cn } from '../../lib/utils'

/**
 * App navigation sidebar (Linear/Notion style).
 * Static layout components only — collapse/persist state is the app's concern.
 *
 * Structure:
 *   <Sidebar>
 *     <SidebarHeader>Workspace</SidebarHeader>
 *     <SidebarSection>
 *       <SidebarItem active><Icon /><SidebarItemLabel>Inbox</SidebarItemLabel><Kbd>G</Kbd></SidebarItem>
 *     </SidebarSection>
 *     <SidebarSection>
 *       <SidebarSectionLabel>Projects</SidebarSectionLabel>
 *       ...
 *     </SidebarSection>
 *     <SidebarFooter>...</SidebarFooter>
 *   </Sidebar>
 */
const Sidebar = React.forwardRef<
	HTMLElement,
	React.HTMLAttributes<HTMLElement>
>(({ className, ...props }, ref) => (
	<nav
		ref={ref}
		className={cn(
			'flex h-full w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-border border-r bg-surface p-2 text-sm',
			className,
		)}
		{...props}
	/>
))
Sidebar.displayName = 'Sidebar'

/** Workspace row at the top: name (semibold) + optional trailing icon buttons. */
const SidebarHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex h-8 shrink-0 items-center gap-2 px-2 font-semibold text-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
			className,
		)}
		{...props}
	/>
))
SidebarHeader.displayName = 'SidebarHeader'

/** Group of nav items. Sections after the first get breathing room. */
const SidebarSection = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex shrink-0 flex-col gap-0.5 [&:not(:first-child)]:mt-4',
			className,
		)}
		{...props}
	/>
))
SidebarSection.displayName = 'SidebarSection'

/** Quiet section heading, e.g. "Projects". */
const SidebarSectionLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex h-6 select-none items-center px-2 font-medium text-subtle-foreground text-xs',
			className,
		)}
		{...props}
	/>
))
SidebarSectionLabel.displayName = 'SidebarSectionLabel'

export interface SidebarItemProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Marks the current location: `--nui-selected` background, no accent color. */
	active?: boolean
	/** Render as the child element (e.g. next/link) instead of a button. */
	asChild?: boolean
}

/**
 * 32px nav row: icon (16px) + label + optional trailing Kbd/Badge/count.
 * Selection is the quiet `selected` tint — never the primary accent.
 */
const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
	({ className, active = false, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				ref={ref}
				data-active={active || undefined}
				aria-current={active ? 'page' : undefined}
				className={cn(
					'flex h-8 w-full select-none items-center gap-2 rounded-md px-2 text-left font-medium text-muted-foreground text-sm transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-muted/70 data-[active]:bg-selected data-[active]:text-foreground [&_svg]:size-4 [&_svg]:shrink-0',
					className,
				)}
				{...props}
			/>
		)
	},
)
SidebarItem.displayName = 'SidebarItem'

/** Item label; takes the free space so trailing hints align right. */
const SidebarItemLabel = React.forwardRef<
	HTMLSpanElement,
	React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
	<span ref={ref} className={cn('flex-1 truncate', className)} {...props} />
))
SidebarItemLabel.displayName = 'SidebarItemLabel'

/** Pinned to the bottom (settings, help, invite…). */
const SidebarFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn('mt-auto flex shrink-0 flex-col gap-0.5 pt-4', className)}
		{...props}
	/>
))
SidebarFooter.displayName = 'SidebarFooter'

export {
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarItemLabel,
	SidebarSection,
	SidebarSectionLabel,
}
