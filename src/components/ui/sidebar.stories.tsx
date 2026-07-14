import type { Meta, StoryObj } from '@storybook/react-vite'
import {
	Box,
	ChevronDown,
	ChevronsUpDown,
	Inbox,
	Layers,
	PenSquare,
	Search,
} from 'lucide-react'

import { Badge } from './badge'
import { Kbd } from './kbd'
import {
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
} from './sidebar'

const meta: Meta<typeof Sidebar> = {
	title: 'Components/Sidebar',
	component: Sidebar,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		Story => (
			<div className='h-[480px]'>
				<Story />
			</div>
		),
	],
}

export default meta
type Story = StoryObj<typeof meta>

const content = (
	<>
		<SidebarHeader>
			Tachyon
			<span className='ml-auto flex gap-1'>
				<PenSquare />
			</span>
		</SidebarHeader>
		<SidebarSection>
			<SidebarItem active>
				<Inbox />
				<SidebarItemLabel>Inbox</SidebarItemLabel>
				<Badge>12</Badge>
			</SidebarItem>
			<SidebarItem>
				<Search />
				<SidebarItemLabel>Search</SidebarItemLabel>
				<Kbd>/</Kbd>
			</SidebarItem>
		</SidebarSection>
		<SidebarSection>
			<SidebarSectionLabel>
				Projects
				<ChevronDown />
			</SidebarSectionLabel>
			<SidebarItem>
				<Box />
				<SidebarItemLabel>Native UI</SidebarItemLabel>
			</SidebarItem>
			<SidebarItem>
				<Layers />
				<SidebarItemLabel>Platform</SidebarItemLabel>
			</SidebarItem>
			<SidebarItem inset>
				<SidebarItemLabel>Design tokens</SidebarItemLabel>
			</SidebarItem>
		</SidebarSection>
		<SidebarFooter>
			<SidebarAccount>
				<SidebarAvatar>TF</SidebarAvatar>
				<SidebarAccountInfo name='Takanori' detail='Quantum Box' />
				<ChevronsUpDown />
			</SidebarAccount>
		</SidebarFooter>
	</>
)

export const Default: Story = {
	render: () => <Sidebar>{content}</Sidebar>,
}

export const Collapsed: Story = {
	render: () => <Sidebar collapsed>{content}</Sidebar>,
}
