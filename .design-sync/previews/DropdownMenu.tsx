import {
	Button,
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from '@tachyon-sdk/native-ui'
import {
	ArrowRightLeft,
	Bell,
	Copy,
	Link2,
	MoreHorizontal,
	Pencil,
	Trash2,
	User,
} from 'lucide-react'

// Issue-row context menu (Linear-style), rendered open for capture.
export const IssueContextMenu = () => (
	<div
		style={{
			display: 'flex',
			alignItems: 'flex-start',
			minHeight: 340,
			paddingTop: 8,
		}}
	>
		<DropdownMenu open>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon' aria-label='Issue actions'>
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' style={{ width: 224 }}>
				<DropdownMenuLabel>Issue ENG-1423</DropdownMenuLabel>
				<DropdownMenuGroup>
					<DropdownMenuItem>
						<Pencil />
						Rename issue
						<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<User />
						Assign to…
						<DropdownMenuShortcut>A</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Copy />
						Duplicate
						<DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
					</DropdownMenuItem>
					<DropdownMenuItem>
						<Link2 />
						Copy link
						<DropdownMenuShortcut>⌘⇧C</DropdownMenuShortcut>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuCheckboxItem checked>
					<Bell />
					Subscribed
				</DropdownMenuCheckboxItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem className='text-destructive focus:text-destructive'>
					<Trash2 style={{ color: 'inherit' }} />
					Delete issue
					<DropdownMenuShortcut>⌘⌫</DropdownMenuShortcut>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
)

// Same pattern with a submenu expanded (move-to-project flow).
export const WithSubmenu = () => (
	<div
		style={{
			display: 'flex',
			alignItems: 'flex-start',
			minHeight: 300,
			paddingTop: 8,
		}}
	>
		<DropdownMenu open>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon' aria-label='Row actions'>
					<MoreHorizontal />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' style={{ width: 200 }}>
				<DropdownMenuItem>
					<Pencil />
					Edit
					<DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
				</DropdownMenuItem>
				<DropdownMenuSub open>
					<DropdownMenuSubTrigger>
						<ArrowRightLeft />
						Move to project
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent style={{ width: 168 }}>
						<DropdownMenuItem>Mobile App</DropdownMenuItem>
						<DropdownMenuItem>Design System</DropdownMenuItem>
						<DropdownMenuItem>Platform API</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem className='text-destructive focus:text-destructive'>
					<Trash2 style={{ color: 'inherit' }} />
					Delete
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
)
