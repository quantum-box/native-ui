import {
	Badge,
	Kbd,
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarItemLabel,
	SidebarSection,
	SidebarSectionLabel,
} from '@tachyon-sdk/native-ui'
import {
	Bell,
	CircleDot,
	HelpCircle,
	Inbox,
	Layers,
	LayoutGrid,
	Settings,
	Target,
} from 'lucide-react'

// Full sidebar anatomy: header, primary nav (active row + shortcuts),
// labeled section with a count badge, footer pinned to the bottom.
export const AppSidebar = () => (
	<div className='h-[440px] overflow-hidden rounded-lg border border-border bg-background'>
		<Sidebar>
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
				<SidebarItem>
					<HelpCircle />
					<SidebarItemLabel>Help & support</SidebarItemLabel>
				</SidebarItem>
			</SidebarFooter>
		</Sidebar>
	</div>
)
