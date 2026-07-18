import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta = {
	title: 'Components/Tabs',
	component: Tabs,
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Tabs defaultValue='members' className='w-96'>
			<TabsList>
				<TabsTrigger value='members'>Members</TabsTrigger>
				<TabsTrigger value='roles'>Roles</TabsTrigger>
				<TabsTrigger value='settings'>Settings</TabsTrigger>
			</TabsList>
			<TabsContent value='members' className='text-sm'>
				Manage who can access this tenant.
			</TabsContent>
			<TabsContent value='roles' className='text-sm'>
				Configure tenant roles and permissions.
			</TabsContent>
			<TabsContent value='settings' className='text-sm'>
				Update tenant-wide defaults.
			</TabsContent>
		</Tabs>
	),
}
