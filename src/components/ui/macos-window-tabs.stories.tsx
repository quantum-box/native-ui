import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { type MacOSWindowTab, MacOSWindowTabs } from './macos-window-tabs'

const meta: Meta<typeof MacOSWindowTabs> = {
	title: 'Patterns/macOS Window Tabs',
	component: MacOSWindowTabs,
	parameters: {
		layout: 'fullscreen',
	},
}

export default meta
type Story = StoryObj<typeof meta>

const initialTabs: MacOSWindowTab[] = [
	{ id: 'apps', title: 'Apps' },
	{ id: 'storage', title: 'Storage' },
	{ id: 'jobs', title: 'Coding Jobs' },
]

export const Interactive: Story = {
	render: () => {
		const [tabs, setTabs] = useState(initialTabs)
		const [activeTabId, setActiveTabId] = useState(initialTabs[0].id)

		return (
			<div className='min-h-screen bg-muted p-8'>
				<div className='relative overflow-hidden rounded-xl border border-border bg-background shadow-modal'>
					<div
						aria-hidden='true'
						className='pointer-events-none absolute left-3 top-[14px] z-10 flex gap-2'
					>
						<span className='size-3 rounded-full bg-[#ff5f57]' />
						<span className='size-3 rounded-full bg-[#febc2e]' />
						<span className='size-3 rounded-full bg-[#28c840]' />
					</div>
					<MacOSWindowTabs
						tabs={tabs}
						activeTabId={activeTabId}
						onTabSelect={setActiveTabId}
						onTabClose={tabId => {
							const nextTabs = tabs.filter(tab => tab.id !== tabId)
							setTabs(nextTabs)
							if (tabId === activeTabId && nextTabs[0]) {
								setActiveTabId(nextTabs[0].id)
							}
						}}
						onNewTab={() => {
							const id = `tab-${tabs.length + 1}`
							setTabs(current => [
								...current,
								{ id, title: `New tab ${current.length + 1}` },
							])
							setActiveTabId(id)
						}}
					/>
					<div className='flex h-64 items-center justify-center text-muted-foreground text-sm'>
						{tabs.find(tab => tab.id === activeTabId)?.title ?? 'No tabs'}
					</div>
				</div>
			</div>
		)
	},
}
