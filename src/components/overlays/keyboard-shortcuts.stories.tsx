import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../basics/button'
import {
	type KeyboardShortcutGroup,
	KeyboardShortcutsDialog,
	ShortcutTooltip,
} from './keyboard-shortcuts'

const groups: KeyboardShortcutGroup[] = [
	{
		title: '画面の移動',
		items: [
			{ label: 'メニューを検索', shortcuts: ['⌘K'] },
			{ label: '業務システムを切り替える', shortcuts: ['⌘J'] },
			{
				label: 'N 番目の業務システムへ移る',
				separator: '〜',
				shortcuts: ['⌥1', '⌥9'],
			},
			{ label: 'テナントを切り替える', shortcuts: ['⌘⇧J'] },
		],
	},
	{
		title: '表示',
		items: [
			{ label: 'サイドバーを開く・隠す', shortcuts: ['⌘B'] },
			{ label: 'キーボードショートカットを見る', shortcuts: ['⌘/'] },
			{ label: '閉じる', shortcuts: ['Esc'] },
		],
	},
]

function Demo({ startOpen = false }: { startOpen?: boolean }) {
	const [open, setOpen] = useState(startOpen)
	return (
		<div className='flex items-center gap-3 p-10'>
			<ShortcutTooltip label='メニューを検索' shortcut='⌘K'>
				<Button aria-label='メニューを検索' size='icon' variant='ghost'>
					<Search />
				</Button>
			</ShortcutTooltip>
			<ShortcutTooltip label='キーボードショートカット' shortcut='⌘/'>
				<Button onClick={() => setOpen(true)} variant='secondary'>
					ショートカットを見る
				</Button>
			</ShortcutTooltip>
			<KeyboardShortcutsDialog
				groups={groups}
				onOpenChange={setOpen}
				open={open}
			/>
		</div>
	)
}

const meta: Meta<typeof Demo> = {
	title: '重なる物/KeyboardShortcuts',
	id: 'keyboard-shortcuts',
	component: Demo,
}

export default meta
type Story = StoryObj<typeof meta>

/** ボタンに触れると、名前とキーが出る。 */
export const ボタンに触れると出る: Story = {}

export const 一覧の窓: Story = { args: { startOpen: true } }
