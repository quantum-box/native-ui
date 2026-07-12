import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
} from '@tachyon-sdk/native-ui'

// Issue priority select rendered open for capture (Linear-style form field).
export const PriorityOpen = () => (
	<div
		style={{
			display: 'flex',
			alignItems: 'flex-start',
			minHeight: 320,
			paddingTop: 8,
		}}
	>
		<div style={{ width: 224 }}>
			<label
				htmlFor='priority'
				className='text-xs font-medium text-muted-foreground'
				style={{ display: 'block', marginBottom: 6 }}
			>
				Priority
			</label>
			<Select open defaultValue='high'>
				<SelectTrigger id='priority' aria-label='Priority'>
					<SelectValue placeholder='Set priority' />
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel>Priority</SelectLabel>
						<SelectItem value='urgent'>Urgent</SelectItem>
						<SelectItem value='high'>High</SelectItem>
						<SelectItem value='medium'>Medium</SelectItem>
						<SelectItem value='low'>Low</SelectItem>
					</SelectGroup>
					<SelectSeparator />
					<SelectItem value='none'>No priority</SelectItem>
				</SelectContent>
			</Select>
		</div>
	</div>
)

// Closed trigger showing the selected value (workspace member role).
export const RoleClosed = () => (
	<div style={{ width: 224, paddingTop: 8 }}>
		<label
			htmlFor='role'
			className='text-xs font-medium text-muted-foreground'
			style={{ display: 'block', marginBottom: 6 }}
		>
			Workspace role
		</label>
		<Select defaultValue='admin'>
			<SelectTrigger id='role' aria-label='Workspace role'>
				<SelectValue placeholder='Select a role' />
			</SelectTrigger>
			<SelectContent>
				<SelectGroup>
					<SelectLabel>Roles</SelectLabel>
					<SelectItem value='admin'>Admin</SelectItem>
					<SelectItem value='member'>Member</SelectItem>
					<SelectItem value='guest'>Guest</SelectItem>
				</SelectGroup>
			</SelectContent>
		</Select>
	</div>
)
