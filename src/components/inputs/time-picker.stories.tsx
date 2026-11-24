import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'

import { Field, FieldGroup } from './field'
import { TimePicker } from './time-picker'

/**
 * 時刻の入力欄。手で打つことも、右のボタンで時刻の一覧を開いて選ぶこともできる。
 * 値は `HH:MM` の文字（24 時間）で、`<input type="time">` と同じ形。
 *
 * 一覧は 30 分きざみ（`step` で変えられる）。手で打つときは 1 分きざみで入れられる。
 */
const meta = {
	title: '入力/TimePicker',
	id: 'time-picker',
	component: TimePicker,
} satisfies Meta<typeof TimePicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
	render: () => {
		const [value, setValue] = React.useState('09:30')
		return (
			<div className='grid w-32 gap-2'>
				<TimePicker aria-label='開始' value={value} onValueChange={setValue} />
				<p className='text-xs text-muted-foreground'>値: {value || '（空）'}</p>
			</div>
		)
	},
}

export const 開いたところ: Story = {
	render: () => (
		<div className='h-80 w-32'>
			<TimePicker aria-label='開始' defaultValue='09:30' defaultOpen />
		</div>
	),
}

/** 値が無いときは、一覧を 9:00 のあたりから見せる（`scrollTo` で変えられる） */
export const 空: Story = {
	render: () => (
		<div className='h-80 w-32'>
			<TimePicker aria-label='開始' defaultOpen />
		</div>
	),
}

/** 9:00〜18:00 だけ選べて、一覧は 15 分きざみ。範囲の外を手で打っても、元の値に戻る */
export const 範囲ときざみ: Story = {
	render: () => (
		<div className='h-80 w-32'>
			<TimePicker
				aria-label='予約の時刻'
				defaultValue='10:15'
				min='09:00'
				max='18:00'
				step={15}
				defaultOpen
			/>
		</div>
	),
}

/** シフトや営業時間のように、開始と終了を並べる */
export const 開始と終了: Story = {
	render: () => {
		const [start, setStart] = React.useState('09:00')
		const [end, setEnd] = React.useState('18:00')
		return (
			<FieldGroup columns={2} className='w-72'>
				<Field label='開始'>
					<TimePicker value={start} onValueChange={setStart} required />
				</Field>
				<Field
					label='終了'
					error={
						end && start && end <= start
							? '開始より後にしてください。'
							: undefined
					}
				>
					<TimePicker value={end} onValueChange={setEnd} required />
				</Field>
			</FieldGroup>
		)
	},
}

export const 使えない: Story = {
	render: () => (
		<div className='grid w-32 gap-2'>
			<TimePicker aria-label='使えない' defaultValue='09:30' disabled />
			<TimePicker aria-label='読むだけ' defaultValue='09:30' readOnly />
		</div>
	),
}
