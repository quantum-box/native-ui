import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Label } from '../basics/label'
import { Textarea } from './textarea'

/**
 * 長い文の入力欄。Input と同じ見た目と密度で、中身に合わせて高さが伸び縮みする。
 */
const meta = {
	title: '入力/Textarea',
	component: Textarea,
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

const LONG =
	'来週の打ち合わせでは、先月の売上の振り返りと、新しい店の開店の段取りを話す。\n資料は金曜までに共有する。\n当日は 10 分前に集まる。\n議事録は持ち回り。'

export const Default: Story = {
	render: () => (
		<div className='grid w-80 gap-1.5'>
			<Label htmlFor='memo'>メモ</Label>
			<Textarea id='memo' placeholder='打ち合わせのメモを書く' />
		</div>
	),
}

function States() {
	return (
		<div className='grid w-80 gap-4'>
			<div className='grid gap-1.5'>
				<Label>ふつう（3〜6 行で伸び縮み）</Label>
				<Textarea defaultValue={LONG} maxRows={6} />
			</div>
			<div className='grid gap-1.5'>
				<Label>文字数の目安（超えると赤くなる）</Label>
				<Textarea
					defaultValue='この欄は 40 文字が目安です。超えても打てますが、数が赤くなり、欄が誤りの見た目になります。'
					showCount
					softLimit={40}
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label>誤り</Label>
				<Textarea
					id='reason'
					defaultValue='理由'
					error='理由は 10 文字以上で書いてください。'
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label>読むだけ</Label>
				<Textarea
					readOnly
					defaultValue='AI がまとめた要点。ここでは直せません。'
				/>
			</div>
			<div className='grid gap-1.5'>
				<Label>無効</Label>
				<Textarea disabled placeholder='いまは書けません' />
			</div>
		</div>
	)
}

/** 状態の一覧。ライトとダークを並べる */
export const 状態の一覧: Story = {
	render: () => (
		<div className='grid grid-cols-2 gap-4'>
			{(['light', 'dark'] as const).map(theme => (
				<div
					key={theme}
					className={`${theme === 'dark' ? 'dark' : ''} rounded-lg border border-border bg-background p-4 text-foreground`}
				>
					<States />
				</div>
			))}
		</div>
	),
}

/** 外で値を持つ形。最大 4 行まで伸び、それを超えると欄の中でスクロールする */
export const 外で値を持つ: Story = {
	render: function Render() {
		const [value, setValue] = React.useState('')
		return (
			<div className='grid w-80 gap-1.5'>
				<Label htmlFor='controlled'>返信</Label>
				<Textarea
					id='controlled'
					minRows={2}
					maxRows={4}
					placeholder='改行すると高さが伸びる'
					showCount
					maxLength={200}
					value={value}
					onChange={event => setValue(event.target.value)}
				/>
			</div>
		)
	},
}
