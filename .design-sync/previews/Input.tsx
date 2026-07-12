import { Input, Label } from '@tachyon-sdk/native-ui'

export const Default = () => (
	<div className='w-64'>
		<Input placeholder='Search issues…' />
	</div>
)

export const WithLabel = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='workspace-name'>Workspace name</Label>
		<Input id='workspace-name' defaultValue='Tachyon Inc.' />
	</div>
)

export const WithError = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='team-email'>Team email</Label>
		<Input
			id='team-email'
			type='email'
			defaultValue='ops@tachyon'
			error='Enter a valid email address.'
		/>
	</div>
)

export const Disabled = () => (
	<div className='flex w-64 flex-col gap-1.5'>
		<Label htmlFor='plan'>Plan</Label>
		<Input id='plan' defaultValue='Enterprise (managed)' disabled />
	</div>
)
