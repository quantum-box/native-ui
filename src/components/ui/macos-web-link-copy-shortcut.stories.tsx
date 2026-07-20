import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { useState } from 'react'

import { Kbd } from './kbd'
import {
	type MacOSWebLinkCopyResult,
	MacOSWebLinkCopyShortcut,
} from './macos-web-link-copy-shortcut'

class ClipboardItemMock {
	readonly data: Record<string, Blob>

	constructor(data: Record<string, Blob>) {
		this.data = data
	}
}

const meta = {
	title: 'Patterns/macOS Web Link Copy Shortcut',
	component: MacOSWebLinkCopyShortcut,
	tags: ['autodocs', 'keyboard', 'tauri'],
	args: {
		enabled: true,
		getWebUrl: () => 'https://platform.example/apps?tenant=demo#activity',
		getPageTitle: () => 'Applications',
		onCopy: fn(),
		onError: fn(),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies Meta<typeof MacOSWebLinkCopyShortcut>

export default meta
type Story = StoryObj<typeof meta>

export const Interactive: Story = {
	render: args => {
		const [result, setResult] = useState<MacOSWebLinkCopyResult>()

		return (
			<div className='w-96 space-y-4 rounded-lg border border-border bg-background p-5 shadow-overlay'>
				<MacOSWebLinkCopyShortcut
					{...args}
					onCopy={copyResult => {
						setResult(copyResult)
						args.onCopy?.(copyResult)
					}}
				/>
				<div>
					<p className='font-medium text-foreground text-sm'>Share this page</p>
					<p className='mt-1 text-muted-foreground text-xs'>
						Use the native shortcuts without opening an address bar.
					</p>
				</div>
				<div className='space-y-2 text-sm'>
					<div className='flex items-center justify-between'>
						<span>Copy web URL</span>
						<span className='flex gap-1'>
							<Kbd>⌘</Kbd>
							<Kbd>L</Kbd>
						</span>
					</div>
					<div className='flex items-center justify-between'>
						<span>Copy linked title</span>
						<span className='flex gap-1'>
							<Kbd>⌘</Kbd>
							<Kbd>⇧</Kbd>
							<Kbd>L</Kbd>
						</span>
					</div>
				</div>
				<p role='status' className='text-muted-foreground text-xs'>
					{result ? `Last result: ${result.kind}` : 'Waiting for shortcut'}
				</p>
			</div>
		)
	},
	play: async ({ args, canvasElement }) => {
		const write = fn().mockResolvedValue(undefined)
		const writeText = fn().mockResolvedValue(undefined)
		Object.defineProperty(navigator, 'clipboard', {
			configurable: true,
			value: { write, writeText },
		})
		Object.defineProperty(globalThis, 'ClipboardItem', {
			configurable: true,
			value: ClipboardItemMock,
		})

		const canvas = within(canvasElement)
		await userEvent.keyboard('{Meta>}l{/Meta}')
		await waitFor(() =>
			expect(canvas.getByRole('status')).toHaveTextContent('Last result: url'),
		)
		expect(writeText).toHaveBeenCalledWith(
			'https://platform.example/apps?tenant=demo#activity',
		)

		await userEvent.keyboard('{Meta>}{Shift>}l{/Shift}{/Meta}')
		await waitFor(() =>
			expect(canvas.getByRole('status')).toHaveTextContent(
				'Last result: rich-link',
			),
		)
		expect(write).toHaveBeenCalledOnce()
		expect(args.onCopy).toHaveBeenCalledTimes(2)
		expect(args.onError).not.toHaveBeenCalled()
	},
}
