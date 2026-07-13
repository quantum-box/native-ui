import { Slot } from '@radix-ui/react-slot'
import * as React from 'react'

import { cn } from '../../lib/utils'

export interface SidebarProps extends React.HTMLAttributes<HTMLElement> {
	/** Icon-only 48px rail. Labels/hints hide automatically — pair items with Tooltip. */
	collapsed?: boolean
}

/**
 * App navigation sidebar (Linear/Notion style).
 * Static layout components only — collapse/persist state is the app's concern
 * (pass it down via the `collapsed` prop).
 *
 * Structure:
 *   <Sidebar collapsed={collapsed}>
 *     <SidebarHeader>Workspace</SidebarHeader>
 *     <SidebarSection>
 *       <SidebarItem active><Icon /><SidebarItemLabel>Inbox</SidebarItemLabel><Kbd>G</Kbd></SidebarItem>
 *     </SidebarSection>
 *     <SidebarSection>
 *       <SidebarSectionLabel>Projects</SidebarSectionLabel>
 *       ...
 *     </SidebarSection>
 *     <SidebarFooter>
 *       <SidebarAccount>
 *         <SidebarAvatar>TF</SidebarAvatar>
 *         <SidebarAccountInfo name='Takanori' detail='Tachyon Inc.' />
 *         <ChevronsUpDown />
 *       </SidebarAccount>
 *     </SidebarFooter>
 *   </Sidebar>
 */
const Sidebar = React.forwardRef<HTMLElement, SidebarProps>(
	({ className, collapsed = false, ...props }, ref) => (
		<nav
			ref={ref}
			data-collapsed={collapsed || undefined}
			className={cn(
				'group/sidebar flex h-full w-60 shrink-0 flex-col gap-0.5 overflow-y-auto border-border border-r bg-surface p-2 text-sm transition-[width] duration-slow ease-in-out data-[collapsed]:w-12 data-[collapsed]:overflow-x-hidden',
				className,
			)}
			{...props}
		/>
	),
)
Sidebar.displayName = 'Sidebar'

/** Workspace row at the top: name (semibold) + optional trailing icon buttons. */
const SidebarHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex h-8 shrink-0 items-center gap-2 px-2 font-semibold text-foreground group-data-[collapsed]/sidebar:justify-center group-data-[collapsed]/sidebar:px-0 group-data-[collapsed]/sidebar:[&>:not(svg)]:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
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

/**
 * Quiet section heading, e.g. "Projects". Append a `<ChevronDown />` when the
 * app makes the section collapsible (the toggle state lives in the app).
 */
const SidebarSectionLabel = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			'flex h-6 select-none items-center gap-1 px-2 font-medium text-subtle-foreground text-xs group-data-[collapsed]/sidebar:hidden [&_svg]:size-3 [&_svg]:shrink-0',
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
	/**
	 * Sub-item under a parent row (project tree etc.): indents the label to
	 * the parent's text column. Hidden entirely while collapsed.
	 */
	inset?: boolean
}

/**
 * 32px nav row: icon (16px) + label + optional trailing Kbd/Badge/count.
 * Selection is the quiet `selected` tint — never the primary accent.
 */
const SidebarItem = React.forwardRef<HTMLButtonElement, SidebarItemProps>(
	(
		{ className, active = false, asChild = false, inset = false, ...props },
		ref,
	) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				ref={ref}
				data-active={active || undefined}
				aria-current={active ? 'page' : undefined}
				className={cn(
					'flex h-8 w-full select-none items-center gap-2 rounded-md px-2 text-left font-medium text-muted-foreground text-sm transition-colors duration-fast hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-muted/70 data-[active]:bg-selected data-[active]:text-foreground group-data-[collapsed]/sidebar:justify-center group-data-[collapsed]/sidebar:gap-0 group-data-[collapsed]/sidebar:px-0 group-data-[collapsed]/sidebar:[&>:not(svg)]:hidden [&_svg]:size-4 [&_svg]:shrink-0',
					inset && 'pl-8 group-data-[collapsed]/sidebar:hidden',
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

export interface SidebarAccountProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	/** Render as the child element (e.g. DropdownMenuTrigger asChild target). */
	asChild?: boolean
}

/**
 * Account bar: avatar + name/detail + trailing chevron. Usually lives in
 * SidebarFooter and opens an account DropdownMenu. When the sidebar is
 * collapsed only the avatar stays visible.
 */
const SidebarAccount = React.forwardRef<HTMLButtonElement, SidebarAccountProps>(
	({ className, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				ref={ref}
				className={cn(
					'flex h-10 w-full select-none items-center gap-2 rounded-md px-2 text-left transition-colors duration-fast hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:bg-muted/70 group-data-[collapsed]/sidebar:justify-center group-data-[collapsed]/sidebar:gap-0 group-data-[collapsed]/sidebar:px-0 group-data-[collapsed]/sidebar:[&>:not([data-avatar])]:hidden [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground',
					className,
				)}
				{...props}
			/>
		)
	},
)
SidebarAccount.displayName = 'SidebarAccount'

/** 24px round avatar. Children are initials, or an <img> (clipped to the circle). */
const SidebarAvatar = React.forwardRef<
	HTMLSpanElement,
	React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
	<span
		ref={ref}
		data-avatar=''
		className={cn(
			'flex size-6 shrink-0 select-none items-center justify-center overflow-hidden rounded-full bg-selected font-medium text-2xs text-primary',
			className,
		)}
		{...props}
	/>
))
SidebarAvatar.displayName = 'SidebarAvatar'

export interface SidebarAccountInfoProps
	extends React.HTMLAttributes<HTMLSpanElement> {
	/** Account or workspace name (13px medium). */
	name: string
	/** Secondary line: plan, email, workspace… (11px muted). */
	detail?: string
}

/** Two-line text block for SidebarAccount; truncates instead of wrapping. */
const SidebarAccountInfo = React.forwardRef<
	HTMLSpanElement,
	SidebarAccountInfoProps
>(({ className, name, detail, ...props }, ref) => (
	<span
		ref={ref}
		className={cn('flex min-w-0 flex-1 flex-col', className)}
		{...props}
	>
		<span className='truncate font-medium text-foreground text-sm leading-tight'>
			{name}
		</span>
		{detail ? (
			<span className='truncate text-2xs text-muted-foreground leading-tight'>
				{detail}
			</span>
		) : null}
	</span>
))
SidebarAccountInfo.displayName = 'SidebarAccountInfo'

export {
	Sidebar,
	SidebarAccount,
	SidebarAccountInfo,
	SidebarAvatar,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarItemLabel,
	SidebarSection,
	SidebarSectionLabel,
}
