import { Input, Label } from '@tachyon-sdk/native-ui'

export const WithInput = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='display-name'>Display name</Label>
		<Input id='display-name' defaultValue='Ada Lovelace' />
	</div>
)

export const Required = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='team-name'>
			Team name <span className='text-destructive'>*</span>
		</Label>
		<Input id='team-name' placeholder='e.g. Platform Engineering' />
	</div>
)

export const WithDescription = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='workspace-slug'>Workspace URL</Label>
		<span className='text-xs text-muted-foreground'>
			Used in links shared outside your workspace.
		</span>
		<Input id='workspace-slug' defaultValue='tachyon-eng' />
	</div>
)
