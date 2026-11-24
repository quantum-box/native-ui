import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './checkbox'
import { Label } from '../basics/label'

const meta = {
	title: '入力/Checkbox',
	id: 'checkbox',
	component: Checkbox,
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<div className='flex items-center gap-2'>
			<Checkbox id='member-active' defaultChecked />
			<Label htmlFor='member-active'>Active member</Label>
		</div>
	),
}
