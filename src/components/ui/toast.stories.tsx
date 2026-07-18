import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './button'
import { Toaster, toast } from './toast'

const meta = {
	title: 'Components/Toast',
	component: Toaster,
} satisfies Meta<typeof Toaster>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => (
		<>
			<Button
				onClick={() =>
					toast.success('Tenant created', {
						description: 'Acme Inc. is ready to use.',
					})
				}
			>
				Show toast
			</Button>
			<Toaster />
		</>
	),
}
