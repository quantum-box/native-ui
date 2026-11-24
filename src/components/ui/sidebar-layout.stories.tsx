import type { Meta, StoryObj } from '@storybook/react-vite'
import { Inbox, Layers, Search } from 'lucide-react'

import {
	Sidebar,
	SidebarHeader,
	SidebarItem,
	SidebarItemLabel,
	SidebarSection,
} from './sidebar'
import { SidebarPanel, SidebarToggle, useSidebarLayout } from './sidebar-layout'

function Demo() {
	const layout = useSidebarLayout()
	return (
		<div className='flex h-[480px] bg-background text-foreground'>
			<SidebarPanel layout={layout}>
				<Sidebar className='w-full max-w-none'>
					<SidebarHeader>
						Tachyon
						<SidebarToggle className='ml-auto' layout={layout} />
					</SidebarHeader>
					<SidebarSection>
						<SidebarItem active>
							<Inbox />
							<SidebarItemLabel>Inbox</SidebarItemLabel>
						</SidebarItem>
						<SidebarItem>
							<Search />
							<SidebarItemLabel>Search</SidebarItemLabel>
						</SidebarItem>
						<SidebarItem>
							<Layers />
							<SidebarItemLabel>Projects</SidebarItemLabel>
						</SidebarItem>
					</SidebarSection>
				</Sidebar>
			</SidebarPanel>
			<main className='relative flex-1 p-6 text-sm text-muted-foreground'>
				{layout.open ? null : (
					<SidebarToggle className='absolute left-2 top-2' layout={layout} />
				)}
				<p className='mt-6'>
					右端のつまみを引くと幅が変わり、クリックすると隠れます。⌘B
					でも開け閉めできます。
				</p>
			</main>
		</div>
	)
}

const meta: Meta<typeof Demo> = {
	title: 'Components/SidebarLayout',
	component: Demo,
	parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
