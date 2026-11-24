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
	title: '重なる物/Command',
	id: 'command',
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

/** 近さが同じ群が並ぶとき（「a」で探すと、果物と野菜のどちらも先頭で合う物がある） */
export const 近さが同じ群: Story = {
	render: () => (
		<Command className='w-80 rounded-lg border border-border shadow-overlay'>
			<CommandInput placeholder='探す' />
			<CommandList>
				<CommandEmpty>見つかりません</CommandEmpty>
				<CommandGroup heading='果物'>
					<CommandItem value='apple'>apple</CommandItem>
					<CommandItem value='pear'>pear</CommandItem>
				</CommandGroup>
				<CommandGroup heading='ほか'>
					<CommandItem value='apricot'>apricot</CommandItem>
					<CommandItem value='banana'>banana</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	),
}
