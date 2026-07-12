import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from '@tachyon-sdk/native-ui'
import {
	CircleDot,
	Copy,
	GitBranch,
	Search,
	Settings,
	User,
} from 'lucide-react'

// Rendered inline inside a level-2 panel — the same chrome CommandDialog
// gives it at runtime (⌘K palette, Linear-style near-top placement).
export const Palette = () => (
	<div className='w-[420px] overflow-hidden rounded-lg border border-border bg-popover shadow-modal'>
		<Command>
			<CommandInput placeholder='Type a command or search…' />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading='Issue'>
					<CommandItem>
						<CircleDot className='mr-2 size-4' />
						Create new issue
						<CommandShortcut>C</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Copy className='mr-2 size-4' />
						Duplicate issue
						<CommandShortcut>⌘D</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<GitBranch className='mr-2 size-4' />
						Copy git branch name
						<CommandShortcut>⌘⇧.</CommandShortcut>
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading='Navigate'>
					<CommandItem>
						<Search className='mr-2 size-4' />
						Go to project…
						<CommandShortcut>O then P</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<User className='mr-2 size-4' />
						Assigned to me
						<CommandShortcut>G then A</CommandShortcut>
					</CommandItem>
					<CommandItem>
						<Settings className='mr-2 size-4' />
						Open settings
						<CommandShortcut>⌘,</CommandShortcut>
					</CommandItem>
				</CommandGroup>
			</CommandList>
		</Command>
	</div>
)
