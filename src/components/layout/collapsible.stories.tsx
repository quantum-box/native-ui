import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronRight } from 'lucide-react'

import { Button } from '../basics/button'
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from './collapsible'

/** 押すと開いたり閉じたりする囲み。 */
const meta = {
	title: '並べる・見せる/Collapsible',
	id: 'collapsible',
	component: Collapsible,
} satisfies Meta<typeof Collapsible>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<Collapsible className='w-80'>
			<CollapsibleTrigger asChild>
				<Button className='group' variant='ghost'>
					<ChevronRight className='transition-transform duration-fast group-data-[state=open]:rotate-90' />
					くわしく見る
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent className='overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down'>
				<p className='px-2 py-2 text-muted-foreground text-sm'>
					開いたときだけ出る中身です。
				</p>
			</CollapsibleContent>
		</Collapsible>
	),
}
