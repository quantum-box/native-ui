import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './badge'
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './table'

const meta = {
	title: 'Components/Table',
	component: Table,
} satisfies Meta<typeof Table>

export default meta
type Story = StoryObj<typeof meta>

const members = [
	{ name: 'Ada Lovelace', email: 'ada@example.com', role: 'Owner' },
	{ name: 'Grace Hopper', email: 'grace@example.com', role: 'Admin' },
	{ name: 'Margaret Hamilton', email: 'margaret@example.com', role: 'Member' },
]

export const Default: Story = {
	render: () => (
		<div className='w-[640px]'>
			<Table>
				<TableCaption>Workspace members</TableCaption>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Email</TableHead>
						<TableHead>Role</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{members.map(member => (
						<TableRow key={member.email}>
							<TableCell className='font-medium'>{member.name}</TableCell>
							<TableCell className='text-muted-foreground'>
								{member.email}
							</TableCell>
							<TableCell>
								<Badge variant='neutral'>{member.role}</Badge>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	),
}
