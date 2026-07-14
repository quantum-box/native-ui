import type { Meta, StoryObj } from '@storybook/react-vite'

import { Kbd } from './kbd'

const meta = {
	title: 'Components/Kbd',
	component: Kbd,
	args: {
		children: '⌘K',
	},
} satisfies Meta<typeof Kbd>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Shortcut: Story = {
	render: () => (
		<div className='flex items-center gap-2 text-muted-foreground text-sm'>
			Open command palette
			<span className='flex gap-0.5'>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</span>
		</div>
	),
}
