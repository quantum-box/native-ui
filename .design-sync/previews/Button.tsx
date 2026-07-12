import { Button } from '@tachyon-sdk/native-ui'
import { GitBranch, Plus, Settings, Trash2 } from 'lucide-react'

// Default is the quiet secondary button; primary is reserved for the
// main action (see packages/native-ui/README.md).
export const Variants = () => (
	<div className='flex items-center gap-2'>
		<Button variant='primary'>Save changes</Button>
		<Button>Cancel</Button>
		<Button variant='ghost'>Dismiss</Button>
		<Button variant='destructive'>Delete project</Button>
		<Button variant='link'>View docs</Button>
	</div>
)

export const Sizes = () => (
	<div className='flex items-center gap-2'>
		<Button size='sm'>Filter</Button>
		<Button size='md'>New issue</Button>
		<Button size='lg' variant='primary'>
			Create workspace
		</Button>
		<Button size='icon' aria-label='Settings'>
			<Settings />
		</Button>
	</div>
)

export const WithIcon = () => (
	<div className='flex items-center gap-2'>
		<Button variant='primary'>
			<Plus />
			New issue
		</Button>
		<Button>
			<GitBranch />
			Create branch
		</Button>
		<Button variant='ghost' size='sm'>
			<Trash2 />
			Remove
		</Button>
	</div>
)

export const Disabled = () => (
	<div className='flex items-center gap-2'>
		<Button variant='primary' disabled>
			Save changes
		</Button>
		<Button disabled>Cancel</Button>
		<Button variant='destructive' disabled>
			Delete project
		</Button>
	</div>
)
