import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from './label'
import { Switch } from './switch'

const meta = {
	title: 'Components/Switch',
	component: Switch,
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<div className='flex w-64 items-center justify-between'>
			<Label htmlFor='tenant-enabled'>Tenant enabled</Label>
			<Switch id='tenant-enabled' defaultChecked />
		</div>
	),
}
