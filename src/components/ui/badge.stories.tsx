import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'

const meta = {
	title: 'Components/Badge',
	component: Badge,
	args: {
		children: 'Badge',
	},
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Neutral: Story = {}

export const Variants: Story = {
	render: () => (
		<div className='flex items-center gap-2'>
			<Badge variant='neutral'>Draft</Badge>
			<Badge variant='accent'>In progress</Badge>
			<Badge variant='outline'>v0.1.0</Badge>
			<Badge variant='success'>Done</Badge>
			<Badge variant='warning'>Blocked</Badge>
			<Badge variant='destructive'>Failed</Badge>
		</div>
	),
}
