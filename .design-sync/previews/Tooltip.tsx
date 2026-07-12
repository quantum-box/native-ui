import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@tachyon-sdk/native-ui'
import { Link2, Settings } from 'lucide-react'

// Rendered statically open via the controlled `open` prop; a global
// TooltipProvider wraps every card. The trigger is positioned so the
// tooltip fits inside the 480x240 card viewport.
export const KeyboardHint = () => (
	<div className='flex justify-center' style={{ paddingTop: 96 }}>
		<Tooltip open>
			<TooltipTrigger asChild>
				<Button size='icon' aria-label='Open settings'>
					<Settings />
				</Button>
			</TooltipTrigger>
			<TooltipContent>
				Open settings
				<span style={{ marginLeft: 6, opacity: 0.6 }}>⌘ ,</span>
			</TooltipContent>
		</Tooltip>
	</div>
)

export const CopyLinkHint = () => (
	<div className='flex justify-center' style={{ paddingTop: 56 }}>
		<Tooltip open>
			<TooltipTrigger asChild>
				<Button size='icon' aria-label='Copy link'>
					<Link2 />
				</Button>
			</TooltipTrigger>
			<TooltipContent side='bottom'>
				Copy link
				<span style={{ marginLeft: 6, opacity: 0.6 }}>⌘⇧C</span>
			</TooltipContent>
		</Tooltip>
	</div>
)
