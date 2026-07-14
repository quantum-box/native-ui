import type { Meta, StoryObj } from '@storybook/react-vite'

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from './select'

const meta = {
	title: 'Components/Select',
	component: Select,
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Select defaultValue='backlog'>
			<SelectTrigger className='w-44'>
				<SelectValue placeholder='Status' />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Status</SelectLabel>
					<SelectItem value='backlog'>Backlog</SelectItem>
					<SelectItem value='todo'>Todo</SelectItem>
					<SelectItem value='in-progress'>In progress</SelectItem>
					<SelectItem value='done'>Done</SelectItem>
					<SelectItem value='canceled'>Canceled</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	),
}
