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
	ChevronsUpDown,
	CircleDot,
	Inbox,
	Layers,
	LayoutGrid,
	Settings,
	Target,
} from 'lucide-react'

const nav = (
	<>
		<SidebarHeader>
			<span className='flex-1 truncate'>Tachyon Inc.</span>
			<Bell />
		</SidebarHeader>
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
		<SidebarFooter>
			<SidebarItem>
				<Settings />
				<SidebarItemLabel>Settings</SidebarItemLabel>
			</SidebarItem>
			{/* Account bar — opens the account DropdownMenu in a real app */}
			<SidebarAccount>
				<SidebarAvatar>TF</SidebarAvatar>
				<SidebarAccountInfo name='Takanori F.' detail='takanori@tachyon.dev' />
				<ChevronsUpDown />
			</SidebarAccount>
		</SidebarFooter>
	</>
)

// Expanded (240px) and collapsed (48px icon rail) side by side.
export const AppSidebar = () => (
	<div className='flex gap-3'>
		<div className='h-[440px] overflow-hidden rounded-lg border border-border bg-background'>
			<Sidebar>{nav}</Sidebar>
		</div>
		<div className='h-[440px] overflow-hidden rounded-lg border border-border bg-background'>
			<Sidebar collapsed>{nav}</Sidebar>
		</div>
	</div>
)
