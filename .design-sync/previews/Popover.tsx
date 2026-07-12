import {
	Button,
	Input,
	Label,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Separator,
} from '@tachyon-sdk/native-ui'
import { Check, ChevronDown, ListFilter, SlidersHorizontal } from 'lucide-react'

// Rendered statically open via the controlled `open` prop. The trigger
// sits top-center so the portalled content opens downward inside the
// 480x360 card viewport.
export const DisplayOptions = () => (
	<div className='flex justify-center' style={{ paddingTop: 20 }}>
		<Popover open>
			<PopoverTrigger asChild>
				<Button size='sm'>
					<SlidersHorizontal />
					Display
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-64'>
				<div className='flex flex-col' style={{ gap: 10 }}>
					<div className='flex items-center justify-between'>
						<Label>Grouping</Label>
						<Button variant='ghost' size='sm'>
							Status
							<ChevronDown />
						</Button>
					</div>
					<div className='flex items-center justify-between'>
						<Label>Ordering</Label>
						<Button variant='ghost' size='sm'>
							Last updated
							<ChevronDown />
						</Button>
					</div>
					<Separator />
					<div className='flex items-center justify-between'>
						<Label>Completed issues</Label>
						<Button variant='ghost' size='sm'>
							All
							<ChevronDown />
						</Button>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	</div>
)

export const FilterByAssignee = () => (
	<div className='flex justify-center' style={{ paddingTop: 20 }}>
		<Popover open>
			<PopoverTrigger asChild>
				<Button size='sm'>
					<ListFilter />
					Filter
				</Button>
			</PopoverTrigger>
			<PopoverContent align='start' className='w-64'>
				<div className='flex flex-col gap-2'>
					<Input placeholder='Filter by assignee…' />
					<div className='flex flex-col text-sm' style={{ gap: 2 }}>
						<div
							className='flex items-center justify-between'
							style={{ padding: '4px 6px', borderRadius: 6 }}
						>
							<span>Ava Chen</span>
							<Check size={14} className='text-muted-foreground' />
						</div>
						<div
							className='flex items-center justify-between'
							style={{ padding: '4px 6px', borderRadius: 6 }}
						>
							<span>Marcus Reid</span>
							<Check size={14} className='text-muted-foreground' />
						</div>
						<div
							className='flex items-center justify-between text-muted-foreground'
							style={{ padding: '4px 6px', borderRadius: 6 }}
						>
							<span>Priya Nair</span>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	</div>
)
