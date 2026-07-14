import {
	Badge,
	Button,
	Sidebar,
	SidebarFooter,
	SidebarHeader,
	SidebarItem,
	SidebarItemLabel,
	SidebarSection,
	SidebarSectionLabel,
} from '@tachyon-sdk/native-ui'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { platformAdapter } from '../platform/adapter'
import { navigationItems } from './navigation'

function AppNavigation() {
	const location = useLocation()

	return (
		<>
			<SidebarHeader>
				<span>TACHYON</span>
				<Badge className='ml-auto' variant='accent'>
					Alpha
				</Badge>
			</SidebarHeader>
			<SidebarSection>
				<SidebarSectionLabel>Workspace</SidebarSectionLabel>
				{navigationItems.map(({ icon: Icon, label, to }) => (
					<SidebarItem active={location.pathname === to} asChild key={to}>
						<NavLink to={to}>
							<Icon />
							<SidebarItemLabel>{label}</SidebarItemLabel>
						</NavLink>
					</SidebarItem>
				))}
			</SidebarSection>
			<SidebarFooter>
				<div className='flex items-center justify-between px-2 py-1 text-2xs text-subtle-foreground'>
					<span>Runtime</span>
					<span>{platformAdapter.runtimeLabel}</span>
				</div>
			</SidebarFooter>
		</>
	)
}

export function AppShell() {
	return (
		<div className='flex min-h-dvh min-w-0 bg-background text-foreground'>
			<Sidebar className='fixed inset-y-0 left-0 hidden md:flex'>
				<AppNavigation />
			</Sidebar>
			<div className='flex min-h-dvh min-w-0 flex-1 flex-col md:pl-60'>
				<header className='safe-area-top sticky top-0 z-20 border-border border-b bg-background/95 px-3 py-2 backdrop-blur md:hidden'>
					<div className='mb-2 flex items-center justify-between'>
						<span className='font-semibold text-sm'>TACHYON</span>
						<Badge variant='accent'>Alpha</Badge>
					</div>
					<nav aria-label='Mobile navigation' className='flex gap-1'>
						{navigationItems.map(({ icon: Icon, label, to }) => (
							<Button asChild key={to} size='sm' variant='ghost'>
								<NavLink to={to}>
									<Icon />
									{label}
								</NavLink>
							</Button>
						))}
					</nav>
				</header>
				<main className='min-w-0 flex-1'>
					<Outlet />
				</main>
			</div>
		</div>
	)
}
