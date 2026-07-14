import type { Meta, StoryObj } from '@storybook/react-vite'
import { FilePlus, Search, Settings, UserPlus } from 'lucide-react'

import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from './command'

const meta = {
	title: 'Components/Command',
	component: Command,
} satisfies Meta<typeof Command>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Command className='w-96 rounded-lg border border-border shadow-overlay'>
			<CommandInput placeholder='Type a command or search…' />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading='Actions'>
					<CommandItem>
						<FilePlus />
						New issue
						<CommandShortcut>C</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<UserPlus />
						Invite member
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading='Navigate'>
					<CommandItem>
						<Search />
						Search issues
						<CommandShortcut>/</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Settings />
						Settings
						<CommandShortcut>G S</CommandShortcut>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	),
}
