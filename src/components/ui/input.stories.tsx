import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './input'
import { Label } from './label'

const meta = {
	title: 'Components/Input',
	component: Input,
	args: {
		placeholder: 'Search issues…',
	},
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithLabel: Story = {
	render: () => (
		<div className='grid w-64 gap-1.5'>
			<Label htmlFor='email'>Email</Label>
			<Input id='email' type='email' placeholder='you@example.com' />
		</div>
	),
}

export const Disabled: Story = {
	args: { disabled: true, value: 'Read only value' },
}
