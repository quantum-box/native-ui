import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from '../basics/button'
import { Toaster, toast } from './toast'

const meta = {
	title: '重なる物/Toast',
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
