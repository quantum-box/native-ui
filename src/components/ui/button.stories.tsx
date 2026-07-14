import type { Meta, StoryObj } from '@storybook/react-vite'
import { Plus, Settings, Trash2 } from 'lucide-react'

import { Button } from './button'

const meta = {
	title: 'Components/Button',
	component: Button,
	args: {
		children: 'Button',
	},
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Secondary: Story = {}

export const Primary: Story = {
	args: { variant: 'primary', children: 'Save changes' },
}

export const Ghost: Story = {
	args: { variant: 'ghost', children: 'Cancel' },
}

export const Destructive: Story = {
	args: { variant: 'destructive', children: 'Delete' },
}

export const Link: Story = {
	args: { variant: 'link', children: 'Learn more' },
}

export const Sizes: Story = {
	render: () => (
		<div className='flex items-center gap-2'>
			<Button size='sm'>Small</Button>
			<Button size='md'>Medium</Button>
			<Button size='lg'>Large</Button>
			<Button size='icon' aria-label='Settings'>
				<Settings />
			</Button>
		</div>
	),
}

export const WithIcon: Story = {
	render: () => (
		<div className='flex items-center gap-2'>
			<Button variant='primary'>
				<Plus />
				New issue
			</Button>
			<Button variant='destructive'>
				<Trash2 />
				Delete
			</Button>
		</div>
	),
}

export const Disabled: Story = {
	args: { disabled: true },
}
