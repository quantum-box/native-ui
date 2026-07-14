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
import { LogOut } from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../auth/auth-context'
import { platformAdapter } from '../platform/adapter'
import { navigationItems } from './navigation'

function AppNavigation() {
	const location = useLocation()
	const { session, signOut } = useAuth()

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
				<div className='min-w-0 border-border border-b px-2 pb-3'>
					<div className='truncate font-medium text-xs'>
						{session?.identity.displayName}
					</div>
					<div className='truncate text-subtle-foreground text-2xs'>
						{session?.identity.email ?? session?.identity.username}
					</div>
					<Button
						className='mt-2 w-full justify-start'
						onClick={() => void signOut()}
						size='sm'
						variant='ghost'
					>
						<LogOut />
						サインアウト
					</Button>
				</div>
				<div className='flex items-center justify-between px-2 py-1 text-2xs text-subtle-foreground'>
					<span>Runtime</span>
					<span>{platformAdapter.runtimeLabel}</span>
				</div>
			</SidebarFooter>
		</>
	)
}

export function AppShell() {
	const { signOut } = useAuth()

	return (
		<div className='flex min-h-dvh min-w-0 bg-background text-foreground'>
			<Sidebar className='fixed inset-y-0 left-0 hidden md:flex'>
				<AppNavigation />
			</Sidebar>
			<div className='flex min-h-dvh min-w-0 flex-1 flex-col md:pl-60'>
				<header className='safe-area-top sticky top-0 z-20 border-border border-b bg-background/95 px-3 py-2 backdrop-blur md:hidden'>
					<div className='mb-2 flex items-center justify-between'>
						<span className='font-semibold text-sm'>TACHYON</span>
						<div className='flex items-center gap-1'>
							<Badge variant='accent'>Alpha</Badge>
							<Button
								aria-label='サインアウト'
								onClick={() => void signOut()}
								size='icon'
								variant='ghost'
							>
								<LogOut />
							</Button>
						</div>
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
