import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from './dialog'
import { Input } from './input'
import { Label } from './label'

const meta = {
	title: 'Components/Dialog',
	component: Dialog,
} satisfies Meta<typeof Dialog>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Dialog>
			<DialogTrigger asChild>
				<Button>Rename project</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Rename project</DialogTitle>
					<DialogDescription>
						The new name is applied everywhere the project appears.
					</DialogDescription>
				</DialogHeader>
				<div className='grid gap-1.5'>
					<Label htmlFor='project-name'>Name</Label>
					<Input id='project-name' defaultValue='Native UI' />
				</div>
				<DialogFooter>
					<DialogClose asChild>
						<Button variant='ghost'>Cancel</Button>
					</DialogClose>
					<Button variant='primary'>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	),
}
