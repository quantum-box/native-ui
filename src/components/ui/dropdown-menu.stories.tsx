import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

import { Button } from './button'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from './dropdown-menu'

const meta = {
	title: 'Components/DropdownMenu',
	component: DropdownMenu,
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button size='icon' aria-label='More actions'>
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start'>
				<DropdownMenuLabel>Issue actions</DropdownMenuLabel>
				<DropdownMenuItem>
					<Pencil />
					Rename
					<DropdownMenuShortcut>R</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuItem>
					<Copy />
					Duplicate
					<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className='text-destructive'>
					<Trash2 />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	),
}
