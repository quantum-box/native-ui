import { Badge } from '@tachyon-sdk/native-ui'
import { CircleAlert, CircleCheck, Clock } from 'lucide-react'

export const Variants = () => (
	<div className='flex items-center gap-2'>
		<Badge>Backlog</Badge>
		<Badge variant='accent'>In Progress</Badge>
		<Badge variant='outline'>Draft</Badge>
		<Badge variant='success'>Done</Badge>
		<Badge variant='warning'>Blocked</Badge>
		<Badge variant='destructive'>Urgent</Badge>
	</div>
)

export const InIssueRow = () => (
	<div className='flex items-center gap-2' style={{ width: 440 }}>
		<span className='shrink-0 text-xs text-muted-foreground'>ENG-1423</span>
		<span
			className='text-sm text-foreground'
			style={{ whiteSpace: 'nowrap' }}
		>
			Fix OAuth token refresh
		</span>
		<span
			className='ml-auto flex shrink-0 items-center gap-1'
			style={{ whiteSpace: 'nowrap' }}
		>
			<Badge variant='accent'>In Progress</Badge>
			<Badge variant='outline'>Frontend</Badge>
		</span>
	</div>
)

export const WithIcon = () => (
	<div className='flex items-center gap-2'>
		<Badge variant='success'>
			<CircleCheck size={12} />
			Deployed
		</Badge>
		<Badge variant='warning'>
			<Clock size={12} />
			Pending review
		</Badge>
		<Badge variant='destructive'>
			<CircleAlert size={12} />
			Checks failing
		</Badge>
	</div>
)
