import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './separator'

const meta = {
	title: 'Components/Separator',
	component: Separator,
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
	render: () => (
		<div className='w-64'>
			<p className='text-sm'>Above</p>
			<Separator className='my-2' />
			<p className='text-muted-foreground text-sm'>Below</p>
		</div>
	),
}

export const Vertical: Story = {
	render: () => (
		<div className='flex h-5 items-center gap-3 text-sm'>
			<span>Issues</span>
			<Separator orientation='vertical' />
			<span>Projects</span>
			<Separator orientation='vertical' />
			<span>Views</span>
		</div>
	),
}
