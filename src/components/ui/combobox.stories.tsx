import type { Meta, StoryObj } from '@storybook/react-vite'
import { Building2, ChevronsUpDown } from 'lucide-react'
import { useState } from 'react'

import { Combobox } from './combobox'

const meta = {
	title: 'Components/Combobox',
	component: Combobox,
} satisfies Meta<typeof Combobox>

export default meta
type Story = StoryObj<typeof meta>

const TENANTS = [
	{
		value: 'tn_01hacme',
		label: 'Acme Inc.',
		description: 'tn_01hacme',
		keywords: ['acme'],
	},
	{
		value: 'tn_01hglobex',
		label: 'Globex Corporation',
		description: 'tn_01hglobex',
	},
	{
		value: 'tn_01hinitech',
		label: 'Initech',
		description: 'tn_01hinitech',
	},
	{
		value: 'tn_01humbrella',
		label: 'Umbrella Corp',
		description: 'tn_01humbrella',
		disabled: true,
	},
]

export const Default: Story = {
	args: {
		options: TENANTS,
		placeholder: 'Select tenant',
		searchPlaceholder: 'Search tenants...',
		emptyText: 'No tenant found.',
	},
	render: args => {
		const [value, setValue] = useState<string | null>(null)
		return (
			<div className='w-64'>
				<Combobox {...args} value={value} onValueChange={setValue} />
			</div>
		)
	},
}

export const CustomTrigger: Story = {
	args: {
		options: TENANTS,
		searchPlaceholder: 'Search tenants...',
		emptyText: 'No tenant found.',
	},
	render: args => {
		const [value, setValue] = useState<string | null>('tn_01hacme')
		const selected = TENANTS.find(tenant => tenant.value === value)
		return (
			<Combobox
				{...args}
				value={value}
				onValueChange={setValue}
				trigger={
					<button
						type='button'
						className='flex w-56 items-center gap-2 rounded-md border border-border px-3 py-2 text-left text-sm hover:bg-muted'
					>
						<Building2 className='size-4 shrink-0 text-muted-foreground' />
						<span className='min-w-0 flex-1 truncate font-medium'>
							{selected?.label ?? 'Select tenant'}
						</span>
						<ChevronsUpDown className='size-3.5 shrink-0 text-subtle-foreground' />
					</button>
				}
			/>
		)
	},
}
