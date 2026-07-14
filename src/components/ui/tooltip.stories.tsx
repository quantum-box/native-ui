import type { Meta, StoryObj } from '@storybook/react-vite'
import { Settings } from 'lucide-react'

import { Button } from './button'
import { Kbd } from './kbd'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from './tooltip'

const meta: Meta<typeof Tooltip> = {
	title: 'Components/Tooltip',
	component: Tooltip,
	decorators: [
		Story => (
			<TooltipProvider>
				<Story />
			</TooltipProvider>
		),
	],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button size='icon' aria-label='Settings'>
					<Settings />
				</Button>
			</TooltipTrigger>
			<TooltipContent>Settings</TooltipContent>
		</Tooltip>
	),
}

export const WithShortcut: Story = {
	render: () => (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button>New issue</Button>
			</TooltipTrigger>
			<TooltipContent className='flex items-center gap-1.5'>
				Create a new issue
				<Kbd>C</Kbd>
			</TooltipContent>
		</Tooltip>
	),
}
