import type { Meta, StoryObj } from '@storybook/react-vite'
import { CircleHelp, MessageSquare, Settings, Wifi } from 'lucide-react'
import { useState } from 'react'

import { Button } from './button'
import { FloatingPanel } from './floating-panel'
import { StatusBar, statusBarItemClass } from './status-bar'

const meta = {
	title: 'Components/StatusBar',
	component: StatusBar,
} satisfies Meta<typeof StatusBar>

export default meta
type Story = StoryObj<typeof meta>

function Demo() {
	const [open, setOpen] = useState(false)
	return (
		<div className='h-96'>
			<FloatingPanel
				open={open}
				onClose={() => setOpen(false)}
				title='AI Chat'
				icon={<MessageSquare className='size-4' />}
				className='bottom-6'
				footer={<textarea className='w-full rounded border p-2 text-sm' />}
			>
				<p className='text-sm'>会話の内容がここに表示されます。</p>
			</FloatingPanel>
			<StatusBar
				storageKey='native-ui.story.status-bar'
				defaultLayout={[
					{ id: 'agent', visible: true, side: 'left' },
					{ id: 'connection', visible: true, side: 'left' },
					{ id: 'help', visible: true, side: 'right' },
				]}
				items={[
					{
						id: 'agent',
						label: 'Agent',
						render: () => (
							<button
								type='button'
								className={statusBarItemClass}
								onClick={() => setOpen(!open)}
							>
								<MessageSquare className='size-3' />
								Agent
							</button>
						),
					},
					{
						id: 'connection',
						label: 'ネットワーク接続',
						render: () => (
							<span className={statusBarItemClass}>
								<Wifi className='size-3' />
								オンライン
							</span>
						),
					},
					{
						id: 'help',
						label: 'ヘルプ',
						required: true,
						render: () => (
							<Button variant='ghost' className={statusBarItemClass}>
								<CircleHelp className='size-3' />
								ヘルプ
							</Button>
						),
					},
					{
						id: 'shortcut:settings',
						label: '設定',
						removable: true,
						render: () => (
							<span className={statusBarItemClass}>
								<Settings className='size-3' />
								設定
							</span>
						),
					},
				]}
			/>
		</div>
	)
}

export const Default: Story = {
	args: { items: [], defaultLayout: [], storageKey: '' },
	render: () => <Demo />,
}
