import {
	Badge,
	Kbd,
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
} from '@tachyon-sdk/native-ui'
import {
	Bell,
	ChevronDown,
	ChevronsUpDown,
	CircleDot,
	FolderKanban,
	Inbox,
	Layers,
	LayoutGrid,
	Search,
	Settings,
	Target,
} from 'lucide-react'
import type * as React from 'react'

const Frame = ({
	label,
	width,
	children,
}: {
	label: string
	width?: number
	children: React.ReactNode
}) => (
	<div className='flex flex-col gap-1' style={{ width: width ?? 240 }}>
		<div className='select-none font-medium text-2xs text-subtle-foreground'>
			{label}
		</div>
		<div className='h-[400px] overflow-hidden rounded-lg border border-border bg-background'>
			{children}
		</div>
	</div>
)

const coreNav = (
	<SidebarSection>
		<SidebarItem>
			<Inbox />
			<SidebarItemLabel>Inbox</SidebarItemLabel>
			<span className='flex gap-0.5'>
				<Kbd>G</Kbd>
				<Kbd>I</Kbd>
			</span>
		</SidebarItem>
		<SidebarItem active>
			<CircleDot />
			<SidebarItemLabel>My issues</SidebarItemLabel>
			<span className='flex gap-0.5'>
				<Kbd>G</Kbd>
				<Kbd>A</Kbd>
			</span>
		</SidebarItem>
		<SidebarItem>
			<LayoutGrid />
			<SidebarItemLabel>Projects</SidebarItemLabel>
		</SidebarItem>
	</SidebarSection>
)

const accountBar = (
	<SidebarAccount>
		<SidebarAvatar>TF</SidebarAvatar>
		<SidebarAccountInfo name='Takanori F.' detail='takanori@tachyon.dev' />
		<ChevronsUpDown />
	</SidebarAccount>
)

// Five composition patterns in one card. Pick the pieces a screen needs —
// every pattern is plain composition of the same primitives.
export const Variations = () => (
	<div className='flex w-[570px] flex-wrap gap-4'>
		{/* 1. Default: workspace header + nav + account bar */}
		<Frame label='Default'>
			<Sidebar>
				<SidebarHeader>
					<span className='flex-1 truncate'>Tachyon Inc.</span>
					<Bell />
				</SidebarHeader>
				{coreNav}
				<SidebarSection>
					<SidebarSectionLabel>Workspace</SidebarSectionLabel>
					<SidebarItem>
						<Target />
						<SidebarItemLabel>Cycles</SidebarItemLabel>
						<Badge variant='neutral'>3</Badge>
					</SidebarItem>
					<SidebarItem>
						<Layers />
						<SidebarItemLabel>Views</SidebarItemLabel>
					</SidebarItem>
				</SidebarSection>
				<SidebarFooter>{accountBar}</SidebarFooter>
			</Sidebar>
		</Frame>

		{/* 2. Collapsed: 48px icon rail (same tree, collapsed prop only) */}
		<Frame label='Collapsed' width={48}>
			<Sidebar collapsed>
				<SidebarHeader>
					<span className='flex-1 truncate'>Tachyon Inc.</span>
					<Bell />
				</SidebarHeader>
				{coreNav}
				<SidebarFooter>{accountBar}</SidebarFooter>
			</Sidebar>
		</Frame>

		{/* 3. Search entry: ⌘K row above the nav */}
		<Frame label='With search'>
			<Sidebar>
				<SidebarHeader>
					<span className='flex-1 truncate'>Tachyon Inc.</span>
					<Bell />
				</SidebarHeader>
				<SidebarSection>
					<SidebarItem>
						<Search />
						<SidebarItemLabel>Search</SidebarItemLabel>
						<span className='flex gap-0.5'>
							<Kbd>⌘</Kbd>
							<Kbd>K</Kbd>
						</span>
					</SidebarItem>
				</SidebarSection>
				{coreNav}
				<SidebarFooter>{accountBar}</SidebarFooter>
			</Sidebar>
		</Frame>

		{/* 4. Nested tree: collapsible section + inset sub-items */}
		<Frame label='Nested projects'>
			<Sidebar>
				<SidebarHeader>
					<span className='flex-1 truncate'>Tachyon Inc.</span>
					<Bell />
				</SidebarHeader>
				{coreNav}
				<SidebarSection>
					<SidebarSectionLabel>
						Projects
						<ChevronDown />
					</SidebarSectionLabel>
					<SidebarItem>
						<FolderKanban />
						<SidebarItemLabel>Tachyon Cloud</SidebarItemLabel>
						<span className='text-2xs text-subtle-foreground'>12</span>
					</SidebarItem>
					<SidebarItem inset active>
						<SidebarItemLabel>Sprint 24</SidebarItemLabel>
					</SidebarItem>
					<SidebarItem inset>
						<SidebarItemLabel>Backlog</SidebarItemLabel>
					</SidebarItem>
					<SidebarItem>
						<FolderKanban />
						<SidebarItemLabel>Native UI</SidebarItemLabel>
						<span className='text-2xs text-subtle-foreground'>4</span>
					</SidebarItem>
				</SidebarSection>
			</Sidebar>
		</Frame>

		{/* 5. Workspace switcher: SidebarAccount as the header */}
		<Frame label='Workspace switcher'>
			<Sidebar>
				<SidebarAccount>
					<SidebarAvatar className='rounded-md bg-primary text-primary-foreground'>
						T
					</SidebarAvatar>
					<SidebarAccountInfo name='Tachyon Inc.' detail='Pro plan · 12 members' />
					<ChevronsUpDown />
				</SidebarAccount>
				{coreNav}
				<SidebarFooter>
					<SidebarItem>
						<Settings />
						<SidebarItemLabel>Settings</SidebarItemLabel>
					</SidebarItem>
				</SidebarFooter>
			</Sidebar>
		</Frame>
	</div>
)
