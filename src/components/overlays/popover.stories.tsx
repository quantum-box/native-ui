import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../basics/button'
import { Input } from '../inputs/input'
import { Label } from '../basics/label'
import { Popover, PopoverContent, PopoverTrigger } from './popover'

const meta = {
	title: '重なる物/Popover',
	id: 'popover',
	component: Popover,
} satisfies Meta<typeof Popover>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Popover>
			<PopoverTrigger asChild>
				<Button>Set estimate</Button>
			</PopoverTrigger>
			<PopoverContent className='w-56'>
				<div className='grid gap-1.5'>
					<Label htmlFor='estimate'>Estimate (points)</Label>
					<Input id='estimate' type='number' defaultValue={3} />
				</div>
			</PopoverContent>
		</Popover>
	),
}
