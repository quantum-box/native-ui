import { Button, Separator } from '@tachyon-sdk/native-ui'
import { ArrowUpDown, ListFilter, SlidersHorizontal } from 'lucide-react'

export const SettingsSection = () => (
	<div className='flex w-72 flex-col gap-2'>
		<div className='flex flex-col gap-1'>
			<span className='text-sm font-medium text-foreground'>
				Notifications
			</span>
			<span className='text-xs text-muted-foreground'>
				Choose how you want to be notified.
			</span>
		</div>
		<Separator />
		<div className='flex items-center justify-between'>
			<span className='text-sm text-foreground'>Desktop push</span>
			<span className='text-xs text-muted-foreground'>Enabled</span>
		</div>
		<Separator />
		<div className='flex items-center justify-between'>
			<span className='text-sm text-foreground'>Email digest</span>
			<span className='text-xs text-muted-foreground'>Weekly</span>
		</div>
	</div>
)

export const Toolbar = () => (
	<div
		className='flex h-8 items-center gap-2 rounded-md border px-2'
		style={{ width: 'fit-content' }}
	>
		<Button variant='ghost' size='sm'>
			<ListFilter />
			Filter
		</Button>
		<Separator orientation='vertical' style={{ height: 16 }} />
		<Button variant='ghost' size='sm'>
			<ArrowUpDown />
			Sort
		</Button>
		<Separator orientation='vertical' style={{ height: 16 }} />
		<Button variant='ghost' size='sm'>
			<SlidersHorizontal />
			Display
		</Button>
	</div>
)
